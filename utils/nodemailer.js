import nodemailer from 'nodemailer';
import base64url from 'base64url';

// Configure nodemailer to use a real email service
const transport = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465, // Use 587 for TLS
    secure: true, // true for port 465, false for 587
    auth: {
        user: 'hakathon197@gmail.com',
        pass: 'Sajjad@123',
    },
    connectionTimeout: 10000,
});
const sendVerificationEmail = async (user) => {
    const token = base64url.encode(user.verificationToken);
    const verificationLink = `${process.env.CLIENT_URL}/verify-email?token=${token}`;

    const emailHtml = `<p>Hi ${user.fullName},</p>
                       <p>Please verify your email by clicking the link below:</p>
                       <a href="${verificationLink}">Verify Email</a>`;

    await transport.sendMail({
        from: process.env.EMAIL_FROM,
        to: user.email,
        subject: 'Verify your email',
        html: emailHtml,
    });
};

export {sendVerificationEmail}