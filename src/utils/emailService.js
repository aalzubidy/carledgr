const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const config = require('../../config');
const logger = require('./logger');

// Template cache to avoid reading files repeatedly
const templateCache = {};

// Load and cache email template
const loadTemplate = (templateName) => {
  if (templateCache[templateName]) {
    return templateCache[templateName];
  }

  try {
    const templatePath = path.join(__dirname, '../email-templates', `${templateName}.html`);
    const template = fs.readFileSync(templatePath, 'utf8');
    templateCache[templateName] = template;
    return template;
  } catch (error) {
    logger.error(`Failed to load email template ${templateName}:`, error);
    throw new Error(`Email template ${templateName} not found`);
  }
};

// Simple template replacement function
const replaceTemplateVariables = (template, variables) => {
  let result = template;
  
  // Replace all {{VARIABLE}} with actual values
  Object.keys(variables).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, variables[key] || '');
  });

  // Handle conditional blocks {{#if VARIABLE}}...{{/if}}
  result = result.replace(/{{#if\s+(\w+)}}(.*?){{\/if}}/gs, (match, variable, content) => {
    return variables[variable] ? content : '';
  });

  return result;
};

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.secure,
    auth: {
      user: config.email.user,
      pass: config.email.password
    }
  });
};

// Send welcome email with login credentials
const sendWelcomeEmail = async (organizationName, ownerEmail, tempPassword, licenseType) => {
  try {
    const transporter = createTransporter();
    
    const tierNames = {
      starter: 'Starter Plan (30 cars)',
      professional: 'Professional Plan (75 cars)',
      business: 'Business Plan (150 cars)',
      enterprise: 'Enterprise Plan (Unlimited cars)'
    };

    const template = loadTemplate('welcome');
    const emailHtml = replaceTemplateVariables(template, {
      APP_NAME: 'CarLedgr',
      ORGANIZATION_NAME: organizationName,
      OWNER_EMAIL: ownerEmail,
      TEMP_PASSWORD: tempPassword,
      LICENSE_TYPE: tierNames[licenseType] || licenseType,
      FRONTEND_URL: config.frontend.url,
      SUPPORT_EMAIL: 'support@carledgr.com'
    });
    
    const mailOptions = {
      from: `"${config.email.fromName}" <${config.email.fromEmail}>`,
      to: ownerEmail,
      subject: 'Welcome to CarLedgr - Your Account is Ready!',
      html: emailHtml
    };

    const result = await transporter.sendMail(mailOptions);
    logger.info(`Welcome email sent to ${ownerEmail} for organization ${organizationName}`);
    return result;
  } catch (error) {
    logger.error(`Failed to send welcome email to ${ownerEmail}:`, error);
    throw error;
  }
};

// Send subscription status change email
const sendSubscriptionStatusEmail = async (organizationName, ownerEmail, status, reason = null) => {
  try {
    const transporter = createTransporter();
    
    let subject, message;
    
    switch (status) {
      case 'past_due':
        subject = 'CarLedgr - Payment Past Due';
        message = 'Your subscription payment is past due. Please update your payment method to continue using CarLedgr.';
        break;
      case 'canceled':
        subject = 'CarLedgr - Subscription Canceled';
        message = 'Your CarLedgr subscription has been canceled. You can reactivate anytime by contacting support.';
        break;
      case 'active':
        subject = 'CarLedgr - Subscription Reactivated';
        message = 'Great news! Your CarLedgr subscription is now active again.';
        break;
      default:
        subject = 'CarLedgr - Subscription Update';
        message = `Your subscription status has been updated to: ${status}`;
    }

    const template = loadTemplate('subscription-status');
    const emailHtml = replaceTemplateVariables(template, {
      APP_NAME: 'CarLedgr',
      SUBJECT: subject,
      ORGANIZATION_NAME: organizationName,
      MESSAGE: message,
      REASON: reason,
      SUPPORT_EMAIL: 'support@carledgr.com'
    });

    const mailOptions = {
      from: `"${config.email.fromName}" <${config.email.fromEmail}>`,
      to: ownerEmail,
      subject,
      html: emailHtml
    };

    const result = await transporter.sendMail(mailOptions);
    logger.info(`Subscription status email sent to ${ownerEmail} for ${organizationName}: ${status}`);
    return result;
  } catch (error) {
    logger.error(`Failed to send subscription status email to ${ownerEmail}:`, error);
    throw error;
  }
};

// Clear template cache (useful for development or when templates are updated)
const clearTemplateCache = () => {
  Object.keys(templateCache).forEach(key => {
    delete templateCache[key];
  });
  logger.info('Email template cache cleared');
};

module.exports = {
  sendWelcomeEmail,
  sendSubscriptionStatusEmail,
  clearTemplateCache
}; 