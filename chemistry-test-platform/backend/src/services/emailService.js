const nodemailer = require('nodemailer');

// Create email transporter
const createTransporter = () => {
  const emailConfig = {
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD // Gmail App Password, not regular password
    }
  };

  return nodemailer.createTransport(emailConfig);
};

/**
 * Send verification email to user
 */
const sendVerificationEmail = async (email, verificationToken, userName) => {
  try {
    const transporter = createTransporter();

    const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:5174'}/verify-email?token=${verificationToken}`;

    const mailOptions = {
      from: `"Chemistry Toppers" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Email - Chemistry Toppers',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 15px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
            .button:hover { background: #059669; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🧪 Chemistry Toppers</h1>
              <p>Welcome to the platform!</p>
            </div>
            <div class="content">
              <h2>Hi ${userName},</h2>
              <p>Thank you for registering with Chemistry Toppers! We're excited to have you join our learning community.</p>

              <p>To complete your registration and start taking chemistry tests, please verify your email address by clicking the button below:</p>

              <center>
                <a href="${verificationLink}" class="button">Verify Email Address</a>
              </center>

              <p>Or copy and paste this link into your browser:</p>
              <p style="background: #e5e7eb; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 14px;">
                ${verificationLink}
              </p>

              <div class="warning">
                <strong>⚠️ Important:</strong> This verification link will expire in 24 hours. If you didn't create an account with Chemistry Toppers, please ignore this email.
              </div>

              <p>If you have any questions or need assistance, feel free to reach out to our support team.</p>

              <p>Best regards,<br>
              <strong>Chemistry Toppers Team</strong></p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Chemistry Toppers. All rights reserved.</p>
              <p>This is an automated email. Please do not reply to this message.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Verification email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send password reset email
 */
const sendPasswordResetEmail = async (email, resetToken, userName) => {
  try {
    const transporter = createTransporter();

    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5174'}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `"Chemistry Toppers" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Reset Your Password - Chemistry Toppers',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 15px 30px; background: #ef4444; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
            .button:hover { background: #dc2626; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔒 Password Reset</h1>
            </div>
            <div class="content">
              <h2>Hi ${userName},</h2>
              <p>We received a request to reset your password for your Chemistry Toppers account.</p>

              <p>Click the button below to reset your password:</p>

              <center>
                <a href="${resetLink}" class="button">Reset Password</a>
              </center>

              <p>Or copy and paste this link into your browser:</p>
              <p style="background: #e5e7eb; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 14px;">
                ${resetLink}
              </p>

              <div class="warning">
                <strong>⚠️ Important:</strong> This password reset link will expire in 1 hour. If you didn't request a password reset, please ignore this email and your password will remain unchanged.
              </div>

              <p>Best regards,<br>
              <strong>Chemistry Toppers Team</strong></p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Chemistry Toppers. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail
};
