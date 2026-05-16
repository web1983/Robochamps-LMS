import nodemailer from 'nodemailer';

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

// Send OTP email for password reset
export const sendPasswordResetEmail = async (email, otp, userName) => {
  try {
    // Check if email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.error('❌ EMAIL_USER or EMAIL_PASSWORD not configured in environment variables');
      throw new Error('Email service not configured. Please contact administrator.');
    }

    console.log('📧 Sending password reset email to:', email);
    const transporter = createTransporter();

    const mailOptions = {
      from: {
        name: 'Robowunder LMS',
        address: process.env.EMAIL_USER,
      },
      to: email,
      subject: 'Password Reset OTP - Robowunder LMS',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background: #f9f9f9;
              border-radius: 10px;
              padding: 30px;
              border: 1px solid #ddd;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 20px;
              border-radius: 10px 10px 0 0;
              text-align: center;
              margin: -30px -30px 20px -30px;
            }
            .otp-box {
              background: white;
              border: 2px dashed #667eea;
              border-radius: 8px;
              padding: 20px;
              text-align: center;
              margin: 20px 0;
            }
            .otp {
              font-size: 32px;
              font-weight: bold;
              color: #667eea;
              letter-spacing: 8px;
              margin: 10px 0;
            }
            .warning {
              background: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 12px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              text-align: center;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">🔐 Password Reset Request</h1>
            </div>
            
            <p>Hi <strong>${userName}</strong>,</p>
            
            <p>We received a request to reset your password for your Robowunder LMS account.</p>
            
            <p>Use the following OTP (One-Time Password) to reset your password:</p>
            
            <div class="otp-box">
              <p style="margin: 0; color: #666;">Your OTP Code</p>
              <div class="otp">${otp}</div>
              <p style="margin: 0; color: #666; font-size: 12px;">Valid for 10 minutes</p>
            </div>
            
            <div class="warning">
              <strong>⚠️ Security Notice:</strong>
              <ul style="margin: 10px 0;">
                <li>This OTP is valid for <strong>10 minutes only</strong></li>
                <li>Never share this OTP with anyone</li>
                <li>If you didn't request this, please ignore this email</li>
              </ul>
            </div>
            
            <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
            
            <div class="footer">
              <p><strong>Robowunder International Robotics Championship 2026</strong></p>
              <p>This is an automated email. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw new Error('Failed to send email');
  }
};

// Send welcome email (optional - for future use)
export const sendWelcomeEmail = async (email, userName) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: {
        name: 'Robowunder LMS',
        address: process.env.EMAIL_USER,
      },
      to: email,
      subject: 'Welcome to Robowunder LMS! 🎉',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background: #f9f9f9;
              border-radius: 10px;
              padding: 30px;
              border: 1px solid #ddd;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              border-radius: 10px 10px 0 0;
              text-align: center;
              margin: -30px -30px 30px -30px;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 15px 30px;
              text-decoration: none;
              border-radius: 8px;
              margin: 20px 0;
              font-weight: bold;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              text-align: center;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">🎉 Welcome to Robowunder LMS!</h1>
            </div>
            
            <p>Hi <strong>${userName}</strong>,</p>
            
            <p>Welcome to <strong>Robowunder International Robotics Championship 2026</strong> Learning Management System!</p>
            
            <p>Your account has been successfully created. You can now:</p>
            <ul>
              <li>📚 Browse and enroll in robotics courses</li>
              <li>🎥 Watch video tutorials</li>
              <li>📝 Take tests and assessments</li>
              <li>🏆 Earn certificates upon completion</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="https://lms.robowunder.in" class="button">Start Learning Now →</a>
            </div>
            
            <p>If you have any questions, feel free to reach out to our support team.</p>
            
            <div class="footer">
              <p><strong>Robowunder International Robotics Championship 2026</strong></p>
              <p>This is an automated email. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Welcome email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
};

