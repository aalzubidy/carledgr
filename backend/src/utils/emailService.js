const nodemailer = require('nodemailer');
const { Resend } = require('resend');
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

// Initialize email service based on provider
let emailService;

const initializeEmailService = () => {
  if (config.email.provider === 'resend') {
    if (!config.email.resendApiKey) {
      throw new Error('Resend API key is required when using Resend email provider');
    }
    emailService = new Resend(config.email.resendApiKey);
    logger.info('Email service initialized with Resend');
  } else {
    // Default to SMTP
    emailService = nodemailer.createTransporter({
      host: config.email.smtp.host,
      port: config.email.smtp.port,
      secure: config.email.smtp.secure,
      auth: {
        user: config.email.smtp.user,
        pass: config.email.smtp.password
      }
    });
    logger.info('Email service initialized with SMTP');
  }
  return emailService;
};

// Generate plain text version of email
const htmlToText = (html) => {
  return html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
};

// Send email using the configured provider with category
const sendEmail = async (to, subject, html, textContent = null, category = 'general') => {
  if (!emailService) {
    initializeEmailService();
  }

  const text = textContent || htmlToText(html);

  if (config.email.provider === 'resend') {
    // Use Resend with improved headers following Gmail/Yahoo requirements
    const result = await emailService.emails.send({
      from: `${config.email.fromName} <${config.email.fromEmail}>`,
      to: [to],
      subject: subject,
      html: html,
      text: text,
      headers: {
        'X-Entity-Ref-ID': `carledgr-${Date.now()}`,
        'List-Unsubscribe': `<mailto:unsubscribe@carledgr.com>, <${config.frontend.url}/unsubscribe>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        'Precedence': 'bulk',
        'X-Auto-Response-Suppress': 'OOF, DR, RN, NRN, AutoReply',
        'X-Mailer': 'CarLedgr Platform',
        'Message-ID': `<carledgr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@carledgr.com>`
      },
      tags: [
        {
          name: 'category',
          value: category
        },
        {
          name: 'environment',
          value: process.env.NODE_ENV || 'development'
        }
      ]
    });
    return result;
  } else {
    // Use SMTP/Nodemailer with improved headers following Gmail/Yahoo requirements
    const mailOptions = {
      from: `"${config.email.fromName}" <${config.email.fromEmail}>`,
      to: to,
      subject: subject,
      html: html,
      text: text,
      headers: {
        'X-Mailer': 'CarLedgr Platform',
        'X-Entity-Ref-ID': `carledgr-${Date.now()}`,
        'List-Unsubscribe': `<mailto:unsubscribe@carledgr.com>, <${config.frontend.url}/unsubscribe>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        'Precedence': 'bulk',
        'X-Auto-Response-Suppress': 'OOF, DR, RN, NRN, AutoReply',
        'Message-ID': `<carledgr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@carledgr.com>`,
        'X-Priority': '3',
        'Importance': 'normal'
      }
    };
    const result = await emailService.sendMail(mailOptions);
    return result;
  }
};

// Send welcome email with login credentials
const sendWelcomeEmail = async (organizationName, ownerEmail, tempPassword, licenseType) => {
  try {
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
    
    const result = await sendEmail(
      ownerEmail,
      'CarLedgr - Your Account is Ready',
      emailHtml,
      null,
      'account-creation'
    );
    
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

    const result = await sendEmail(ownerEmail, subject, emailHtml, null, 'subscription-status');
    
    logger.info(`Subscription status email sent to ${ownerEmail} for ${organizationName}: ${status}`);
    return result;
  } catch (error) {
    logger.error(`Failed to send subscription status email to ${ownerEmail}:`, error);
    throw error;
  }
};

// Send password reset email with temporary password
const sendPasswordResetEmail = async (organizationName, userEmail, tempPassword) => {
  try {
    const template = loadTemplate('password-reset');
    const emailHtml = replaceTemplateVariables(template, {
      APP_NAME: 'CarLedgr',
      ORGANIZATION_NAME: organizationName,
      USER_EMAIL: userEmail,
      TEMP_PASSWORD: tempPassword,
      FRONTEND_URL: config.frontend.url,
      SUPPORT_EMAIL: 'support@carledgr.com'
    });
    
    const result = await sendEmail(
      userEmail,
      'CarLedgr - Account Access Credentials',
      emailHtml,
      null,
      'password-reset'
    );
    
    logger.info(`Password reset email sent to ${userEmail} for organization ${organizationName}`);
    return result;
  } catch (error) {
    logger.error(`Failed to send password reset email to ${userEmail}:`, error);
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
  sendEmail,
  sendWelcomeEmail,
  sendSubscriptionStatusEmail,
  sendPasswordResetEmail,
  clearTemplateCache,
  initializeEmailService
}; 