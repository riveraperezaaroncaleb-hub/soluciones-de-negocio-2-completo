'use strict';

const crypto = require('crypto');
const express = require('express');
const { Op } = require('sequelize');
const {
  Appointment,
  Barbershop,
  Referral,
  Service,
  Subscription,
  Usuario,
  sequelize,
} = require('../models');

const router = express.Router();

function validPhone(phone) {
  return typeof phone === 'string' && phone.replace(/\D/g, '').length >= 7;
}

function makeReferralCode(name, phone) {
  const namePart = String(name)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 14) || 'CLIENTE';
  const phonePart = phone.replace(/\D/g, '').slice(-4);
  const randomPart = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `${namePart}-${phonePart}-${randomPart}`;
}

router.get('/barbershops/:id', async (req, res, next) => {
  if (!/^\d+$/.test(req.params.id) || Number(req.params.id) < 1) {
    return res.status(400).json({ error: 'Identificador de barbería inválido' });
  }

  try {
    const barbershop = await Barbershop.findByPk(req.params.id, {
      attributes: ['id', 'nombre', 'direccion', 'telefono', 'horarios'],
      include: [{
        model: Service,
        as: 'services',
        attributes: ['id', 'nombre', 'descripcion', 'precio', 'duracionMinutos'],
      }],
    });
    if (!barbershop) {
      return res.status(404).json({ error: 'Barbería no encontrada' });
    }
    res.json(barbershop);
  } catch (error) {
    next(error);
  }
});

router.get('/referrals/:code', async (req, res, next) => {
  const code = String(req.params.code || '').trim().toUpperCase();
  const barbershopId = Number(req.query.barbershopId);
  if (!/^[A-Z0-9][A-Z0-9-]{2,63}$/.test(code)) {
    return res.status(400).json({ error: 'Código de referido inválido' });
  }
  if (!Number.isInteger(barbershopId) || barbershopId < 1) {
    return res.status(400).json({ error: 'Identificador de barbería inválido' });
  }

  try {
    const referral = await Referral.findOne({
      where: { codigo: code, barbershopId, referidoId: null, estado: 'pendiente' },
      include: [{ model: Usuario, as: 'referidor', attributes: ['id', 'telefono'] }],
    });
    if (!referral) {
      return res.status(404).json({ error: 'Código de referido no encontrado' });
    }

    const phone = typeof req.query.phone === 'string' ? req.query.phone.replace(/\D/g, '') : '';
    const ownerPhone = referral.referidor.telefono?.replace(/\D/g, '');
    if (phone && ownerPhone && phone === ownerPhone) {
      return res.status(400).json({ error: 'No puedes usar tu propio código' });
    }

    const freeHaircuts = await Referral.count({
      where: { codigo: code, referidoId: { [Op.ne]: null }, estado: 'completada' },
    });
    res.json({ code, discount: 2, freeHaircuts });
  } catch (error) {
    next(error);
  }
});

