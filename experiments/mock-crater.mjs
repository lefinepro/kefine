import http from 'node:http';

const PORT = 3001;
const SHARE_ID = process.env.MOCK_SHARE_ID || '59317a52-d7a4-49a2-98ff-5a31a04738bd';
const TITLE = process.env.MOCK_TITLE || 'Нужен мини прокси на go';

function ok(res, body) {
  res.writeHead(200, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
}

function makeOrderPayload(id) {
  const now = new Date().toISOString();
  return {
    id,
    title: TITLE,
    description: TITLE,
    status: 'in_progress',
    currency: 'USD',
    createdAt: now,
    updatedAt: now,
    accepted: true,
    shareId: id,
    isPublicTask: true,
    // Lepos payload typically nests order under "order"
    order: {
      id,
      title: TITLE,
      description: TITLE,
      status: 'in_progress',
      currency: 'USD',
      createdAt: now,
      updatedAt: now,
      accepted: true,
      shareId: id,
      isPublicTask: true
    }
  };
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  console.log(`[mock-lepos] ${req.method} ${pathname}`);

  if (pathname === '/health') {
    return ok(res, { ok: true });
  }
  // /status/<id>
  if (pathname.startsWith('/status/')) {
    const parts = pathname.split('/').filter(Boolean);
    // status/<id> -> parts = ["status", "<id>", ...]
    const id = parts[1];
    if (parts.length === 2) {
      return ok(res, makeOrderPayload(id));
    }
    if (parts[2] === 'document') {
      return ok(res, { content: '', updatedAt: new Date().toISOString() });
    }
    if (parts[2] === 'settings') {
      return ok(res, { ok: true });
    }
    if (parts[2] === 'confirm') {
      return ok(res, { ok: true });
    }
    return ok(res, makeOrderPayload(id));
  }
  // /share/<id>
  if (pathname.startsWith('/share/')) {
    const id = pathname.split('/').filter(Boolean)[1];
    return ok(res, makeOrderPayload(id));
  }
  // Default: empty 200
  res.writeHead(200, { 'content-type': 'application/json' });
  res.end('{}');
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`mock-lepos listening on http://127.0.0.1:${PORT} (share=${SHARE_ID}, title=${TITLE})`);
});
