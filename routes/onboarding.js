'use strict';

const crypto = require('crypto');
const express = require('express');
const { Barbershop, Service, Usuario, sequelize } = require('../models');

const router = express.Router();

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function validPhone(phone) {
  return typeof phone === 'string' && phone.replace(/\D/g, '').length >= 7;
}

router.post('/register', async (req, res, next) => {
  const { nombre, telefono, password } = req.body || {};
  if (
    typeof nombre !== 'string' ||
    !nombre.trim() ||
    !validPhone(telefono) ||
    typeof password !== 'string' ||
    password.length < 6
  ) {
    return res.status(400).json({ error: 'Nombre, teléfono válido y contraseña de al menos 6 caracteres son requeridos' });
  }

  try {
    const phone = telefono.trim();
    const existing = await Usuario.findOne({ where: { telefono: phone } });
    if (existing) {
      return res.status(409).json({ error: 'Este teléfono ya tiene una cuenta' });
    }

    const user = await Usuario.create({
      nombre: nombre.trim(),
      telefono: phone,
      passwordHash: hashPassword(password),
    });
    res.status(201).json({
      user: { id: user.id, nombre: user.nombre, telefono: user.telefono },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/setup', async (req, res, next) => {
  const { userId, services, hours } = req.body || {};
  if (
    !Number.isInteger(userId) ||
    userId < 1 ||
    !Array.isArray(services) ||
    services.length === 0 ||
    !Array.isArray(hours)
  ) {
    return res.status(400).json({ error: 'Usuario, al menos un servicio y horarios son requeridos' });
  }

  const validServices = services.every((service) =>
    typeof service.nombre === 'string' &&
    service.nombre.trim() &&
    Number.isFinite(Number(service.precio)) &&
    Number(service.precio) >= 0 &&
    Number.isInteger(service.duracionMinutos) &&
    service.duracionMinutos > 0
  );
  if (!validServices) {
    return res.status(400).json({ error: 'Revisa nombre, precio y duración de cada servicio' });
  }

  try {
    const result = await sequelize.transaction(async (transaction) => {
      const user = await Usuario.findByPk(userId, { transaction });
      if (!user) {
        const error = new Error('Usuario no encontrado');
        error.status = 404;
        throw error;
      }

      const shop = await Barbershop.create({
        nombre: `Barbería ${user.nombre}`,
        telefono: user.telefono,
        ownerId: user.id,
        horarios: hours,
      }, { transaction });

      const createdServices = await Service.bulkCreate(
        services.map((service) => ({
          nombre: service.nombre.trim(),
          descripcion: service.descripcion || null,
          precio: Number(service.precio),
          duracionMinutos: service.duracionMinutos,
          barbershopId: shop.id,
        })),
        { transaction, returning: true }
      );

      return { shop, services: createdServices };
    });

    res.status(201).json({
      barbershop: result.shop,
      services: result.services,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
