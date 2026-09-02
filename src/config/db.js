const mongoose = require('mongoose');
const dns = require('dns');

if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {}

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGO_URI is missing in .env file');
    }
    await mongoose.connect(uri);

    console.log('MongoDB connected ✅');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
