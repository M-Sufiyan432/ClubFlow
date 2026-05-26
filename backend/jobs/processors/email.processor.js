const sendEmail = require('../../utils/sendEmail');

const processEmailJob = async (job) => {
  const { email, subject, message, html } = job.data;

  if (!email || !subject || !message) {
    throw new Error('Email job requires email, subject, and message');
  }

  await sendEmail({ email, subject, message, html });
};

module.exports = processEmailJob;
