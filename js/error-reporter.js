// ============================================
// KLUNE STREAM - Error Reporter via Telegram
// ============================================

const TG_BOT_TOKEN = '8531018541:AAFPzE2Rcpz_GHbRYkx9h6eQg_CvNKZcGWg';
const TG_CHAT_ID   = '7411016617';
const TG_API       = 'https://api.telegram.org/bot' + TG_BOT_TOKEN + '/sendMessage';

// Hindari spam — max 1 error per 10 detik
let _lastSent = 0;
const COOLDOWN = 10000;
const _sentErrors = new Set();

async function sendToTelegram(text) {
  try {
    await fetch(TG_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TG_CHAT_ID,
        text: text,
        parse_mode: 'HTML',
      }),
    });
  } catch (e) {
    // silent — jangan sampai reporter ini sendiri bikin error loop
    console.warn('[TG Reporter] Gagal kirim:', e.message);
  }
}

function reportError(context, error, extra) {
  const now = Date.now();
  const key = context + '|' + String(error).slice(0, 80);

  // Skip kalau error yang sama sudah dikirim dalam sesi ini
  if (_sentErrors.has(key)) return;
  // Skip kalau terlalu cepat dari pesan terakhir
  if (now - _lastSent < COOLDOWN) return;

  _sentSent = now;
  _lastSent = now;
  _sentErrors.add(key);

  const time = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
  const page = window.location.pathname || '/';
  const ua   = navigator.userAgent.slice(0, 100);

  let msg = '🚨 <b>Klune Stream Error</b>\n\n';
  msg += '📍 <b>Context:</b> ' + escTg(context) + '\n';
  msg += '❌ <b>Error:</b> ' + escTg(String(error)) + '\n';
  if (extra) msg += '📝 <b>Info:</b> ' + escTg(String(extra)) + '\n';
  msg += '🌐 <b>Page:</b> ' + escTg(page) + '\n';
  msg += '⏰ <b>Waktu:</b> ' + time + '\n';
  msg += '📱 <b>UA:</b> ' + escTg(ua);

  sendToTelegram(msg);
}

function reportApiError(endpoint, statusOrError) {
  const now = Date.now();
  const key = 'api|' + endpoint;
  if (_sentErrors.has(key) || now - _lastSent < COOLDOWN) return;
  _lastSent = now;
  _sentErrors.add(key);

  const time = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
  let msg = '⚠️ <b>Klune Stream - API Gagal Total</b>\n\n';
  msg += '🔗 <b>Endpoint terakhir:</b> ' + escTg(endpoint) + '\n';
  msg += '❌ <b>Error:</b> ' + escTg(String(statusOrError)) + '\n';
  msg += '⏰ <b>Waktu:</b> ' + time;

  sendToTelegram(msg);
}

function escTg(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ── Tangkap global JS error ───────────────────────────────────────────────────
window.addEventListener('error', function(e) {
  reportError(
    'Global JS Error — ' + (e.filename || 'unknown') + ':' + e.lineno,
    e.message,
    e.error ? e.error.stack : ''
  );
});

window.addEventListener('unhandledrejection', function(e) {
  reportError(
    'Unhandled Promise Rejection',
    e.reason ? (e.reason.message || e.reason) : 'Unknown rejection',
    e.reason && e.reason.stack ? e.reason.stack.slice(0, 200) : ''
  );
});

window.reportError    = reportError;
window.reportApiError = reportApiError;
