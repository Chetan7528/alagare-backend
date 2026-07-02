/**
 * Seed a dev API partner for third-party testing.
 * Run: node scripts/seedPartner.js
 */
require('module-alias/register');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const ApiPartner = require('../src/models/ApiPartner');
const { generateApiKey } = require('../src/helper/apiKey');

const seed = async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  await mongoose.connect(uri);

  const existing = await ApiPartner.findOne({ companyName: 'Dev Partner Co' });
  if (existing) {
    console.log('Dev partner already exists. keyPrefix:', existing.keyPrefix);
    process.exit(0);
  }

  const { rawKey, apiKeyHash, keyPrefix } = generateApiKey();
  await ApiPartner.create({
    companyName: 'Dev Partner Co',
    contactEmail: 'dev@partner.com',
    apiKeyHash,
    keyPrefix,
  });

  console.log('\n✅ Dev API partner created');
  console.log('X-API-Key:', rawKey);
  console.log('\nTest: GET http://localhost:3008/api/v1/health');
  console.log('Header: X-API-Key: <key above>\n');

  process.exit(0);
};

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
