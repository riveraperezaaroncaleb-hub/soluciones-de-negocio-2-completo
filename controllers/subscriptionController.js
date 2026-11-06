'use strict';

const { Subscription, Usuario, Barbershop } = require('../models');

const fields = ['usuarioId', 'barbershopId', 'fechaInicio', 'fechaFin', 'estado', 'precio'];
const requiredFields = ['usuarioId', 'barbershopId', 'fechaInicio', 'precio'];
const statuses = ['activa', 'cancelada', 'vencida', 'pendiente'];

function isValidDateOnly(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function validateSubscription(body, { partial = false } = {}) {
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

  for (const field of ['usuarioId', 'barbershopId']) {
    if (Object.hasOwn(body, field) && (!Number.isInteger(body[field]) || body[field] < 1)) {
      return `${field} debe ser un entero positivo`;
    }
  }

  for (const field of ['fechaInicio', 'fechaFin']) {
    if (
      Object.hasOwn(body, field) &&
      !(field === 'fechaFin' && body[field] === null) &&
      !isValidDateOnly(body[field])
    ) {
      return `${field} debe tener formato YYYY-MM-DD y ser una fecha válida`;
    }
  }

  if (
    Object.hasOwn(body, 'fechaInicio') &&
    Object.hasOwn(body, 'fechaFin') &&
    body.fechaFin !== null &&
    body.fechaFin < body.fechaInicio
  ) {
    return 'fechaFin no puede ser anterior a fechaInicio';
  }

  if (Object.hasOwn(body, 'estado') && !statuses.includes(body.estado)) {
    return `estado debe ser uno de estos valores: ${statuses.join(', ')}`;
  }

  if (Object.hasOwn(body, 'precio')) {
    const precio = body.precio;
    if (
      (typeof precio !== 'number' && typeof precio !== 'string') ||
      !/^\d+(\.\d{1,2})?$/.test(String(precio)) ||
      !Number.isFinite(Number(precio))
    ) {
      return 'precio debe ser un número no negativo con hasta dos decimales';
    }
  }

  return null;
}

function validateId(id) {
  return /^\d+$/.test(id) && Number(id) > 0;
}

async function validateReferences(data, res) {
  if (Object.hasOwn(data, 'usuarioId') && !(await Usuario.findByPk(data.usuarioId))) {
    res.status(404).json({ error: 'Usuario no encontrado' });
    return false;
  }
  if (Object.hasOwn(data, 'barbershopId') && !(await Barbershop.findByPk(data.barbershopId))) {
    res.status(404).json({ error: 'Barbershop no encontrado' });
    return false;
  }
  return true;
}

const include = [
  { model: Usuario, as: 'usuario' },
  { model: Barbershop, as: 'barbershop' },
];

async function create(req, res, next) {
  const validationError = validateSubscription(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  try {
    const data = Object.fromEntries(
      fields
        .filter((field) => Object.hasOwn(req.body, field))
        .map((field) => [field, req.body[field]])
    );
    if (!(await validateReferences(data, res))) {
      return;
    }

    const subscription = await Subscription.create(data);
    res.status(201).json(await Subscription.findByPk(subscription.id, { include }));
  } catch (error) {
    next(error);
  }
}

async function getAll(req, res, next) {
  try {
    res.json(await Subscription.findAll({ include }));
  } catch (error) {
    next(error);
  }
}

async function getById(req, res, next) {
  if (!validateId(req.params.id)) {
    return res.status(400).json({ error: 'El id debe ser un entero positivo' });
  }

  try {
    const subscription = await Subscription.findByPk(req.params.id, { include });
    if (!subscription) {
      return res.status(404).json({ error: 'Suscripción no encontrada' });
    }
    res.json(subscription);
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  if (!validateId(req.params.id)) {
    return res.status(400).json({ error: 'El id debe ser un entero positivo' });
  }

  const validationError = validateSubscription(req.body, { partial: true });
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  try {
    const subscription = await Subscription.findByPk(req.params.id);
    if (!subscription) {
      return res.status(404).json({ error: 'Suscripción no encontrada' });
    }

    const changes = Object.fromEntries(
      fields
        .filter((field) => Object.hasOwn(req.body, field))
        .map((field) => [field, req.body[field]])
    );
    if (!(await validateReferences(changes, res))) {
      return;
    }

    const updatedValues = { ...subscription.get(), ...changes };
    if (
      updatedValues.fechaFin &&
      updatedValues.fechaFin < updatedValues.fechaInicio
    ) {
      return res.status(400).json({ error: 'fechaFin no puede ser anterior a fechaInicio' });
    }

    await subscription.update(changes);
    res.json(await Subscription.findByPk(subscription.id, { include }));
  } catch (error) {
    next(error);
  }
}

async function remove(req, res, next) {
  if (!validateId(req.params.id)) {
    return res.status(400).json({ error: 'El id debe ser un entero positivo' });
  }

  try {
    const subscription = await Subscription.findByPk(req.params.id);
    if (!subscription) {
      return res.status(404).json({ error: 'Suscripción no encontrada' });
    }

    await subscription.destroy();
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

module.exports = { create, getAll, getById, update, remove };
