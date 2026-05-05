const BASE = import.meta.env.VITE_API_URL || '';

async function request(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}

export const api = {
  login: (password, role) => request('POST', '/auth/login', { password, role }),
  createSale: (body, token) => request('POST', '/sales', body, token),
  getSales: (token) => request('GET', '/sales', null, token),
  scanTicket: (qrContent, token) => request('POST', '/tickets/scan', { qrContent }, token),
  getStats: (token) => request('GET', '/tickets/stats', null, token),
};
