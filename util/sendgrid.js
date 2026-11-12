
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = ({ to, subject, text, html }) => {
  return sgMail.send({
    to,
    from: process.env.SENDGRID_EMAIL,
    subject,
    text,
    html
  })
  .then(([response]) => response)
  .catch((error) => {
    console.error(error.response?.body || error.message);
    throw error;
  });
};

module.exports = sendEmail;
