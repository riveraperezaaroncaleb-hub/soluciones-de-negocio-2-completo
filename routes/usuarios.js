'use strict';

const express = require('express');
const usuarioController = require('../controllers/usuarioController');

const router = express.Router();

router.route('/')
  .get(usuarioController.getAll)
  .post(usuarioController.create);

router.route('/:id')
  .get(usuarioController.getById)
  .put(usuarioController.update)
  .patch(usuarioController.update)
  .delete(usuarioController.remove);

module.exports = router;
