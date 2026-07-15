'use strict';
const express = require('express');
const router = express.Router();
const {
  create,
  getAll,
  getById,
  update,
  regenerateKey,
  remove,
} = require('@controllers/apiUserController');
const auth = require('@middlewares/authMiddleware');

router.post('/', auth('admin'), create);
router.get('/', auth('admin'), getAll);
router.get('/:id', auth('admin'), getById);
router.put('/:id', auth('admin'), update);
router.post('/:id/regenerate', auth('admin'), regenerateKey);
router.delete('/:id', auth('admin'), remove);

module.exports = router;
