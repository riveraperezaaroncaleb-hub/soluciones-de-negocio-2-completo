'use strict';

const { Appointment, Usuario, Service } = require('../models');

const fields = ['usuarioId', 'serviceId', 'fechaHora', 'estado', 'notas'];
const requiredFields = ['usuarioId', 'serviceId', 'fechaHora'];
const statuses = ['pendiente', 'confirmada', 'completada', 'cancelada'];

function validateAppointment(body, { partial = false } = {}) {
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

  for (const field of ['usuarioId', 'serviceId']) {
    if (Object.hasOwn(body, field) && (!Number.isInteger(body[field]) || body[field] < 1)) {
      return `${field} debe ser un entero positivo`;
    }
  }

  if (
    Object.hasOwn(body, 'fechaHora') &&
    (typeof body.fechaHora !== 'string' || body.fechaHora.trim() === '' || !Number.isFinite(Date.parse(body.fechaHora)))
  ) {
    return 'fechaHora debe ser una fecha y hora válida';
  }

  if (Object.hasOwn(body, 'estado') && !statuses.includes(body.estado)) {
    return `estado debe ser uno de estos valores: ${statuses.join(', ')}`;
  }

  if (Object.hasOwn(body, 'notas') && body.notas !== null && typeof body.notas !== 'string') {
    return 'notas debe ser un texto o null';
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

  if (Object.hasOwn(data, 'serviceId') && !(await Service.findByPk(data.serviceId))) {
    res.status(404).json({ error: 'Servicio no encontrado' });
    return false;
  }

  return true;
}

const include = [
  { model: Usuario, as: 'usuario' },
  { model: Service, as: 'service' },
];

async function create(req, res, next) {
  const validationError = validateAppointment(req.body);
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

    const appointment = await Appointment.create(data);
    res.status(201).json(await Appointment.findByPk(appointment.id, { include }));
  } catch (error) {
    next(error);
  }
}

async function getAll(req, res, next) {
  try {
    res.json(await Appointment.findAll({ include }));
  } catch (error) {
    next(error);
  }
}

async function getById(req, res, next) {
  if (!validateId(req.params.id)) {
    return res.status(400).json({ error: 'El id debe ser un entero positivo' });
  }

  try {
    const appointment = await Appointment.findByPk(req.params.id, { include });
    if (!appointment) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }
    res.json(appointment);
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  if (!validateId(req.params.id)) {
    return res.status(400).json({ error: 'El id debe ser un entero positivo' });
  }

  const validationError = validateAppointment(req.body, { partial: true });
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  try {
    const appointment = await Appointment.findByPk(req.params.id);
    if (!appointment) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    const changes = Object.fromEntries(
      fields
        .filter((field) => Object.hasOwn(req.body, field))
        .map((field) => [field, req.body[field]])
    );
    if (!(await validateReferences(changes, res))) {
      return;
    }

    await appointment.update(changes);
    res.json(await Appointment.findByPk(appointment.id, { include }));
  } catch (error) {
    next(error);
  }
}

async function remove(req, res, next) {
  if (!validateId(req.params.id)) {
    return res.status(400).json({ error: 'El id debe ser un entero positivo' });
  }

  try {
    const appointment = await Appointment.findByPk(req.params.id);
    if (!appointment) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    await appointment.destroy();
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

module.exports = { create, getAll, getById, update, remove };
