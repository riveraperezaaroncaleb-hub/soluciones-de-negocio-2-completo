'use strict';

const { Barbershop } = require('../models');

const fields = ['nombre', 'direccion', 'telefono'];

function validateBarbershop(body, { partial = false } = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return 'El cuerpo de la solicitud debe ser un objeto JSON';
  }

  if (partial && !fields.some((field) => Object.hasOwn(body, field))) {
    return 'Debes proporcionar al menos un campo para actualizar';
  }

  for (const field of fields) {
    if (Object.hasOwn(body, field) && (typeof body[field] !== 'string' || body[field].trim() === '')) {
      return `${field} debe ser un texto no vacío`;
    }

    if (!partial && !Object.hasOwn(body, field)) {
      return `Falta el campo ${field}`;
    }
  }

  return null;
}

function validateId(id) {
  return /^\d+$/.test(id) && Number(id) > 0;
}

async function create(req, res, next) {
  const validationError = validateBarbershop(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  try {
    const barbershop = await Barbershop.create({
      nombre: req.body.nombre.trim(),
      direccion: req.body.direccion.trim(),
      telefono: req.body.telefono.trim(),
    });
    res.status(201).json(barbershop);
  } catch (error) {
    next(error);
  }
}

async function getAll(req, res, next) {
  try {
    const barbershops = await Barbershop.findAll();
    res.json(barbershops);
  } catch (error) {
    next(error);
  }
}

async function getById(req, res, next) {
  if (!validateId(req.params.id)) {
    return res.status(400).json({ error: 'El id debe ser un entero positivo' });
  }

  try {
    const barbershop = await Barbershop.findByPk(req.params.id);
    if (!barbershop) {
      return res.status(404).json({ error: 'Barbershop no encontrado' });
    }
    res.json(barbershop);
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  if (!validateId(req.params.id)) {
    return res.status(400).json({ error: 'El id debe ser un entero positivo' });
  }

  const validationError = validateBarbershop(req.body, { partial: true });
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  try {
    const barbershop = await Barbershop.findByPk(req.params.id);
    if (!barbershop) {
      return res.status(404).json({ error: 'Barbershop no encontrado' });
    }

    const changes = Object.fromEntries(
      fields
        .filter((field) => Object.hasOwn(req.body, field))
        .map((field) => [field, req.body[field].trim()])
    );
    await barbershop.update(changes);
    res.json(barbershop);
  } catch (error) {
    next(error);
  }
}

async function remove(req, res, next) {
  if (!validateId(req.params.id)) {
    return res.status(400).json({ error: 'El id debe ser un entero positivo' });
  }

  try {
    const barbershop = await Barbershop.findByPk(req.params.id);
    if (!barbershop) {
      return res.status(404).json({ error: 'Barbershop no encontrado' });
    }

    await barbershop.destroy();
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

module.exports = { create, getAll, getById, update, remove };
