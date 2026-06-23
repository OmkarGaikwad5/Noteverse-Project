// lib/mailer.ts
import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;
  
  // Use your environment variables
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  
  if (!emailUser || !emailPass) {
    console.error('❌ Email credentials missing in .env.local');
    console.error('EMAIL_USER and EMAIL_PASS must be set');
    return null;
  }
  
  try {
    // Configure for Gmail (most common)
    transporter = nodemailer.createTransport({
      service: 'gmail', // Using service for Gmail
      auth: {
        user: emailUser,
        pass: emailPass,
      },
      // Optional: Use this for more control
      // host: 'smtp.gmail.com',
      // port: 587,
      // secure: false,
      // auth: {
      //   user: emailUser,
      //   pass: emailPass,
      // },
    });
    
    // Verify connection
    transporter.verify((error, success) => {
      if (error) {
        console.error('❌ Email verification failed:', error);
        transporter = null;
      } else {
        console.log('✅ Email server is ready to send messages');
      }
    });
    
    return transporter;
  } catch (error) {
    console.error('Failed to create email transporter:', error);
    return null;
  }
}

export async function sendMail(to: string, subject: string, html: string) {
  console.log('=================================');
  console.log('📧 Attempting to send email:');
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log('=================================');
  
  const transporter = getTransporter();
  
  if (!transporter) {
    console.error('❌ No email transporter available');
    return { 
      messageId: null, 
      accepted: [], 
      rejected: [to],
      error: 'No email transporter configured'
    };
  }
  
  try {
    const info = await transporter.sendMail({
      from: `"NoteVerse" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      html: html,
      text: html.replace(/<[^>]*>/g, ''), // Plain text fallback
    });
    
    console.log(`✅ Email sent successfully! Message ID: ${info.messageId}`);
    console.log(`✅ Email sent to: ${to}`);
    console.log('=================================');
    return info;
  } catch (error) {
    console.error('❌ Email send error:', error);
    console.log('=================================');
    
    // Return error but don't throw
    return { 
      messageId: null, 
      accepted: [], 
      rejected: [to], 
      error 
    };
  }
}