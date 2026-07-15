'use strict';
const express = require('express');
const setupController = require('@controllers/setupController');

const router = express.Router();

router.get('/:appName', setupController.getByAppName);

module.exports = router;