router.post('/appointments', async (req, res, next) => {
  const { barbershopId, serviceId, nombre, telefono, fecha, hora, referralCode, extra } = req.body || {};
  if (
    !Number.isInteger(Number(barbershopId)) ||
    Number(barbershopId) < 1 ||
    !Number.isInteger(Number(serviceId)) ||
    Number(serviceId) < 1 ||
    typeof nombre !== 'string' ||
    !nombre.trim() ||
    !validPhone(telefono) ||
    typeof fecha !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(fecha) ||
    typeof hora !== 'string' ||
    !/^\d{2}:\d{2}$/.test(hora) ||
    !Number.isFinite(Date.parse(`${fecha}T${hora}:00`)) ||
    (extra !== undefined && typeof extra !== 'boolean')
  ) {
    return res.status(400).json({ error: 'Barbería, servicio, nombre, teléfono, fecha y hora válidos son requeridos' });
  }

  try {
    const result = await sequelize.transaction(async (transaction) => {
      const shop = await Barbershop.findByPk(Number(barbershopId), { transaction });
      const service = await Service.findByPk(Number(serviceId), { transaction });
      if (!shop || !service || service.barbershopId !== shop.id) {
        const error = new Error('La barbería o el servicio no existe');
        error.status = 404;
        throw error;
      }

      const [customer] = await Usuario.findOrCreate({
        where: { telefono: telefono.trim() },
        defaults: { nombre: nombre.trim(), telefono: telefono.trim(), edad: 18 },
        transaction,
      });

      let referrer = null;
      if (referralCode) {
        if (typeof referralCode !== 'string' || referralCode.length > 64) {
          const error = new Error('Código de referido inválido');
          error.status = 400;
          throw error;
        }
        const referral = await Referral.findOne({
          where: {
            codigo: referralCode.trim().toUpperCase(),
            barbershopId: shop.id,
            referidoId: null,
            estado: 'pendiente',
          },
          transaction,
          lock: transaction.LOCK.UPDATE,
        });
        if (!referral) {
          const error = new Error('El código de referido no existe o ya fue utilizado');
          error.status = 400;
          throw error;
        }
        if (referral.referidorId === customer.id) {
          const error = new Error('No puedes usar tu propio código');
          error.status = 400;
          throw error;
        }
        referrer = referral;
      }

      const appointment = await Appointment.create({
        usuarioId: customer.id,
        serviceId: service.id,
        fechaHora: new Date(`${fecha}T${hora}:00`),
        estado: 'pendiente',
        notas: extra ? 'Lavado premium' : null,
        total: Math.max(0, Number(service.precio) + (extra ? 3 : 0) - (referrer ? 2 : 0)),
      }, { transaction });

      const customerReferralCode = makeReferralCode(nombre, telefono);
      await Referral.create({
        referidorId: customer.id,
        referidoId: null,
        codigo: customerReferralCode,
        barbershopId: shop.id,
        estado: 'pendiente',
        recompensa: null,
      }, { transaction });

      if (referrer) {
        await Referral.create({
          referidorId: referrer.referidorId,
          referidoId: customer.id,
          codigo: referrer.codigo,
          barbershopId: shop.id,
          estado: 'completada',
          recompensa: service.precio,
        }, { transaction });
      }

      return {
        appointment: {
          id: appointment.id,
          fechaHora: appointment.fechaHora,
          estado: appointment.estado,
          customerName: customer.nombre,
          serviceName: service.nombre,
          total: Number(appointment.total),
        },
        referralCode: customerReferralCode,
        referralRewarded: Boolean(referrer),
      };
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/subscriptions', async (req, res, next) => {
  const { barbershopId, nombre, telefono } = req.body || {};
  if (
    !Number.isInteger(Number(barbershopId)) ||
    Number(barbershopId) < 1 ||
    typeof nombre !== 'string' ||
    !nombre.trim() ||
    !validPhone(telefono)
  ) {
    return res.status(400).json({ error: 'Barbería, nombre y teléfono válidos son requeridos' });
  }

  try {
    const subscription = await sequelize.transaction(async (transaction) => {
      const shop = await Barbershop.findByPk(Number(barbershopId), { transaction });
      if (!shop) {
        const error = new Error('Barbería no encontrada');
        error.status = 404;
        throw error;
      }

      const [customer] = await Usuario.findOrCreate({
        where: { telefono: telefono.trim() },
        defaults: { nombre: nombre.trim(), telefono: telefono.trim(), edad: 18 },
        transaction,
      });
      const existing = await Subscription.findOne({
        where: { usuarioId: customer.id, barbershopId: shop.id, estado: 'activa' },
        transaction,
      });
      if (existing) {
        const error = new Error('Ya tienes un Pase VIP activo en esta barbería');
        error.status = 409;
        throw error;
      }

      const start = new Date();
      const end = new Date(start);
      end.setUTCDate(end.getUTCDate() + 30);
      return Subscription.create({
        usuarioId: customer.id,
        barbershopId: shop.id,
        fechaInicio: start.toISOString().slice(0, 10),
        fechaFin: end.toISOString().slice(0, 10),
        estado: 'activa',
        precio: 29,
      }, { transaction });
    });

    res.status(201).json({
      subscription: {
        id: subscription.id,
        fechaInicio: subscription.fechaInicio,
        fechaFin: subscription.fechaFin,
        estado: subscription.estado,
        precio: subscription.precio,
      },
      paymentProcessed: false,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
