'use strict';

const { Usuario } = require('../models');

const fields = ['nombre', 'edad'];

function validateUsuario(body, { partial = false } = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return 'El cuerpo de la solicitud debe ser un objeto JSON';
  }

  if (partial && !fields.some((field) => Object.hasOwn(body, field))) {
    return 'Debes proporcionar al menos un campo para actualizar';
  }

  for (const field of fields) {
    if (!partial && !Object.hasOwn(body, field)) {
      return `Falta el campo ${field}`;
    }
  }

  if (Object.hasOwn(body, 'nombre') && (typeof body.nombre !== 'string' || body.nombre.trim() === '')) {
    return 'nombre debe ser un texto no vacío';
  }

  if (Object.hasOwn(body, 'edad') && (!Number.isInteger(body.edad) || body.edad < 0)) {
    return 'edad debe ser un entero no negativo';
  }

  return null;
}

function validateId(id) {
  return /^\d+$/.test(id) && Number(id) > 0;
}

async function create(req, res, next) {
  const validationError = validateUsuario(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  try {
    const usuario = await Usuario.create({
      nombre: req.body.nombre.trim(),
      edad: req.body.edad,
    });
    res.status(201).json(usuario);
  } catch (error) {
    next(error);
  }
}

async function getAll(req, res, next) {
  try {
    const usuarios = await Usuario.findAll();
    res.json(usuarios);
  } catch (error) {
    next(error);
  }
}

async function getById(req, res, next) {
  if (!validateId(req.params.id)) {
    return res.status(400).json({ error: 'El id debe ser un entero positivo' });
  }

  try {
    const usuario = await Usuario.findByPk(req.params.id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(usuario);
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  if (!validateId(req.params.id)) {
    return res.status(400).json({ error: 'El id debe ser un entero positivo' });
  }

  const validationError = validateUsuario(req.body, { partial: true });
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  try {
    const usuario = await Usuario.findByPk(req.params.id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const changes = Object.fromEntries(
      fields
        .filter((field) => Object.hasOwn(req.body, field))
        .map((field) => [field, req.body[field]])
    );
    if (Object.hasOwn(changes, 'nombre')) {
      changes.nombre = changes.nombre.trim();
    }
    await usuario.update(changes);
    res.json(usuario);
  } catch (error) {
    next(error);
  }
}

async function remove(req, res, next) {
  if (!validateId(req.params.id)) {
    return res.status(400).json({ error: 'El id debe ser un entero positivo' });
  }

  try {
    const usuario = await Usuario.findByPk(req.params.id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    await usuario.destroy();
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

module.exports = { create, getAll, getById, update, remove };
