require('module-alias/register');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const dns = require('dns');
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {}

const http = require('http');
const app = require('./app');
const { initSockets } = require('./sockets');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
initSockets(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(
    `Postmark: ${process.env.POSTMARK_API_TOKEN ? 'configured' : 'NOT configured — OTP emails will fail'}`,
  );
  if (process.env.POSTMARK_FROM_EMAIL) {
    console.log(`Postmark sender: ${process.env.POSTMARK_FROM_EMAIL}`);
  }
});
