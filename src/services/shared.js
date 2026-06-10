import api from './api';

// ── Terms & Privacy ──────────────────────────────────────────────────────────

export async function getTerms() {
  return api.get('/terms');
  // Response: { success, data: { title, sections: [{ title, body }], lastUpdated } }
}

// ── Support ──────────────────────────────────────────────────────────────────

export async function sendSupportMessage(subject, message, priority = 'NORMAL') {
  return api.post('/support', {subject, message, priority});
}
