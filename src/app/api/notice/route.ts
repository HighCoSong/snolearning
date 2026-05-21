import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const payload = JSON.stringify(body);
  const headers = { 'Content-Type': 'application/json' };

  for (const url of [
    'http://localhost:5678/webhook/notice',
    'http://localhost:5678/webhook-test/notice',
  ]) {
    try {
      const res = await fetch(url, { method: 'POST', headers, body: payload });
      if (res.ok) {
        const text = await res.text();
        return new NextResponse(text, { status: 200 });
      }
    } catch {
      // try next
    }
  }
  return new NextResponse('n8n 워크플로우에 연결할 수 없습니다. n8n이 실행 중인지 확인해주세요.', { status: 503 });
}
