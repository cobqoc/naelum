import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { checkRateLimit } from '@/lib/ratelimit';
import { validateOrigin } from '@/lib/security/csrf';

const VALID_CATEGORIES = ['bug', 'feature', 'other'] as const;

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export async function POST(request: NextRequest) {
  try {
    if (!validateOrigin(request)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const { allowed } = await checkRateLimit(`contact:${ip}`, { windowMs: 60 * 60 * 1000, maxRequests: 5 });
    if (!allowed) {
      return NextResponse.json({ error: '문의 요청이 너무 많습니다. 1시간 후 다시 시도해주세요.' }, { status: 429 });
    }

    const body = await request.json();
    const { category, content, email, screenshotUrl } = body;

    if (!content || content.trim().length < 10) {
      return NextResponse.json({ error: '내용을 10자 이상 입력해주세요.' }, { status: 400 });
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: '유효하지 않은 카테고리입니다.' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let resolvedEmail: string | null = null;
    let userId: string | null = null;

    if (user) {
      userId = user.id;
      resolvedEmail = user.email ?? null;
    } else {
      if (!email || !email.includes('@')) {
        return NextResponse.json({ error: '이메일 주소를 입력해주세요.' }, { status: 400 });
      }
      resolvedEmail = email.trim();
    }

    const { error } = await supabase.from('contact_inquiries').insert({
      user_id: userId,
      email: resolvedEmail,
      category,
      content: content.trim(),
      screenshot_url: screenshotUrl ?? null,
    });

    if (error) throw error;

    // 개발자 이메일 알림 (실패해도 문의 접수는 성공 처리)
    if (process.env.RESEND_API_KEY && process.env.DEVELOPER_NOTIFY_EMAIL) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const categoryLabel = ({ bug: '🐛 버그 신고', feature: '💡 기능 제안', other: '💬 기타' } as Record<string, string>)[category] ?? category;
        const preview = content.trim().slice(0, 50);
        await resend.emails.send({
          from: 'onboarding@resend.dev',
          to: process.env.DEVELOPER_NOTIFY_EMAIL,
          subject: `[낼름 문의] ${categoryLabel} — ${preview}${content.trim().length > 50 ? '...' : ''}`,
          html: `
            <p><strong>유형:</strong> ${categoryLabel}</p>
            <p><strong>이메일:</strong> ${resolvedEmail ?? '없음'}</p>
            <p><strong>내용:</strong></p>
            <pre style="background:#f5f5f5;padding:12px;border-radius:6px;white-space:pre-wrap">${escapeHtml(content.trim())}</pre>
            ${screenshotUrl ? `<p><strong>스크린샷:</strong> <a href="${escapeHtml(screenshotUrl)}">${escapeHtml(screenshotUrl)}</a></p>` : ''}
          `,
        });
      } catch { /* 알림 실패는 무시 */ }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Contact inquiry error:', error);
    return NextResponse.json({ error: '문의 접수에 실패했습니다.' }, { status: 500 });
  }
}
