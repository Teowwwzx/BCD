const { Resend } = require('resend');
const crypto = require('crypto');

const resend = new Resend(process.env.RESEND_API_KEY);

class EmailService {
  constructor() {
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@beconx.site';
    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  }

  // Generate a secure random token
  generateToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Send email verification email
  async sendVerificationEmail(email, username, token) {
    const verificationUrl = `${this.frontendUrl}/verify-email?token=${token}`;
    
    try {
      const { data, error } = await resend.emails.send({
        from: this.fromEmail,
        to: [email],
        subject: 'Verify Your Email - BCD Marketplace',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Email Verification</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
              .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>BCD Marketplace</h1>
              </div>
              <div class="content">
                <h2>Welcome ${username}!</h2>
                <p>Thank you for signing up for BCD Marketplace. To complete your registration and start using your account, please verify your email address by clicking the button below:</p>
                
                <div style="text-align: center;">
                  <a href="${verificationUrl}" class="button">Verify Email Address</a>
                </div>
                
                <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #4F46E5;">${verificationUrl}</p>
                
                <p><strong>Important:</strong> This verification link will expire in 24 hours for security reasons.</p>
                
                <p>If you didn't create an account with BCD Marketplace, please ignore this email.</p>
              </div>
              <div class="footer">
                <p>&copy; 2024 BCD Marketplace. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      if (error) {
        console.error('Error sending verification email:', error);
        throw new Error('Failed to send verification email');
      }

      console.log('Verification email sent successfully:', data);
      return { success: true, messageId: data.id };
    } catch (error) {
      console.error('Email service error:', error);
      throw error;
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(email, username, token) {
    const resetUrl = `${this.frontendUrl}/reset-password?token=${token}`;
    
    try {
      const { data, error } = await resend.emails.send({
        from: this.fromEmail,
        to: [email],
        subject: 'Reset Your Password - BCD Marketplace',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #DC2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
              .button { display: inline-block; background: #DC2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
              .warning { background: #FEF3C7; border: 1px solid #F59E0B; padding: 15px; border-radius: 5px; margin: 15px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>BCD Marketplace</h1>
              </div>
              <div class="content">
                <h2>Password Reset Request</h2>
                <p>Hello ${username},</p>
                <p>We received a request to reset your password for your BCD Marketplace account. If you made this request, click the button below to reset your password:</p>
                
                <div style="text-align: center;">
                  <a href="${resetUrl}" class="button">Reset Password</a>
                </div>
                
                <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #DC2626;">${resetUrl}</p>
                
                <div class="warning">
                  <p><strong>Security Notice:</strong></p>
                  <ul>
                    <li>This password reset link will expire in 1 hour for security reasons</li>
                    <li>If you didn't request this password reset, please ignore this email</li>
                    <li>Your password will remain unchanged until you create a new one</li>
                  </ul>
                </div>
                
                <p>If you continue to have problems, please contact our support team.</p>
              </div>
              <div class="footer">
                <p>&copy; 2024 BCD Marketplace. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      if (error) {
        console.error('Error sending password reset email:', error);
        throw new Error('Failed to send password reset email');
      }

      console.log('Password reset email sent successfully:', data);
      return { success: true, messageId: data.id };
    } catch (error) {
      console.error('Email service error:', error);
      throw error;
    }
  }

  // Send welcome email after successful verification
  async sendWelcomeEmail(email, username) {
    try {
      const { data, error } = await resend.emails.send({
        from: this.fromEmail,
        to: [email],
        subject: 'Welcome to BCD Marketplace!',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to BCD Marketplace</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #10B981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
              .button { display: inline-block; background: #10B981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Welcome to BCD Marketplace!</h1>
              </div>
              <div class="content">
                <h2>Hello ${username}!</h2>
                <p>Congratulations! Your email has been successfully verified and your account is now active.</p>
                
                <p>You can now:</p>
                <ul>
                  <li>Browse and purchase products</li>
                  <li>List your own products for sale</li>
                  <li>Manage your account and orders</li>
                  <li>Connect with other users</li>
                </ul>
                
                <div style="text-align: center;">
                  <a href="${this.frontendUrl}/login" class="button">Start Shopping</a>
                </div>
                
                <p>If you have any questions or need assistance, our support team is here to help.</p>
                
                <p>Happy shopping!</p>
                <p>The BCD Marketplace Team</p>
              </div>
              <div class="footer">
                <p>&copy; 2024 BCD Marketplace. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      if (error) {
        console.error('Error sending welcome email:', error);
        throw new Error('Failed to send welcome email');
      }

      console.log('Welcome email sent successfully:', data);
      return { success: true, messageId: data.id };
    } catch (error) {
      console.error('Email service error:', error);
      throw error;
    }
  }
}

module.exports = new EmailService();