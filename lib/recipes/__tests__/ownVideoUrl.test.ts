import { describe, it, expect } from 'vitest';
import { pickOwnVideoUrl } from '../ownVideoUrl';

const PREFIX = 'https://x.supabase.co/storage/v1/object/public/recipe-videos/user-1/';

describe('pickOwnVideoUrl — 본인 recipe-videos 영상 URL 만 저장', () => {
  it('키가 없으면 변경 없음', () => {
    expect(pickOwnVideoUrl({ servings: 2 }, PREFIX)).toEqual({});
  });

  it('null·빈 문자열은 영상 제거', () => {
    expect(pickOwnVideoUrl({ video_url: null }, PREFIX)).toEqual({ video_url: null });
    expect(pickOwnVideoUrl({ video_url: '' }, PREFIX)).toEqual({ video_url: null });
  });

  it('본인 폴더 영상은 저장', () => {
    for (const f of ['1792504000541.mp4', '1.mov', '2.webm']) {
      expect(pickOwnVideoUrl({ video_url: PREFIX + f }, PREFIX)).toEqual({ video_url: PREFIX + f });
    }
  });

  it('외부 URL·남의 폴더·경로 조작·쿼리는 무시', () => {
    for (const v of [
      'https://evil.example/x.mp4',
      'javascript:alert(1)',
      'https://www.youtube.com/watch?v=abc',
      'https://x.supabase.co/storage/v1/object/public/recipe-videos/user-2/1.mp4',
      PREFIX + '../user-2/1.mp4',
      PREFIX + 'a/1.mp4',
      PREFIX + '1.mp4?x=1',
      PREFIX + '1.exe',
      42,
    ]) {
      expect(pickOwnVideoUrl({ video_url: v }, PREFIX)).toEqual({});
    }
  });
});
