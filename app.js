'use strict';

const express = require('express');
const path = require('path');
const usuariosRouter = require('./routes/usuarios');
const barbershopsRouter = require('./routes/barbershops');
const servicesRouter = require('./routes/services');
const appointmentsRouter = require('./routes/appointments');
const subscriptionsRouter = require('./routes/subscriptions');
const referralsRouter = require('./routes/referrals');
const demoReferralsRouter = require('./routes/demoReferrals');
const onboardingRouter = require('./routes/onboarding');
const publicBookingRouter = require('./routes/publicBooking');

const app = express();

app.use(express.json());
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/usuarios', usuariosRouter);
app.use('/api/barbershops', barbershopsRouter);
app.use('/api/services', servicesRouter);
app.use('/api/appointments', appointmentsRouter);
app.use('/api/subscriptions', subscriptionsRouter);
app.use('/api/referrals', referralsRouter);
app.use('/api/demo/referrals', demoReferralsRouter);
app.use('/api/onboarding', onboardingRouter);
app.use('/api/public', publicBookingRouter);
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  console.error(error);
  const status = error.status ||
    (error.name === 'SequelizeUniqueConstraintError' ? 409 :
      (error.name && /^Sequelize(Connection|AccessDenied|HostNotFound)/.test(error.name) ? 503 : 500));
  res.status(status).json({
    error: status < 500 ? error.message : status === 503
      ? 'Base de datos no disponible. Revisa la conexión MySQL.'
      : 'Error interno del servidor',
  });
});

module.exports = app;
