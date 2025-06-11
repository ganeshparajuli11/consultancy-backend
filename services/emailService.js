require('dotenv').config();
const nodemailer = require('nodemailer');

// Configure SMTP transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true', // true for port 465, false otherwise
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

/**
 * Send verification email
 * @param {string} toEmail - Recipient email address
 * @param {string} token - Verification token (JWT)
 */
async function sendVerificationEmail(toEmail, token) {
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM, // e.g. '"meroClass" <no-reply@meroclass.com>'
    to: toEmail,
    subject: 'Verify your meroClass account',
    html: `
  <div style="background-color:#f9f9f9;padding:40px 20px;font-family:'Segoe UI',sans-serif;">
    <div style="max-width:600px;margin:0 auto;background:white;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.05);">
      <div style="background:#4caf50;padding:20px;color:white;text-align:center;">
        <h1 style="margin:0;font-size:24px;">Welcome to <span style="font-weight:600;">meroClass</span></h1>
        <p style="margin-top:8px;font-size:14px;">Verify your email to activate your account</p>
      </div>
      <div style="padding:30px;">
        <p style="font-size:16px;margin:0 0 20px;">Hi there,</p>
        <p style="font-size:15px;line-height:1.6;">
          Thanks for signing up for <strong>meroClass</strong>. To start using your account, please verify your email address by clicking the button below:
        </p>
        <div style="text-align:center;margin:30px 0;">
          <a href="${verifyUrl}" style="background-color:#4caf50;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block;font-size:16px;">Verify Email</a>
        </div>
        <p style="font-size:14px;color:#555;">If the button doesn't work, copy and paste the link below into your browser:</p>
        <p style="font-size:13px;color:#999;background:#f4f4f4;padding:10px;border-radius:4px;word-break:break-word;">${verifyUrl}</p>
        <p style="font-size:13px;color:#999;margin-top:30px;">If you didn’t create a meroClass account, you can safely ignore this email.</p>
      </div>
      <div style="background:#f0f0f0;padding:15px;text-align:center;font-size:12px;color:#888;">
        &copy; ${new Date().getFullYear()} meroClass — All rights reserved
      </div>
    </div>
  </div>
`

  };

  await transporter.sendMail(mailOptions);
}

module.exports = { sendVerificationEmail };
