export async function sendMail(to: string, subject: string, text: string, html?: string) {
  // Lightweight placeholder mailer: logs the outgoing email.
  // Replace with real SMTP/Nodemailer integration via environment variables as needed.
  try {
    console.log('Sending email', { to, subject, text });
    // If you want real email sending, implement using nodemailer here and use env vars:
    // SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
    return { ok: true };
  } catch (e) {
    console.error('Mailer error', e);
    return { ok: false, error: String(e) };
  }
}
