require('dotenv').config();
const mongoose = require('mongoose');

async function dropIndexes() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();

  for (const col of collections) {
    try {
      await db.collection(col.name).dropIndexes();
      console.log(`Dropped indexes for: ${col.name}`);
    } catch (err) {
      console.error(`Failed for ${col.name}:`, err.message);
    }
  }

  await mongoose.disconnect();
  console.log('Done.');
}

dropIndexes();
