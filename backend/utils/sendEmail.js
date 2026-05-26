const nodemailer = require('nodemailer');
const { logger } = require('../config/logger');

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  const message = {
    from: process.env.EMAIL_FROM,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html || options.message
  };

  try {
    await transporter.sendMail(message);
    logger.info(`Email sent to ${options.email}`);
  } catch (error) {
    logger.error(`Email send error: ${error.message}`);
    throw new Error('Email could not be sent');
  }
};

module.exports = sendEmail;
