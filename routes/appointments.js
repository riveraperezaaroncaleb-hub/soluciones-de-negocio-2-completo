'use strict';

const express = require('express');
const appointmentController = require('../controllers/appointmentController');

const router = express.Router();

router.route('/')
  .get(appointmentController.getAll)
  .post(appointmentController.create);

router.route('/:id')
  .get(appointmentController.getById)
  .put(appointmentController.update)
  .patch(appointmentController.update)
  .delete(appointmentController.remove);

module.exports = router;
