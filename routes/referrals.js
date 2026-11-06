'use strict';

const express = require('express');
const referralController = require('../controllers/referralController');

const router = express.Router();

router.route('/')
  .get(referralController.getAll)
  .post(referralController.create);

router.route('/:id')
  .get(referralController.getById)
  .put(referralController.update)
  .patch(referralController.update)
  .delete(referralController.remove);

module.exports = router;
