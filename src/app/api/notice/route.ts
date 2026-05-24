import { NextRequest, NextResponse } from 'next/server';

const BASE = process.env.N8N_BASE_URL || 'http://localhost:5678';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const payload = JSON.stringify(body);
  const headers = { 'Content-Type': 'application/json' };

  for (const url of [`${BASE}/webhook/notice`, `${BASE}/webhook-test/notice`]) {
    try {
      const res = await fetch(url, { method: 'POST', headers, body: payload });
      if (res.ok) return new NextResponse(await res.text(), { status: 200 });
    } catch { /* try next */ }
  }
  return new NextResponse('n8n 워크플로우에 연결할 수 없습니다.', { status: 503 });
}
