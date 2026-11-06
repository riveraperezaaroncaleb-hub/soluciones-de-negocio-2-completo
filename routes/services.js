'use strict';

const express = require('express');
const serviceController = require('../controllers/serviceController');

const router = express.Router();

router.route('/')
  .get(serviceController.getAll)
  .post(serviceController.create);

router.route('/:id')
  .get(serviceController.getById)
  .put(serviceController.update)
  .patch(serviceController.update)
  .delete(serviceController.remove);

module.exports = router;
