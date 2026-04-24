import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export async function POST(request: NextRequest) {
  try {
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
    await supabase.from('contact_inquiries').insert({
      user_id: null,
      email: reporter_email.trim(),
      category: 'other',
      content: `[저작권 신고]\n신고자: ${reporter_name?.trim() || '익명'}\n신고 URL: ${recipe_url?.trim() || '미기입'}\n\n${description.trim()}`,
      screenshot_url: null,
    });

    // 운영자 이메일 알림
    if (process.env.RESEND_API_KEY && process.env.DEVELOPER_NOTIFY_EMAIL) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: 'Naelum(낼름) <hello@naelum.app>',
          to: process.env.DEVELOPER_NOTIFY_EMAIL,
          subject: `[낼름 저작권 신고] ${reporter_name || reporter_email}`,
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
