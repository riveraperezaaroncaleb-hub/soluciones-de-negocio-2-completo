'use strict';

const express = require('express');
const barbershopController = require('../controllers/barbershopController');

const router = express.Router();

router.route('/')
  .get(barbershopController.getAll)
  .post(barbershopController.create);

router.route('/:id')
  .get(barbershopController.getById)
  .put(barbershopController.update)
  .patch(barbershopController.update)
  .delete(barbershopController.remove);

module.exports = router;
