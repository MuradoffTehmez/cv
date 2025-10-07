const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = Number(process.env.SMTP_PORT);
    const smtpUser = process.env.SMTP_EMAIL;
    const smtpPass = process.env.SMTP_PASSWORD;

    if (!smtpHost || Number.isNaN(smtpPort) || !smtpUser || !smtpPass) {
        throw new Error('SMTP configuration is incomplete.');
    }

    const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
            user: smtpUser,
            pass: smtpPass,
        },
    });

    const message = {
        from: smtpUser,
        to: options.email,
        subject: options.subject,
        text: options.message,
        ...(options.html ? { html: options.html } : {}),
    };

    await transporter.sendMail(message);
};

module.exports = sendEmail;
