const nodemailer = require('nodemailer');
const sendGmailEmail = async (email, subject, html, text) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });

  await transporter.sendMail({
    from: `"VisionMeet" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: subject,
    text: text,
    html: html
  });
  console.log('✅ Email sent via Gmail SMTP');
  return true;
};

/**
 * Universal email sender that automatically chooses the right method
 */
const sendEmail = async (email, subject, html, text) => {
  return await sendGmailEmail(email, subject, html, text);
};

module.exports = {
  sendEmail
};
