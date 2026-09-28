import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loadFavorites, _resetInflightForTests } from '@/lib/favorites/loadFavorites';

function deferred<T>() {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}
const okResponse = (body: unknown) => ({ ok: true, json: async () => body }) as unknown as Response;
const failResponse = () => ({ ok: false, json: async () => ({}) }) as unknown as Response;

describe('loadFavorites — in-flight dedupe (결과 캐시 없음)', () => {
  beforeEach(() => _resetInflightForTests());
  afterEach(() => vi.unstubAllGlobals());

  it('같은 user·limit 동시 호출 → fetch 1회, 두 호출이 같은 배열 참조를 받는다', async () => {
    const d = deferred<Response>();
    const fetchMock = vi.fn(() => d.promise);
    vi.stubGlobal('fetch', fetchMock);
    const a = loadFavorites('u1', 20);
    const b = loadFavorites('u1', 20);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/api/favorites?limit=20');
    d.resolve(okResponse({ items: [{ ingredient_name: '양파' }] }));
    const [ra, rb] = await Promise.all([a, b]);
    expect(ra).toEqual([{ ingredient_name: '양파' }]);
    expect(rb).toBe(ra);
  });

  it('limit 이 다르면 각각 요청한다', async () => {
    const fetchMock = vi.fn(async () => okResponse({ items: [] }));
    vi.stubGlobal('fetch', fetchMock);
    await Promise.all([loadFavorites('u1', 20), loadFavorites('u1', 50)]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/favorites?limit=20');
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/favorites?limit=50');
  });

  it('user 가 다르면 같은 limit 이라도 공유하지 않는다', async () => {
    const fetchMock = vi.fn(async () => okResponse({ items: [] }));
    vi.stubGlobal('fetch', fetchMock);
    await Promise.all([loadFavorites('u1', 20), loadFavorites('u2', 20)]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('정착 후 재호출은 새 요청이다 (freshness 는 오늘과 동일)', async () => {
    const fetchMock = vi.fn(async () => okResponse({ items: [] }));
    vi.stubGlobal('fetch', fetchMock);
    await loadFavorites('u1', 20);
    await loadFavorites('u1', 20);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('!ok → null 을 돌려주고, 다음 호출은 다시 요청한다', async () => {
    const fetchMock = vi.fn(async () => failResponse());
    vi.stubGlobal('fetch', fetchMock);
    expect(await loadFavorites('u1', 20)).toBeNull();
    await loadFavorites('u1', 20);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('fetch reject → null (throw 하지 않음), 다음 호출은 다시 요청한다', async () => {
    const fetchMock = vi.fn(async () => { throw new TypeError('network'); });
    vi.stubGlobal('fetch', fetchMock);
    await expect(loadFavorites('u1', 20)).resolves.toBeNull();
    await loadFavorites('u1', 20);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('fetch 가 동기 throw 해도 in-flight 맵이 오염되지 않는다', async () => {
    const fetchMock = vi.fn(() => { throw new TypeError('sync'); });
    vi.stubGlobal('fetch', fetchMock);
    await expect(loadFavorites('u1', 20)).resolves.toBeNull();
    await loadFavorites('u1', 20);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('items 가 배열이 아니면 [] 로 정규화한다', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => okResponse({ items: 'nope' })));
    expect(await loadFavorites('u1', 20)).toEqual([]);
  });
});
