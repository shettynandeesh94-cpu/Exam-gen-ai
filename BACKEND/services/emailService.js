const nodemailer = require('nodemailer');

/**
 * Send an email using Brevo HTTP API, SMTP configuration, or mock console log
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} [options.text] - Plain text fallback
 */
const sendEmail = async (options) => {
  // Option 1: Prioritize Brevo API if available (best for hosted environments like Render)
  if (process.env.BREVO_API_KEY) {
    const url = 'https://api.brevo.com/v3/smtp/email';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: process.env.FROM_NAME || 'ExamGen AI Pro',
          email: process.env.FROM_EMAIL || 'vinuthpoojary0@gmail.com',
        },
        to: [{ email: options.email }],
        subject: options.subject,
        htmlContent: options.html,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Brevo Email API failed with status ${response.status}`);
    }
    return;
  }

  // Option 2: Fallback to SMTP if SMTP credentials are provided
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      connectionTimeout: 8000, // 8-second timeout
      greetingTimeout: 8000,   // 8-second greeting timeout
    });

    const mailOptions = {
      from: `"${process.env.FROM_NAME || 'ExamGen AI Pro'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
      to: options.email,
      subject: options.subject,
      text: options.text || 'Reset your password with OTP',
      html: options.html,
    };

    await transporter.sendMail(mailOptions);
    return;
  }

  // Option 3: Development / local offline email printing
  console.log('\n✉️ ────────── MOCK EMAIL SENT ──────────');
  console.log(`To:      ${options.email}`);
  console.log(`Subject: ${options.subject}`);
  console.log('Body:');
  const otpMatch = options.html.match(/letter-spacing:\s*5px;[^>]*>\s*([0-9]{6})\s*<\/span>/);
  if (otpMatch) {
    console.log(`\n👉 Reset password OTP: ${otpMatch[1]}\n`);
  } else {
    console.log(options.text || options.html);
  }
  console.log('───────────────────────────────────────\n');
};

module.exports = sendEmail;
