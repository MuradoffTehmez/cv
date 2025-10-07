const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
<<<<<<< HEAD
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
=======
    if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
        throw new Error('SMTP konfiqurasiyası tamamlanmayıb. Zəhmət olmasa mühit dəyişənlərini yoxlayın.');
    }

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : Number(process.env.SMTP_PORT) === 465,
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWORD,
>>>>>>> f9297cf571769da439d04e75e53e93291bb41b0f
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
