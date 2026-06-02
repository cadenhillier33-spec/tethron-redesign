// Inbound referral from tethron.ai/refer.
// POST /api/referral-submit
// Sends a Telegram alert when env vars are present. If not, tells the browser to open mailto fallback.

const TELEGRAM_CHAT_ID = process.env.TETHRON_OPS_CHAT_ID || process.env.TELEGRAM_HOME_CHANNEL || '8133892297';
const TELEGRAM_BOT_TOKEN = process.env.TETHRON_TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;

function clean(value, max = 500) {
  return String(value || '').trim().slice(0, max);
}

function line(label, value) {
  return value ? `${label}: ${value}\n` : '';
}

async function pingTelegram(text) {
  const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, disable_web_page_preview: true }),
  });
  if (!res.ok) throw new Error(`telegram ${res.status}: ${await res.text()}`);
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    body = body || {};

    const referrerName = clean(body.referrerName, 120);
    const referrerEmail = clean(body.referrerEmail, 180);
    const referrerPhone = clean(body.referrerPhone, 80);
    const ownerName = clean(body.ownerName, 140);
    const company = clean(body.company || body.businessName, 180);
    const website = clean(body.website, 240);
    const ownerEmail = clean(body.ownerEmail, 180);
    const ownerPhone = clean(body.ownerPhone, 80);
    const ownerContact = clean(body.ownerContact, 220);
    const relationship = clean(body.relationship, 220);
    const aware = clean(body.aware || body.consent, 40);
    const need = clean(body.need || body.pain, 1000);

    if (!referrerName || (!referrerEmail && !referrerPhone)) {
      return res.status(400).json({ error: 'Add your name and email or phone.' });
    }
    if (!company && !ownerName && !website) {
      return res.status(400).json({ error: 'Add the owner, company, or website.' });
    }
    if (!ownerEmail && !ownerPhone && !ownerContact && !website) {
      return res.status(400).json({ error: 'Add owner contact info or a company website.' });
    }

    const msg =
      '💸 NEW TETHRON REFERRAL\n\n' +
      'Referrer\n' +
      line('Name', referrerName) +
      line('Email', referrerEmail) +
      line('Phone', referrerPhone) +
      '\nReferred business\n' +
      line('Company', company) +
      line('Owner', ownerName) +
      line('Owner email', ownerEmail) +
      line('Owner phone', ownerPhone) +
      line('Owner contact', ownerContact) +
      line('Website', website) +
      line('Relationship', relationship) +
      line('Aware', aware) +
      (need ? `\nWhat they need help with\n${need}\n` : '') +
      '\nSource: tethron.ai/refer\n' +
      'Referral page promise: up to $1,000 if they become a Tethron client.';

    if (!TELEGRAM_BOT_TOKEN) {
      console.error('referral-submit missing Telegram bot token');
      return res.status(200).json({ ok: false, fallbackRequired: true });
    }

    await pingTelegram(msg);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('referral-submit error:', err.message);
    return res.status(200).json({ ok: false, fallbackRequired: true });
  }
};
