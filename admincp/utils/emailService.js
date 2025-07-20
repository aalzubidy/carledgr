const nodemailer = require('nodemailer');
const config = require('../config');

let transporter;

// Create email transporter
const createTransporter = () => {
  if (transporter) {
    return transporter;
  }

  // Check if using Resend (recommended)
  if (config.email.resendApiKey) {
    transporter = nodemailer.createTransport({
      host: 'smtp.resend.com',
      port: 465,
      secure: true,
      auth: {
        user: 'resend',
        pass: config.email.resendApiKey
      }
    });
    console.log(`Email transporter created: Resend (${config.email.fromEmail})`);
  } 
  // Fallback to SMTP if configured
  else if (config.email.host && config.email.password) {
    transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: {
        user: config.email.user,
        pass: config.email.password
      }
    });
    console.log(`Email transporter created: ${config.email.host}:${config.email.port}`);
  } else {
    throw new Error('No email configuration found. Please configure either Resend API key or SMTP settings.');
  }

  return transporter;
};

// Send temporary password email
const sendTempPasswordEmail = async (userEmail, userName, tempPassword, organizationName) => {
  try {
    if (!transporter) {
      createTransporter();
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>CarLedgr Account Created</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #007bff; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 5px 5px; }
          .credentials { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #007bff; }
          .button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to CarLedgr</h1>
          </div>
          <div class="content">
            <h2>Your Account Has Been Created</h2>
            <p>Hello ${userName},</p>
            <p>An administrator has created a CarLedgr account for you in the organization: <strong>${organizationName}</strong></p>
            
            <div class="credentials">
              <h3>Your Login Credentials:</h3>
              <p><strong>Email:</strong> ${userEmail}</p>
              <p><strong>Temporary Password:</strong> <code style="background: #e9ecef; padding: 4px 8px; border-radius: 3px; font-family: monospace;">${tempPassword}</code></p>
            </div>
            
            <p><strong>Important:</strong> This is a temporary password. Please change it immediately after your first login for security purposes.</p>
            
            <a href="https://app.carledgr.com" class="button">Login to CarLedgr</a>
            
            <p>If you have any questions or need assistance, please contact your organization administrator.</p>
            
            <div class="footer">
              <p>This email was sent by CarLedgr Admin Panel</p>
              <p>© ${new Date().getFullYear()} CarLedgr. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
      Welcome to CarLedgr
      
      Hello ${userName},
      
      An administrator has created a CarLedgr account for you in the organization: ${organizationName}
      
      Your Login Credentials:
      Email: ${userEmail}
      Temporary Password: ${tempPassword}
      
      Important: This is a temporary password. Please change it immediately after your first login for security purposes.
      
      Login at: https://app.carledgr.com
      
      If you have any questions or need assistance, please contact your organization administrator.
      
      © ${new Date().getFullYear()} CarLedgr. All rights reserved.
    `;

    const mailOptions = {
      from: `"${config.email.fromName || 'CarLedgr Admin'}" <${config.email.fromEmail}>`,
      to: userEmail,
      subject: `Your CarLedgr Account - Welcome to ${organizationName}`,
      text: textContent,
      html: htmlContent
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Temporary password email sent to ${userEmail}`);
    return result;

  } catch (error) {
    console.error('❌ Failed to send email:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

// Test email configuration
const testEmailConfig = async () => {
  try {
    if (!transporter) {
      createTransporter();
    }
    
    await transporter.verify();
    console.log('✅ Email configuration is valid');
    return true;
  } catch (error) {
    console.error('❌ Email configuration error:', error.message);
    return false;
  }
};

module.exports = {
  sendTempPasswordEmail,
  testEmailConfig
}; 