'use strict';

const crypto = require('crypto');

const MERCHANT_ID = process.env.SYCAPAY_MERCHANT_ID;
const API_KEY = process.env.SYCAPAY_API_KEY;
const SECRET_KEY = process.env.SYCAPAY_SECRET_KEY;
const BASE_URL = (process.env.SYCAPAY_BASE_URL || 'https://dev.sycapay.net/api').replace(/\/+$/, '');
const CASHOUT_BASE_URL = (process.env.SYCAPAY_CASHOUT_URL || 'https://www.sycaretail.com/delivery/v1').replace(/\/+$/, '');

const normalizePhone = (phone) => {
  let cleaned = String(phone || '').replace(/\D/g, '');
  if (cleaned.startsWith('225') && cleaned.length > 10) {
    cleaned = cleaned.slice(3);
  }
  return cleaned;
};

const login = async (amount = 100, currency = 'XOF') => {
  const res = await fetch(`${BASE_URL}/login.php`, {
    method: 'POST',
    headers: {
      'X-SYCA-MERCHANDID': MERCHANT_ID,
      'X-SYCA-APIKEY': API_KEY,
      'X-SYCA-REQUEST-DATA-FORMAT': 'JSON',
      'X-SYCA-RESPONSE-DATA-FORMAT': 'JSON',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      montant: String(amount),
      currency,
    }),
  });
  return res.json();
};

const checkout = async ({
  operator,
  phone,
  otp,
  amount,
  currency = 'XOF',
  orderId,
  name,
  pname,
  urlnotif,
}) => {
  const cleanNum = normalizePhone(phone);
  const numAmount = Math.max(1, Math.round(Number(amount) || 100));
  const loginData = await login(numAmount, currency);

  if (!loginData || loginData.code !== 0 || !loginData.token) {
    const errorMsg = loginData?.desc || loginData?.message || 'Authentication with SycaPay failed';
    const err = new Error(errorMsg);
    err.code = loginData?.code;
    throw err;
  }

  const payload = {
    marchandid: MERCHANT_ID,
    token: loginData.token,
    telephone: cleanNum,
    name: String(name || 'Customer').trim(),
    pname: String(pname || 'User').trim(),
    urlnotif: urlnotif || '',
    montant: String(numAmount),
    currency,
    numcommande: String(orderId || `CMD_${Date.now()}`),
  };

  const opLower = String(operator || '').toLowerCase();
  if (opLower.includes('orange')) {
    if (!otp) {
      throw new Error('OTP is required for Orange Money');
    }
    payload.otp = String(otp).trim();
  } else if (opLower.includes('wave')) {
    payload.pays = 'CI';
    payload.operateurs = 'WaveSN';
  }

  const res = await fetch(`${BASE_URL}/checkoutpay.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return res.json();
};

const getStatus = async (reference) => {
  const res = await fetch(`${BASE_URL}/GetStatus.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ref: String(reference).trim(),
    }),
  });
  return res.json();
};

const cashoutAuth = async () => {
  const res = await fetch(`${CASHOUT_BASE_URL}/authentification`, {
    method: 'POST',
    headers: {
      'X-SYCA-MERCHANDID': MERCHANT_ID,
      'X-SYCA-APIKEY': API_KEY,
      'X-SYCA-REQUEST-DATA-FORMAT': 'JSON',
      'X-SYCA-RESPONSE-DATA-FORMAT': 'JSON',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ language: 'fr' }),
  });
  return res.json();
};

const cashout = async ({
  amount,
  currency = 'XOF',
  phone,
  provider = 'Orange',
  orderId,
  recipientName = 'Operator',
  comment = 'Operator withdrawal payout',
}) => {
  const cleanPhone = phone ? (String(phone).startsWith('+') ? String(phone) : `+225${normalizePhone(phone)}`) : '';
  const numAmount = Math.max(1, Math.round(Number(amount) || 100));
  const authRes = await cashoutAuth();

  if (!authRes || authRes.code !== 0 || !authRes.token) {
    const errMsg = authRes?.description || authRes?.message || 'Cashout authentication failed';
    const err = new Error(errMsg);
    err.code = authRes?.code;
    err.raw = authRes;
    throw err;
  }

  const dataToHash = `${numAmount}${MERCHANT_ID}${SECRET_KEY}`;
  const authorization = crypto.createHmac('sha256', SECRET_KEY).update(dataToHash).digest('hex');

  const payload = {
    orderid: String(orderId || `WD_${Date.now()}`),
    typetransfer: '1',
    orderparty: 'sycatransf',
    connectuser: 'Alagare',
    connecteduser: 'Alagare',
    recipientident: String(recipientName || 'Operator').trim(),
    amount: String(numAmount),
    currency,
    language: 'FR',
    urlcancel: '',
    urlsuccess: '',
    recipientmobile: cleanPhone,
    provider: String(provider || 'Orange').trim(),
    commentaire: String(comment || 'Operator withdrawal payout').trim(),
  };

  const isWave = String(provider).toLowerCase().includes('wave');
  const endpoint = isWave ? `${CASHOUT_BASE_URL}/checktransferwave` : `${CASHOUT_BASE_URL}/checktransfer`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'X-SYCA-MERCHANDID': MERCHANT_ID,
      'TOKEN': authRes.token,
      'AUTHORIZATION': authorization,
      'X-SYCA-REQUEST-DATA-FORMAT': 'JSON',
      'X-SYCA-RESPONSE-DATA-FORMAT': 'JSON',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return res.json();
};

const getCashoutStatus = async (orderId) => {
  const res = await fetch(`${CASHOUT_BASE_URL}/getStatusByOrderID.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      reference: String(orderId).trim(),
      merchantid: MERCHANT_ID,
    }).toString(),
  });
  return res.json();
};

module.exports = {
  login,
  checkout,
  getStatus,
  normalizePhone,
  cashoutAuth,
  cashout,
  getCashoutStatus,
};
