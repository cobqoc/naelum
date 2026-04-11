/**
 * YouTube Data API v3으로 요리 관련 영상을 검색합니다.
 *
 * 사용법: npx tsx scripts/youtube-search.ts "김치찌개 레시피"
 * 또는:   npx tsx scripts/youtube-search.ts --channel "UCyn-K7rZLXjGl7VXGweIlcA" (채널 최신 영상)
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';

// .env.local에서 환경변수 로드
function loadEnvLocal() {
  try {
    const envPath = resolve(process.cwd(), '.env.local');
    const content = readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex);
      const value = trimmed.slice(eqIndex + 1);
      if (!process.env[key]) process.env[key] = value;
    }
  } catch { /* 무시 */ }
}
loadEnvLocal();

const API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';

interface SearchResult {
  videoId: string;
  title: string;
  channelTitle: string;
  publishedAt: string;
  url: string;
}

async function searchYouTube(query: string, maxResults: number = 10): Promise<SearchResult[]> {
  const params = new URLSearchParams({
    part: 'snippet',
    q: query,
    type: 'video',
    maxResults: String(maxResults),
    relevanceLanguage: 'ko',
    key: API_KEY!,
  });

  const res = await fetch(`${YOUTUBE_SEARCH_URL}?${params}`);
  if (!res.ok) {
    const error = await res.text();
    console.error(`ERROR: YouTube API 오류 (${res.status}):`, error);
    process.exit(1);
  }

  const data = await res.json();
  return (data.items || []).map((item: { id: { videoId: string }; snippet: { title: string; channelTitle: string; publishedAt: string } }) => ({
    videoId: item.id.videoId,
    title: item.snippet.title,
    channelTitle: item.snippet.channelTitle,
    publishedAt: item.snippet.publishedAt,
    url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
  }));
}

async function getChannelVideos(channelId: string, maxResults: number = 10): Promise<SearchResult[]> {
  const params = new URLSearchParams({
    part: 'snippet',
    channelId,
    type: 'video',
    order: 'date',
    maxResults: String(maxResults),
    key: API_KEY!,
  });

  const res = await fetch(`${YOUTUBE_SEARCH_URL}?${params}`);
  if (!res.ok) {
    const error = await res.text();
    console.error(`ERROR: YouTube API 오류 (${res.status}):`, error);
    process.exit(1);
  }

  const data = await res.json();
  return (data.items || []).map((item: { id: { videoId: string }; snippet: { title: string; channelTitle: string; publishedAt: string } }) => ({
    videoId: item.id.videoId,
    title: item.snippet.title,
    channelTitle: item.snippet.channelTitle,
    publishedAt: item.snippet.publishedAt,
    url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
  }));
}

async function main() {
  if (!API_KEY) {
    console.error('ERROR: YOUTUBE_API_KEY가 설정되지 않았습니다.');
    process.exit(1);
  }

  const args = process.argv.slice(2);

  if (args[0] === '--channel' && args[1]) {
    // 채널 최신 영상 검색
    const results = await getChannelVideos(args[1], parseInt(args[2]) || 10);
    console.log(JSON.stringify(results, null, 2));
  } else if (args.length > 0) {
    // 키워드 검색
    const query = args.join(' ');
    const results = await searchYouTube(query);
    console.log(JSON.stringify(results, null, 2));
  } else {
    console.error('사용법:');
    console.error('  npx tsx scripts/youtube-search.ts "검색 키워드"');
    console.error('  npx tsx scripts/youtube-search.ts --channel "채널ID" [개수]');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
