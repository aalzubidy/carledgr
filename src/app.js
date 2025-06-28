const express = require('express');
const cors = require('cors');
const logger = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const organizationRoutes = require('./routes/organizationRoutes');
const carRoutes = require('./routes/carRoutes');
const maintenanceRoutes = require('./routes/maintenanceRoutes');
const reportRoutes = require('./routes/reportRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const userRoutes = require('./routes/userRoutes');
const attachmentRoutes = require('./routes/attachmentRoutes');
const licenseRoutes = require('./routes/licenseRoutes');
const licenseTierRoutes = require('./routes/licenseTierRoutes');
const stripeRoutes = require('./routes/stripeRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');

// Create Express app
const app = express();

// CORS middleware (before other middleware)
app.use(cors());

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

// Stripe webhook route (MUST be before express.json() middleware)
app.use('/api/stripe', stripeRoutes);

// Body parsing middleware (after Stripe webhook)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/users', userRoutes);
app.use('/api/attachments', attachmentRoutes);
app.use('/api/licenses', licenseRoutes);
app.use('/api/license-tiers', licenseTierRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

module.exports = app; 