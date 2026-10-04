import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';
import { handleReport, userReportConfig } from '@/lib/api/reportHandler';

// POST /api/users/[username]/report - 사용자 신고
// 2026-10-04 API1-35: 3벌 복붙 → lib/api/reportHandler 공용(사용자 신고 사유·'user-report' rate-limit 키·메시지 그대로).
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const supabase = await createClient();
  const { username } = await params;
  return handleReport(request, supabase, userReportConfig(username));
}
