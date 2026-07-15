'use strict';
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const passport = require('passport');
const connectDB = require('@config/db');
const { seedBusData } = require('@lib/seedBusData');
const { seedDefaultApiUser } = require('@lib/seedApiUser');

require('dotenv').config();
require('@config/passport');

const app = express();

connectDB().then(async () => {
  try {
    await seedDefaultApiUser();
    await seedBusData();
  } catch (err) {
    console.error('Seed error:', err.message);
  }
});

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(passport.initialize());


const apiKeyAuth = require('@middlewares/apiKeyMiddleware');
app.use((req, res, next) => {
  if (req.path.startsWith('/api-users')) {
    return next();
  }
  // Public bootstrap: app fetches X-API-Key by setup name (no key required)
  if (req.path.startsWith('/setup')) {
    return next();
  }
  if (req.path === '/' || req.path === '') {
    return next();
  }
  return apiKeyAuth(req, res, next);
});

const routes = require('./routes');
routes(app);

app.get('/', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong!' });
});

module.exports = app;
