'use strict';
const express = require('express');
const router = express.Router();
const {
  createPartner,
  listPartners,
  togglePartner,
} = require('@controllers/partnerController');
const auth = require('@middlewares/authMiddleware');

router.post('/', auth('admin'), createPartner);
router.get('/', auth('admin'), listPartners);
router.put('/toggle', auth('admin'), togglePartner);

module.exports = router;
