import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';
import { checkRateLimit } from '@/lib/ratelimit';
import { validateOrigin } from '@/lib/security/csrf';

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// 이메일 헤더(subject)에 들어갈 값의 개행·제어문자 제거 — 헤더 인젝션 방지.
// `이름\nBcc: victim@…` 같은 입력으로 메일 헤더를 조작하지 못하게 한 줄로 강제.
function sanitizeHeader(str: string): string {
  return str.replace(/[\r\n\t]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 100);
}

export async function POST(request: NextRequest) {
  try {
    // 무인증 + 이메일 발송 엔드포인트 → 형제 라우트(contact)와 동일하게
    // origin 검증 + rate limit 으로 이메일 폭탄·쿼터 소진·DB 스팸 차단 (C9).
    if (!validateOrigin(request)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const { allowed } = await checkRateLimit(`copyright:${ip}`, { windowMs: 60 * 60 * 1000, maxRequests: 5 });
    if (!allowed) {
      return NextResponse.json({ error: '신고 요청이 너무 많습니다. 1시간 후 다시 시도해주세요.' }, { status: 429 });
    }

    const body = await request.json();
    const { reporter_name, reporter_email, recipe_url, description } = body;

    if (!reporter_email || !reporter_email.includes('@')) {
      return NextResponse.json({ error: '이메일 주소를 입력해주세요.' }, { status: 400 });
    }
    if (!description || description.trim().length < 20) {
      return NextResponse.json({ error: '신고 내용을 20자 이상 입력해주세요.' }, { status: 400 });
    }

    const supabase = await createClient();

    // contact_inquiries 테이블에 저장 (category='copyright')
    // Supabase는 RLS/제약 거부 시 throw 안 하고 { error } 반환 → 명시 체크 필수.
    const { error: insertError } = await supabase.from('contact_inquiries').insert({
      user_id: null,
      email: reporter_email.trim(),
      category: 'other',
      content: `[저작권 신고]\n신고자: ${reporter_name?.trim() || '익명'}\n신고 URL: ${recipe_url?.trim() || '미기입'}\n\n${description.trim()}`,
      screenshot_url: null,
    });
    if (insertError) {
      console.error('Copyright report insert error:', insertError);
      return NextResponse.json(
        { error: '신고 접수에 실패했습니다. hello@naelum.app 으로 직접 연락해주세요.' },
        { status: 500 }
      );
    }

    // 운영자 이메일 알림
    if (process.env.RESEND_API_KEY && process.env.DEVELOPER_NOTIFY_EMAIL) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: 'Naelum(낼름) <hello@naelum.app>',
          to: process.env.DEVELOPER_NOTIFY_EMAIL,
          subject: `[낼름 저작권 신고] ${sanitizeHeader(reporter_name || reporter_email)}`,
          html: `
            <h2>저작권 신고 접수</h2>
            <p><strong>신고자:</strong> ${escapeHtml(reporter_name || '익명')}</p>
            <p><strong>이메일:</strong> ${escapeHtml(reporter_email)}</p>
            <p><strong>신고 URL:</strong> ${escapeHtml(recipe_url || '미기입')}</p>
            <p><strong>내용:</strong></p>
            <pre style="background:#f5f5f5;padding:12px;border-radius:6px;white-space:pre-wrap">${escapeHtml(description.trim())}</pre>
            <hr/>
            <p style="color:#666;font-size:12px">영업일 3일 이내 처리 요망</p>
          `,
        });
      } catch { /* 알림 실패해도 신고 접수는 성공 처리 */ }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Copyright report error:', error);
    return NextResponse.json({ error: '신고 접수에 실패했습니다. hello@naelum.app 으로 직접 연락해주세요.' }, { status: 500 });
  }
}
