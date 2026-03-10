const nodemailer = require('nodemailer');

function createMailer(config) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.qq.com',
    port: 465,
    secure: true,
    auth: {
      user: config.qqUser,
      pass: config.qqAuthCode
    }
  });

  async function sendVerifyCodeEmail(to, verifyCode) {
    return transporter.sendMail({
      from: config.mailFrom,
      to,
      subject: 'Hotline Escape - Email Verification Code',
      html: `<p>Welcome to Hotline Escape.</p><p>Your verification code is:</p><h2>${verifyCode}</h2><p>This code expires in 15 minutes.</p>`
    });
  }

  async function sendResetEmail(to, resetUrl) {
    return transporter.sendMail({
      from: config.mailFrom,
      to,
      subject: 'Hotline Escape - Reset Password',
      html: `<p>You requested a password reset.</p><p>Click the link below to set a new password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If this was not you, please ignore this email.</p>`
    });
  }

  return {
    sendVerifyCodeEmail,
    sendResetEmail
  };
}

module.exports = {
  createMailer
};
