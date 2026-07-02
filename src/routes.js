const authRoutes = require('@routes/authRoutes');
const partnerRoutes = require('@routes/partnerRoutes');
const v1Routes = require('@routes/v1');

module.exports = (app) => {
  // Mobile & web user authentication (JWT)
  app.use('/auth', authRoutes);

  // Admin: manage third-party API partners
  app.use('/auth/partners', partnerRoutes);

  // Third-party bus booking API (X-API-Key) — AdiVAH-style
  app.use('/api/v1', v1Routes);
};
