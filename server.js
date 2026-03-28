require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve the landing page HTML as the root
app.use(express.static(path.join(__dirname)));

// ── Nodemailer transporter (Gmail) ─────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,   // your Gmail address
    pass: process.env.GMAIL_PASS,   // your Gmail App Password (not your login password)
  },
});

// ── POST /api/lead ─────────────────────────────────────────────────────────
app.post('/api/lead', async (req, res) => {
  const { nombre, apellido, email, telefono, servicio, mensaje } = req.body;

  // Basic validation
  if (!nombre || !email || !telefono) {
    return res.status(400).json({ ok: false, error: 'Missing required fields.' });
  }

  const serviceLabel = servicio || 'Not specified';
  const fullName = `${nombre} ${apellido || ''}`.trim();

  // ── Email sent TO the company ────────────────────────────────────────────
  const companyMail = {
    from: `"GB Iron Solutions Form" <${process.env.GMAIL_USER}>`,
    to: process.env.NOTIFY_EMAIL || process.env.GMAIL_USER,
    subject: `New Free Estimate Request — ${fullName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden">
        <div style="background:#2a4d66;padding:24px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:22px">New Estimate Request</h1>
          <p style="color:#a0c4dd;margin:6px 0 0">GB Iron Solutions — Free Estimate Form</p>
        </div>
        <div style="padding:28px 32px">
          <table style="width:100%;border-collapse:collapse">
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#888;width:130px;font-size:13px">Name</td>
              <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-weight:600">${fullName}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#888;font-size:13px">Email</td>
              <td style="padding:10px 0;border-bottom:1px solid #f0f0f0"><a href="mailto:${email}">${email}</a></td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#888;font-size:13px">Phone</td>
              <td style="padding:10px 0;border-bottom:1px solid #f0f0f0"><a href="tel:${telefono}">${telefono}</a></td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#888;font-size:13px">Service</td>
              <td style="padding:10px 0;border-bottom:1px solid #f0f0f0">${serviceLabel}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#888;font-size:13px;vertical-align:top">Message</td>
              <td style="padding:10px 0;white-space:pre-wrap">${mensaje || '(none)'}</td>
            </tr>
          </table>
          <div style="margin-top:24px;padding:16px;background:#f5f8fb;border-radius:6px;font-size:13px;color:#555">
            Reply directly to <strong>${email}</strong> to respond to this lead.
          </div>
        </div>
        <div style="background:#f5f7f9;padding:14px;text-align:center;font-size:11px;color:#aaa">
          GB Iron Solutions · HC 23 Box 6787, Juncos, PR 00777
        </div>
      </div>
    `,
    replyTo: email,
  };

  // ── Confirmation email sent TO the customer ──────────────────────────────
  const customerMail = {
    from: `"GB Iron Solutions" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: 'We received your estimate request!',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden">
        <div style="background:#2a4d66;padding:24px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:22px">Thank you, ${nombre}!</h1>
          <p style="color:#a0c4dd;margin:6px 0 0">Your request has been received</p>
        </div>
        <div style="padding:28px 32px;color:#333">
          <p>Hi <strong>${fullName}</strong>,</p>
          <p>We received your free estimate request for <strong>${serviceLabel}</strong>. Our team will review it and get back to you within <strong>24 hours</strong>.</p>
          <p>In the meantime, feel free to reach us directly:</p>
          <ul style="line-height:2">
            <li>Phone / WhatsApp: <a href="tel:+17873250146">+1-787-325-0146</a></li>
            <li>Email: <a href="mailto:gbironsolution@gmail.com">gbironsolution@gmail.com</a></li>
          </ul>
          <p style="margin-top:24px">— The GB Iron Solutions Team</p>
        </div>
        <div style="background:#f5f7f9;padding:14px;text-align:center;font-size:11px;color:#aaa">
          GB Iron Solutions · HC 23 Box 6787, Juncos, PR 00777
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(companyMail);
    await transporter.sendMail(customerMail);
    return res.json({ ok: true });
  } catch (err) {
    console.error('Email error:', err.message);
    return res.status(500).json({ ok: false, error: 'Failed to send email.' });
  }
});

// ── Start server ───────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`GB Iron Solutions server running on http://localhost:${PORT}`);
});
