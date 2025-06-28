const nodemailer = require('nodemailer');
const config = require('../../config');
const logger = require('./logger');

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
    
    const mailOptions = {
      from: `"${config.email.fromName}" <${config.email.fromEmail}>`,
      to: ownerEmail,
      subject: 'Welcome to CarFin - Your Account is Ready!',
      html: generateWelcomeEmailHTML(organizationName, ownerEmail, tempPassword, licenseType)
    };

    const result = await transporter.sendMail(mailOptions);
    logger.info(`Welcome email sent to ${ownerEmail} for organization ${organizationName}`);
    return result;
  } catch (error) {
    logger.error(`Failed to send welcome email to ${ownerEmail}:`, error);
    throw error;
  }
};

// Generate welcome email HTML
const generateWelcomeEmailHTML = (organizationName, ownerEmail, tempPassword, licenseType) => {
  const tierNames = {
    starter: 'Starter Plan (30 cars)',
    professional: 'Professional Plan (75 cars)',
    business: 'Business Plan (150 cars)',
    enterprise: 'Enterprise Plan (Unlimited cars)'
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to CarFin</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 28px; font-weight: bold; color: #2c3e50; margin-bottom: 10px; }
            .credentials { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #007bff; }
            .credential-item { margin: 10px 0; }
            .credential-label { font-weight: bold; color: #495057; }
            .credential-value { font-family: monospace; background: #e9ecef; padding: 5px 8px; border-radius: 4px; }
            .plan-info { background: #d4edda; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745; }
            .warning { background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107; }
            .footer { text-align: center; margin-top: 30px; color: #6c757d; font-size: 14px; }
            .button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🚗 CarFin</div>
                <h2>Welcome to CarFin!</h2>
                <p>Your salvage car dealership management system is ready</p>
            </div>

            <p>Hello!</p>
            
            <p>Thank you for subscribing to CarFin! Your account has been created and is ready to use.</p>

            <div class="plan-info">
                <h3>📋 Your Subscription Details</h3>
                <p><strong>Organization:</strong> ${organizationName}</p>
                <p><strong>Plan:</strong> ${tierNames[licenseType] || licenseType}</p>
                <p><strong>Status:</strong> Active</p>
            </div>

            <div class="credentials">
                <h3>🔐 Your Login Credentials</h3>
                <div class="credential-item">
                    <span class="credential-label">Email:</span><br>
                    <span class="credential-value">${ownerEmail}</span>
                </div>
                <div class="credential-item">
                    <span class="credential-label">Temporary Password:</span><br>
                    <span class="credential-value">${tempPassword}</span>
                </div>
            </div>

            <div class="warning">
                <h3>⚠️ Important Security Notice</h3>
                <p><strong>Please change your password immediately after logging in!</strong></p>
                <p>This temporary password is only for your first login. For security, please update it to something secure and memorable.</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL || 'https://your-carfin-domain.com'}" class="button">
                    Login to CarFin
                </a>
            </div>

            <h3>🚀 Getting Started</h3>
            <ol>
                <li>Click the login button above or visit your CarFin dashboard</li>
                <li>Log in with your credentials</li>
                <li>Change your password in Settings</li>
                <li>Start adding your vehicle inventory</li>
                <li>Track repairs, expenses, and profits</li>
            </ol>

            <h3>💡 Need Help?</h3>
            <p>Our team is here to help you get the most out of CarFin:</p>
            <ul>
                <li>📧 Email support: support@carfin.com</li>
                <li>📚 Documentation: Available in your dashboard</li>
                <li>💬 Live chat: Available during business hours</li>
            </ul>

            <div class="footer">
                <p>Thank you for choosing CarFin!</p>
                <p>The CarFin Team</p>
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #dee2e6;">
                <p style="font-size: 12px;">
                    This email was sent because you subscribed to CarFin. 
                    If you believe this was sent in error, please contact support immediately.
                </p>
            </div>
        </div>
    </body>
    </html>
  `;
};

// Send subscription status change email
const sendSubscriptionStatusEmail = async (organizationName, ownerEmail, status, reason = null) => {
  try {
    const transporter = createTransporter();
    
    let subject, message;
    
    switch (status) {
      case 'past_due':
        subject = 'CarFin - Payment Past Due';
        message = 'Your subscription payment is past due. Please update your payment method to continue using CarFin.';
        break;
      case 'canceled':
        subject = 'CarFin - Subscription Canceled';
        message = 'Your CarFin subscription has been canceled. You can reactivate anytime by contacting support.';
        break;
      case 'active':
        subject = 'CarFin - Subscription Reactivated';
        message = 'Great news! Your CarFin subscription is now active again.';
        break;
      default:
        subject = 'CarFin - Subscription Update';
        message = `Your subscription status has been updated to: ${status}`;
    }

    const mailOptions = {
      from: `"${config.email.fromName}" <${config.email.fromEmail}>`,
      to: ownerEmail,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>🚗 CarFin</h2>
          <h3>${subject}</h3>
          <p>Hello ${organizationName},</p>
          <p>${message}</p>
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
          <p>If you have any questions, please contact our support team.</p>
          <p>Best regards,<br>The CarFin Team</p>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    logger.info(`Subscription status email sent to ${ownerEmail} for ${organizationName}: ${status}`);
    return result;
  } catch (error) {
    logger.error(`Failed to send subscription status email to ${ownerEmail}:`, error);
    throw error;
  }
};

module.exports = {
  sendWelcomeEmail,
  sendSubscriptionStatusEmail
}; 