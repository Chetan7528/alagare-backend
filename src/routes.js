const authRoutes = require('@routes/authRoutes');
const adminRoutes = require('@routes/adminRoutes');
const apiUserRoutes = require('@routes/apiUserRoute');
const setupRoutes = require('@routes/setupRoutes');
const v1Routes = require('@routes/v1');
const operatorApplicationController = require('@controllers/operatorApplicationController');
const apiKeyAuth = require('@middlewares/apiKeyMiddleware');
const auth = require('@middlewares/authMiddleware');
const multer = require('multer');
const multerS3 = require('multer-s3');
const { s3, upload } = require('@services/fileUpload');

const docUpload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (_req, file, cb) => {
      const safeName = file.originalname.replace(/\s+/g, '_');
      cb(null, `operator-docs/${Date.now()}-${safeName}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Invalid file type'), false);
  },
});

const docFields = docUpload.fields([
  { name: 'registration', maxCount: 1 },
  { name: 'permit', maxCount: 1 },
  { name: 'vehicle', maxCount: 1 },
  { name: 'insurance', maxCount: 1 },
  { name: 'bank', maxCount: 1 },
  { name: 'id', maxCount: 1 },
]);

module.exports = (app) => {
  app.use('/api-users', apiUserRoutes);
  app.use('/setup', setupRoutes);
  app.use('/auth', authRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/v1', v1Routes);

  app.post('/api/operator/apply', apiKeyAuth, docFields, operatorApplicationController.submit);
  app.get('/api/operator/applications', apiKeyAuth, auth('admin'), operatorApplicationController.getAll);
  app.put('/api/operator/applications/:id/status', apiKeyAuth, auth('admin'), operatorApplicationController.updateStatus);

  const phoneOtpController = require('@controllers/phoneOtpController');
  app.post('/api/operator/send-otp', apiKeyAuth, phoneOtpController.sendOtp);
  app.post('/api/operator/verify-otp', apiKeyAuth, phoneOtpController.verifyOtp);
  app.post('/api/operator/login', apiKeyAuth, phoneOtpController.operatorLogin);

  const fleetCtrl = require('@controllers/operatorFleetController');
  const authOperator = require('@middlewares/authMiddleware');
  app.get('/api/operator/fleet/routes', apiKeyAuth, authOperator('operator'), fleetCtrl.listRoutes);
  app.post('/api/operator/fleet/routes', apiKeyAuth, authOperator('operator'), fleetCtrl.createRoute);
  app.put('/api/operator/fleet/routes/:id', apiKeyAuth, authOperator('operator'), fleetCtrl.updateRoute);
  app.delete('/api/operator/fleet/routes/:id', apiKeyAuth, authOperator('operator'), fleetCtrl.deleteRoute);
  app.get('/api/operator/fleet/bus-types', apiKeyAuth, authOperator('operator'), fleetCtrl.listBusTypes);
  app.post('/api/operator/fleet/bus-types', apiKeyAuth, authOperator('operator'), fleetCtrl.createBusType);
  app.delete('/api/operator/fleet/bus-types/:id', apiKeyAuth, authOperator('operator'), fleetCtrl.deleteBusType);
  app.get('/api/operator/fleet/cities', apiKeyAuth, authOperator('operator'), fleetCtrl.listCities);
  app.get('/api/operator/bookings', apiKeyAuth, authOperator('operator'), fleetCtrl.listBookings);
  app.put('/api/operator/bookings/:id/status', apiKeyAuth, authOperator('operator'), fleetCtrl.updateBookingStatus);
  app.get('/api/operator/revenue', apiKeyAuth, authOperator('operator'), fleetCtrl.getOperatorRevenue);
  app.post('/api/operator/payout-request', apiKeyAuth, authOperator('operator'), fleetCtrl.requestPayout);
  app.get('/api/operator/reports', apiKeyAuth, authOperator('operator'), fleetCtrl.getOperatorReports);
  app.get('/api/operator/profile', apiKeyAuth, authOperator('operator'), fleetCtrl.getProfile);
  app.put('/api/operator/profile', apiKeyAuth, authOperator('operator'), upload.single('logo'), fleetCtrl.updateProfile);
  app.get('/api/operator/pricing/routes', apiKeyAuth, authOperator('operator'), fleetCtrl.listRoutes);
  app.put('/api/operator/pricing/routes/:id', apiKeyAuth, authOperator('operator'), fleetCtrl.updateRoutePrice);
  app.get('/api/operator/pricing/campaigns', apiKeyAuth, authOperator('operator'), fleetCtrl.listCampaigns);
  app.post('/api/operator/pricing/campaigns', apiKeyAuth, authOperator('operator'), fleetCtrl.createCampaign);
  app.put('/api/operator/pricing/campaigns/:id', apiKeyAuth, authOperator('operator'), fleetCtrl.updateCampaign);
  app.delete('/api/operator/pricing/campaigns/:id', apiKeyAuth, authOperator('operator'), fleetCtrl.deleteCampaign);
  app.post('/api/operator/callback', apiKeyAuth, fleetCtrl.submitCallback);
  app.get('/api/admin/callbacks', apiKeyAuth, auth('admin'), fleetCtrl.listCallbacks);
  app.put('/api/admin/callbacks/:id/status', apiKeyAuth, auth('admin'), fleetCtrl.updateCallbackStatus);
  app.delete('/api/admin/callbacks/:id', apiKeyAuth, auth('admin'), fleetCtrl.deleteCallback);
};
