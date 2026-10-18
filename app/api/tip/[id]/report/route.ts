import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';
import { handleReport, tipReportConfig } from '@/lib/api/reportHandler';

/**
 * POST /api/tip/[id]/report — 요리 팁 신고
 * 레시피 신고와 동일 패턴 (`reports` 테이블, `reported_type = 'tip'`).
 * 2026-10-04 API1-35: 3벌 복붙 → lib/api/reportHandler 공용(메시지·사유·rate-limit 키 그대로 주입).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id: tipId } = await params;
  return handleReport(request, supabase, tipReportConfig(tipId));
}
