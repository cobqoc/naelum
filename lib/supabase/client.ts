import { createBrowserClient } from '@supabase/ssr'
import { parse, serialize } from 'cookie'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
