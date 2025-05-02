const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: 'parasthakurdell@gmail.com',
        pass: 'xoyw krof ovng rorf'
    },
    debug: false 
});

transporter.verify(function(error, success) {
    if (error) {
        console.error('SMTP configuration error:', error);
    } else {
        console.log('SMTP server is ready to send emails');
    }
});

const sendChatNotification = async (recipientEmail, senderName, messagePreview, appUrl) => {
    try {
        const mailOptions = {
            from: {
                name: 'OnGrounds',
                address: 'parasthakurdell@gmail.com'
            },
            to: recipientEmail,
            subject: `New message from ${senderName}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: #128C7E; color: white; padding: 20px; text-align: center;">
                        <h2>New Message Notification</h2>
                    </div>
                    <div style="padding: 20px; background: #f9f9f9;">
                        <p>You have received a new message from <strong>${senderName}</strong></p>
                        <div style="background: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
                            <p style="color: #666; margin: 0;">${messagePreview}</p>
                        </div>
                        <a href="${appUrl}/chat" style="display: inline-block; background: #128C7E; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                            View Message
                        </a>
                    </div>
                    <div style="text-align: center; padding: 20px; color: #666; font-size: 0.8em;">
                        <p>You received this email because you have enabled chat notifications.</p>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Chat notification email sent:', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending chat notification email:', error);
        return false;
    }
};

const sendOTPEmail = async (email, otp) => {
    try {
        console.log('Attempting to send OTP email to:', email);
        const mailOptions = {
            from: {
                name: 'OnGrounds',
                address: 'parasthakurdell@gmail.com'
            },
            to: email,
            subject: 'OnGrounds - Email Verification OTP',
            text: `Your OTP for email verification is: ${otp}. This OTP will expire in 5 minutes.`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #331B3F;">OnGrounds Email Verification</h2>
                    <p>Your OTP for email verification is:</p>
                    <h1 style="color: #331B3F; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
                    <p>This OTP will expire in 5 minutes.</p>
                    <p style="color: #666; font-size: 12px;">If you didn't request this OTP, please ignore this email.</p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('OTP email sent successfully:', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending OTP email:', error);
        throw new Error('Failed to send OTP email: ' + error.message);
    }
};

module.exports = {
    sendChatNotification,
    sendOTPEmail
};