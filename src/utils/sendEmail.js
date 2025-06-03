import nodemailer from "nodemailer";

export const sendEmail = async ({ email, subject, message, textMessage }) => {
    try {
        // Configure SMTP Transporter
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_PORT == "465", // True for port 465 (SSL), False for others
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        // Email options
        const mailOptions = {
            from: `MentorMatrix<${process.env.SMTP_USER}>`,
            to: email,
            subject,
            html: message || "", // provide fallback if message is undefined
            text: textMessage || (message ? message.replace(/<[^>]*>/g, "") : ""), // handle case when message is undefined
        };

        // Send Email
        await transporter.sendMail(mailOptions);
        console.log(`📧 Email sent to ${email}`);
    } catch (error) {
        console.error("❌ Email sending failed:", error);
        throw new Error("Email could not be sent");
    }
};
