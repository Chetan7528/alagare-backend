const authRoutes = require('@routes/authRoutes');
const adminRoutes = require('@routes/adminRoutes');
const apiUserRoutes = require('@routes/apiUserRoute');
const setupRoutes = require('@routes/setupRoutes');
const v1Routes = require('@routes/v1');

module.exports = (app) => {
  app.use('/api-users', apiUserRoutes);
  app.use('/setup', setupRoutes);
  app.use('/auth', authRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/v1', v1Routes);
};
