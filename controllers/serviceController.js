'use strict';

const { Service } = require('../models');

const fields = ['nombre', 'descripcion', 'precio', 'duracionMinutos', 'barbershopId'];
const requiredFields = ['nombre', 'precio', 'duracionMinutos', 'barbershopId'];

function validateService(body, { partial = false } = {}) {
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

  if (Object.hasOwn(body, 'nombre') && (typeof body.nombre !== 'string' || body.nombre.trim() === '')) {
    return 'nombre debe ser un texto no vacío';
  }

  if (Object.hasOwn(body, 'descripcion') && typeof body.descripcion !== 'string') {
    return 'descripcion debe ser un texto';
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

  if (
    Object.hasOwn(body, 'duracionMinutos') &&
    (!Number.isInteger(body.duracionMinutos) || body.duracionMinutos < 1)
  ) {
    return 'duracionMinutos debe ser un entero positivo';
  }

  if (
    Object.hasOwn(body, 'barbershopId') &&
    (!Number.isInteger(body.barbershopId) || body.barbershopId < 1)
  ) {
    return 'barbershopId debe ser un entero positivo';
  }

  return null;
}

function validateId(id) {
  return /^\d+$/.test(id) && Number(id) > 0;
}

async function create(req, res, next) {
  const validationError = validateService(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  try {
    const data = Object.fromEntries(
      fields
        .filter((field) => Object.hasOwn(req.body, field))
        .map((field) => [field, req.body[field]])
    );
    data.nombre = data.nombre.trim();
    if (Object.hasOwn(data, 'descripcion')) {
      data.descripcion = data.descripcion.trim();
    }
    const service = await Service.create(data);
    res.status(201).json(service);
  } catch (error) {
    next(error);
  }
}

async function getAll(req, res, next) {
  try {
    const services = await Service.findAll();
    res.json(services);
  } catch (error) {
    next(error);
  }
}

async function getById(req, res, next) {
  if (!validateId(req.params.id)) {
    return res.status(400).json({ error: 'El id debe ser un entero positivo' });
  }

  try {
    const service = await Service.findByPk(req.params.id);
    if (!service) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }
    res.json(service);
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  if (!validateId(req.params.id)) {
    return res.status(400).json({ error: 'El id debe ser un entero positivo' });
  }

  const validationError = validateService(req.body, { partial: true });
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  try {
    const service = await Service.findByPk(req.params.id);
    if (!service) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    const changes = Object.fromEntries(
      fields
        .filter((field) => Object.hasOwn(req.body, field))
        .map((field) => [field, req.body[field]])
    );
    if (Object.hasOwn(changes, 'nombre')) {
      changes.nombre = changes.nombre.trim();
    }
    if (Object.hasOwn(changes, 'descripcion')) {
      changes.descripcion = changes.descripcion.trim();
    }
    await service.update(changes);
    res.json(service);
  } catch (error) {
    next(error);
  }
}

async function remove(req, res, next) {
  if (!validateId(req.params.id)) {
    return res.status(400).json({ error: 'El id debe ser un entero positivo' });
  }

  try {
    const service = await Service.findByPk(req.params.id);
    if (!service) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    await service.destroy();
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

module.exports = { create, getAll, getById, update, remove };
