'use strict';

const express = require('express');
const subscriptionController = require('../controllers/subscriptionController');

const router = express.Router();

router.route('/')
  .get(subscriptionController.getAll)
  .post(subscriptionController.create);

router.route('/:id')
  .get(subscriptionController.getById)
  .put(subscriptionController.update)
  .patch(subscriptionController.update)
  .delete(subscriptionController.remove);

module.exports = router;
