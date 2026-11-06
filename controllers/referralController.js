'use strict';

const { Referral, Usuario } = require('../models');

const fields = ['referidorId', 'referidoId', 'codigo', 'estado', 'recompensa'];
const requiredFields = ['referidorId', 'referidoId', 'codigo'];
const statuses = ['pendiente', 'aceptada', 'completada', 'rechazada'];

function validateReferral(body, { partial = false } = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return 'El cuerpo de la solicitud debe ser un objeto JSON';
  }

  if (partial && !fields.some((field) => Object.hasOwn(body, field))) {
    return 'Debes proporcionar al menos un campo para actualizar';
  }

  if (!partial) {
    const missingField = requiredFields.find((field) => !Object.hasOwn(body, field));
    if (missingField) {
      return `Falta el campo ${missingField}`;
    }
  }

  for (const field of ['referidorId', 'referidoId']) {
    if (Object.hasOwn(body, field) && (!Number.isInteger(body[field]) || body[field] < 1)) {
      return `${field} debe ser un entero positivo`;
    }
  }

  if (
    Object.hasOwn(body, 'referidorId') &&
    Object.hasOwn(body, 'referidoId') &&
    body.referidorId === body.referidoId
  ) {
    return 'El usuario no puede referirse a sí mismo';
  }

  if (Object.hasOwn(body, 'codigo') && (typeof body.codigo !== 'string' || body.codigo.trim() === '')) {
    return 'codigo debe ser un texto no vacío';
  }

  if (Object.hasOwn(body, 'estado') && !statuses.includes(body.estado)) {
    return `estado debe ser uno de estos valores: ${statuses.join(', ')}`;
  }

  if (Object.hasOwn(body, 'recompensa') && body.recompensa !== null) {
    const recompensa = body.recompensa;
    if (
      (typeof recompensa !== 'number' && typeof recompensa !== 'string') ||
      !/^\d+(\.\d{1,2})?$/.test(String(recompensa)) ||
      !Number.isFinite(Number(recompensa))
    ) {
      return 'recompensa debe ser un número no negativo con hasta dos decimales o null';
    }
  }

  return null;
}

function validateId(id) {
  return /^\d+$/.test(id) && Number(id) > 0;
}

async function validateUsers(data, res) {
  for (const [field, label] of [['referidorId', 'Referidor'], ['referidoId', 'Referido']]) {
    if (Object.hasOwn(data, field) && !(await Usuario.findByPk(data[field]))) {
      res.status(404).json({ error: `${label} no encontrado` });
      return false;
    }
  }
  return true;
}

const include = [
  { model: Usuario, as: 'referidor' },
  { model: Usuario, as: 'referido' },
];

async function create(req, res, next) {
  const validationError = validateReferral(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  try {
    const data = Object.fromEntries(
      fields
        .filter((field) => Object.hasOwn(req.body, field))
        .map((field) => [field, req.body[field]])
    );
    data.codigo = data.codigo.trim();
    if (!(await validateUsers(data, res))) {
      return;
    }

    const referral = await Referral.create(data);
    res.status(201).json(await Referral.findByPk(referral.id, { include }));
  } catch (error) {
    next(error);
  }
}

async function getAll(req, res, next) {
  try {
    res.json(await Referral.findAll({ include }));
  } catch (error) {
    next(error);
  }
}

async function getById(req, res, next) {
  if (!validateId(req.params.id)) {
    return res.status(400).json({ error: 'El id debe ser un entero positivo' });
  }

  try {
    const referral = await Referral.findByPk(req.params.id, { include });
    if (!referral) {
      return res.status(404).json({ error: 'Referencia no encontrada' });
    }
    res.json(referral);
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  if (!validateId(req.params.id)) {
    return res.status(400).json({ error: 'El id debe ser un entero positivo' });
  }

  const validationError = validateReferral(req.body, { partial: true });
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  try {
    const referral = await Referral.findByPk(req.params.id);
    if (!referral) {
      return res.status(404).json({ error: 'Referencia no encontrada' });
    }

    const changes = Object.fromEntries(
      fields
        .filter((field) => Object.hasOwn(req.body, field))
        .map((field) => [field, req.body[field]])
    );
    if (Object.hasOwn(changes, 'codigo')) {
      changes.codigo = changes.codigo.trim();
    }

    const updatedValues = { ...referral.get(), ...changes };
    if (updatedValues.referidorId === updatedValues.referidoId) {
      return res.status(400).json({ error: 'El usuario no puede referirse a sí mismo' });
    }
    if (!(await validateUsers(changes, res))) {
      return;
    }

    await referral.update(changes);
    res.json(await Referral.findByPk(referral.id, { include }));
  } catch (error) {
    next(error);
  }
}

async function remove(req, res, next) {
  if (!validateId(req.params.id)) {
    return res.status(400).json({ error: 'El id debe ser un entero positivo' });
  }

  try {
    const referral = await Referral.findByPk(req.params.id);
    if (!referral) {
      return res.status(404).json({ error: 'Referencia no encontrada' });
    }

    await referral.destroy();
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

module.exports = { create, getAll, getById, update, remove };
