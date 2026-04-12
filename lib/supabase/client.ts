import { createBrowserClient } from '@supabase/ssr'
import { parse, serialize } from 'cookie'

// navigator.locks가 MetaMask/SES 등 브라우저 확장에 의해 차단될 수 있음.
// 차단 시 Supabase _acquireLock에서 AbortError가 발생해 세션 초기화 전체가 실패함.
// 심플한 Promise 체인 mutex로 대체해 navigator.locks 의존성을 제거.
let _lockQueue: Promise<unknown> = Promise.resolve();
function simpleLock<T>(_name: string, _timeout: number, fn: () => Promise<T>): Promise<T> {
  const next = _lockQueue.then(() => fn());
  _lockQueue = next.catch(() => {});
  return next;
}

function newClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        lock: simpleLock,
      },
      cookies: {
        getAll() {
          if (typeof document === 'undefined') return []
          const parsed = parse(document.cookie)
          return Object.keys(parsed).map(name => ({
            name,
            value: parsed[name] ?? '',
          }))
        },
        setAll(cookies) {
          if (typeof document === 'undefined') return
          cookies.forEach(({ name, value, options }) => {
            document.cookie = serialize(name, value, options)
          })
        },
      },
    }
  )
}

// 싱글톤: 같은 인스턴스를 공유해야 signInWithPassword()의 SIGNED_IN 이벤트가
// auth context의 onAuthStateChange로 직접 전달됨
// ReturnType<typeof newClient>으로 타입 보존 (제네릭 파라미터 유지)
let _client: ReturnType<typeof newClient> | null = null

export function createClient() {
  if (!_client) _client = newClient()
  return _client
}
