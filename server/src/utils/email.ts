import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransporter({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendSigningInvitation = async (
  recipientEmail: string,
  recipientName: string,
  contractTitle: string,
  signingLink: string
) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: recipientEmail,
    subject: `Please sign: ${contractTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Document Signature Request</h2>
        <p>Hello ${recipientName},</p>
        <p>You have been requested to sign the following document:</p>
        <h3>${contractTitle}</h3>
        <p>Please click the link below to view and sign the document:</p>
        <a href="${signingLink}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
          View and Sign Document
        </a>
        <p>This link will remain active until the document is signed by all parties.</p>
        <p>Best regards,<br>The Hylian Team</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Signing invitation sent to ${recipientEmail}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};