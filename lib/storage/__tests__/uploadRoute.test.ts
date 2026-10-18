import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { parseUploadForm, uploadAndRespond } from '../uploadRoute';

// 2026-10-04 AG2-33: upload ↔ upload-video 공통 골격. 기대값은 원본 두 route.ts 리터럴 그대로.
describe('parseUploadForm', () => {
  it('multipart 가 아니면 400 요청 형식이 잘못되었습니다.', async () => {
    const r = await parseUploadForm(new Request('http://x', { method: 'POST', body: 'not-multipart', headers: { 'content-type': 'text/plain' } }));
    expect(r.response!.status).toBe(400);
    expect(await r.response!.json()).toEqual({ error: '요청 형식이 잘못되었습니다.' });
  });

  it('file 필드 없음 → 400 파일을 선택해주세요.', async () => {
    const fd = new FormData();
    fd.set('bucket', 'avatars');
    const r = await parseUploadForm(new Request('http://x', { method: 'POST', body: fd }));
    expect(r.response!.status).toBe(400);
    expect(await r.response!.json()).toEqual({ error: '파일을 선택해주세요.' });
  });

  it('정상 → file·form 반환(다른 필드도 그대로 읽힘)', async () => {
    const fd = new FormData();
    fd.set('file', new File([new Uint8Array([1, 2, 3])], 'a.png', { type: 'image/png' }));
    fd.set('bucket', 'avatars');
    const r = await parseUploadForm(new Request('http://x', { method: 'POST', body: fd }));
    expect(r.response).toBeUndefined();
    expect(r.file!.type).toBe('image/png');
    expect(r.form!.get('bucket')).toBe('avatars');
  });
});

function fakeStorage(uploadResult: { data: { path: string } | null; error: { message: string } | null }) {
  const calls: unknown[] = [];
  const bucketApi = (bucket: string) => ({
    upload: async (path: string, _file: unknown, opts: unknown) => { calls.push(['upload', bucket, path, opts]); return uploadResult; },
    getPublicUrl: (path: string) => ({ data: { publicUrl: `https://cdn/${bucket}/${path}` } }),
  });
  return { client: { storage: { from: bucketApi } } as unknown as SupabaseClient, calls };
}

describe('uploadAndRespond', () => {
  it('업로드 실패 → 500 "업로드 중 오류가 발생했습니다: " + 메시지', async () => {
    const { client } = fakeStorage({ data: null, error: { message: 'boom' } });
    const res = await uploadAndRespond(client, 'avatars', 'u1/1.png', new ArrayBuffer(1), 'image/png');
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: '업로드 중 오류가 발생했습니다: boom' });
  });

  it('성공 → { url, path } (Supabase 가 돌려준 경로 우선, upsert:false·contentType 전달)', async () => {
    const { client, calls } = fakeStorage({ data: { path: 'u1/stored.png' }, error: null });
    const res = await uploadAndRespond(client, 'recipe-videos', 'u1/1.mp4', new ArrayBuffer(1), 'video/mp4');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ url: 'https://cdn/recipe-videos/u1/stored.png', path: 'u1/stored.png' });
    expect(calls).toEqual([['upload', 'recipe-videos', 'u1/1.mp4', { contentType: 'video/mp4', upsert: false }]]);
  });

  it('경로 미반환이면 요청 파일명으로', async () => {
    const { client } = fakeStorage({ data: null, error: null });
    const res = await uploadAndRespond(client, 'avatars', 'u1/9.png', new ArrayBuffer(1), 'image/png');
    expect(await res.json()).toEqual({ url: 'https://cdn/avatars/u1/9.png', path: 'u1/9.png' });
  });
});
