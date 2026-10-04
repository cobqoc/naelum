# 🚀 Supabase 연결 가이드 (Next.js 16)

> ⚠️ **2026-02-02 초기 연결 템플릿 — 아래 코드 블록은 개념 예시이며 현재 리포와 다르다.** 현행 기준(2026-10-04 확인):
> - 미들웨어는 루트 `middleware.ts` 가 아니라 **`proxy.ts`**(Next 16 컨벤션) — i18n 리다이렉트·AI 봇 403·세션 갱신·보호/관리자 경로·온보딩 게이트 포함. `middleware.ts` 를 새로 만들지 말 것(6절)
> - Supabase 헬퍼는 실제 파일이 기준: `lib/supabase/client.ts`(싱글톤 + `navigator.locks` 대신 Promise 체인 mutex + `document.cookie` 직접 직렬화)·`server.ts`·`middleware.ts`(`{ response, user }` 반환 + 검증된 user.id 를 `x-naelum-user-id` 헤더로 주입)
> - 모든 페이지는 `app/[lang]/…` 아래(경로 기반 i18n). 로그인은 `app/[lang]/signin`, OAuth 콜백은 `app/[lang]/auth/callback/route.ts`
> - `recipes.is_published` 컬럼은 없다 → `status`(`'draft' | 'private' | 'published'`)
> - **Supabase Realtime·Functions 사용 금지** — `next.config.ts` 가 `@supabase/realtime-js`·`functions-js` 를 shim 으로 대체(CLAUDE.md "Storage / 이식성")
> - 환경 변수 템플릿은 리포 루트 `env.example`(Supabase 3개 외 `NEXT_PUBLIC_SITE_URL`·`CRON_SECRET` 등)
> - Storage 버킷 7개 — `lib/storage/index.ts` 의 `StorageBucket`
> - `lib/supabase/database.types.ts` 는 `supabase gen types` 생성물이 아닌 2026-04 수기 스냅샷(재생성 필요)
> - 스키마: 리포만으로는 현행 스키마를 처음부터 재현할 수 없다 — 기반 테이블은 초기 `supabase-schema.sql` 에만 있고, 일부 변경은 마이그레이션 없이 DB 에 직접 적용됐다(예: `recipes.status` 전환 2026-04-12 — 그런데 `supabase/migrations/20260413_sync_rls_policies_to_dev.sql` 이 이 컬럼을 참조). 새 환경은 운영 DB 스키마(덤프) 기준, 이후 변경만 `supabase/migrations/` 로

## 📋 목차
1. [필수 패키지 설치](#1-필수-패키지-설치)
2. [환경 변수 설정](#2-환경-변수-설정)
3. [Supabase 클라이언트 설정](#3-supabase-클라이언트-설정)
4. [TypeScript 타입 생성](#4-typescript-타입-생성)
5. [인증 설정](#5-인증-설정)
6. [미들웨어 설정](#6-미들웨어-설정)
7. [사용 예시](#7-사용-예시)

---

## 1. 필수 패키지 설치

터미널에서 다음 명령어를 실행하세요:

```bash
npm install @supabase/supabase-js @supabase/ssr
```

---

## 2. 환경 변수 설정

### 📁 `.env.local` 파일 생성

프로젝트 루트에 `.env.local` 파일을 만들고 다음 내용을 추가하세요:

```env
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# 선택사항: Service Role Key (서버사이드 관리자 작업용)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 🔑 Supabase 키 찾는 방법

1. [Supabase Dashboard](https://app.supabase.com) 접속
2. 프로젝트 선택
3. **Settings** → **API** 메뉴
4. **Project URL** 복사 → `NEXT_PUBLIC_SUPABASE_URL`
5. **anon public** 키 복사 → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. **service_role** 키 복사 → `SUPABASE_SERVICE_ROLE_KEY` (선택사항)

### 📁 `.env.example` 파일 생성 (Git 용)

> 이 리포의 실제 템플릿은 루트 `env.example` 이다(아래 3개 외 사이트 URL·크론 시크릿·VAPID·Resend·Sentry 등 — 각 항목 주석 참고).

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### ⚠️ `.gitignore` 확인

`.env.local`이 `.gitignore`에 포함되어 있는지 확인하세요:

```gitignore
# .gitignore
.env*.local
.env.local
```

---

## 3. Supabase 클라이언트 설정

### 📁 `lib/supabase/client.ts` (클라이언트 사이드)

> 개념 예시 — 실제 `lib/supabase/client.ts` 는 싱글톤으로 공유하고, 브라우저 확장이 `navigator.locks` 를 막는 문제 때문에 auth lock 을 Promise 체인 mutex 로 바꾸고 쿠키를 `document.cookie` 로 직접 직렬화한다.

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### 📁 `lib/supabase/server.ts` (서버 사이드)

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component에서는 쿠키 설정 불가
          }
        },
      },
    }
  )
}
```

### 📁 `lib/supabase/middleware.ts` (미들웨어용)

> 개념 예시 — 실제 `updateSession` 은 `{ response, user }` 를 반환하고, 검증된 user.id 를 `x-naelum-user-id` request header 로 주입(클라이언트 위조 헤더는 삭제). 호출자는 루트 `proxy.ts`.

```typescript
import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // IMPORTANT: 세션 갱신
  await supabase.auth.getUser()

  return supabaseResponse
}
```

---

## 4. TypeScript 타입 생성

> 현재 리포의 `lib/supabase/database.types.ts` 는 아래 "방법 2" 식 **수기 스냅샷(2026-04-14 마지막 수정)** 이라 현행 테이블 상당수가 빠져 있다 — 방법 1 로 재생성 필요.

### 방법 1: Supabase CLI 사용 (권장)

```bash
# Supabase CLI 설치
npm install -g supabase

# 프로젝트 로그인
npx supabase login

# 타입 생성
npx supabase gen types typescript --project-id "your-project-id" > lib/supabase/database.types.ts
```

### 방법 2: 수동 타입 정의

📁 `lib/supabase/database.types.ts`

```typescript
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          email: string
          full_name: string | null
          avatar_url: string | null
          bio: string | null
          birth_date: string | null
          gender: string | null
          onboarding_completed: boolean
          onboarding_step: number
          followers_count: number
          following_count: number
          recipes_count: number
          level: number
          experience_points: number
          email_notifications: boolean
          push_notifications: boolean
          meal_time_notifications: boolean
          created_at: string
          updated_at: string
          last_login_at: string | null
        }
        Insert: {
          id: string
          username: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          gender?: string | null
          onboarding_completed?: boolean
          onboarding_step?: number
          followers_count?: number
          following_count?: number
          recipes_count?: number
          level?: number
          experience_points?: number
          email_notifications?: boolean
          push_notifications?: boolean
          meal_time_notifications?: boolean
          created_at?: string
          updated_at?: string
          last_login_at?: string | null
        }
        Update: {
          id?: string
          username?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          gender?: string | null
          onboarding_completed?: boolean
          onboarding_step?: number
          followers_count?: number
          following_count?: number
          recipes_count?: number
          level?: number
          experience_points?: number
          email_notifications?: boolean
          push_notifications?: boolean
          meal_time_notifications?: boolean
          created_at?: string
          updated_at?: string
          last_login_at?: string | null
        }
      }
      recipes: {
        Row: {
          id: string
          author_id: string
          title: string
          description: string | null
          thumbnail_url: string | null
          video_url: string | null
          servings: number
          prep_time_minutes: number | null
          cook_time_minutes: number | null
          total_time_minutes: number | null
          difficulty_level: string
          cuisine_type: string | null
          dish_type: string | null
          meal_type: string | null
          calories: number | null
          protein_grams: number | null
          carbs_grams: number | null
          fat_grams: number | null
          fiber_grams: number | null
          is_vegetarian: boolean
          is_vegan: boolean
          is_gluten_free: boolean
          is_dairy_free: boolean
          is_low_carb: boolean
          views_count: number
          likes_count: number
          saves_count: number
          comments_count: number
          shares_count: number
          average_rating: number
          ratings_count: number
          original_recipe_id: string | null
          is_remix: boolean
          is_published: boolean
          is_featured: boolean
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          author_id: string
          title: string
          description?: string | null
          thumbnail_url?: string | null
          video_url?: string | null
          servings?: number
          prep_time_minutes?: number | null
          cook_time_minutes?: number | null
          difficulty_level?: string
          cuisine_type?: string | null
          dish_type?: string | null
          meal_type?: string | null
          calories?: number | null
          protein_grams?: number | null
          carbs_grams?: number | null
          fat_grams?: number | null
          fiber_grams?: number | null
          is_vegetarian?: boolean
          is_vegan?: boolean
          is_gluten_free?: boolean
          is_dairy_free?: boolean
          is_low_carb?: boolean
          views_count?: number
          likes_count?: number
          saves_count?: number
          comments_count?: number
          shares_count?: number
          average_rating?: number
          ratings_count?: number
          original_recipe_id?: string | null
          is_remix?: boolean
          is_published?: boolean
          is_featured?: boolean
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          author_id?: string
          title?: string
          description?: string | null
          thumbnail_url?: string | null
          video_url?: string | null
          servings?: number
          prep_time_minutes?: number | null
          cook_time_minutes?: number | null
          difficulty_level?: string
          cuisine_type?: string | null
          dish_type?: string | null
          meal_type?: string | null
          calories?: number | null
          protein_grams?: number | null
          carbs_grams?: number | null
          fat_grams?: number | null
          fiber_grams?: number | null
          is_vegetarian?: boolean
          is_vegan?: boolean
          is_gluten_free?: boolean
          is_dairy_free?: boolean
          is_low_carb?: boolean
          views_count?: number
          likes_count?: number
          saves_count?: number
          comments_count?: number
          shares_count?: number
          average_rating?: number
          ratings_count?: number
          original_recipe_id?: string | null
          is_remix?: boolean
          is_published?: boolean
          is_featured?: boolean
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      // 필요한 다른 테이블들도 추가...
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
```

---

## 5. 인증 설정

### 📁 `app/[lang]/auth/callback/route.ts` (OAuth Callback — 아래는 개념 예시)

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'
      
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // 에러 발생 시 에러 페이지로 리다이렉트
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
```

### 📁 `app/[lang]/signin/page.tsx` (로그인 페이지 — 아래는 개념 예시)

```typescript
'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      alert(error.message)
    } else {
      window.location.href = '/'
    }
    
    setLoading(false)
  }

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      alert(error.message)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 p-8">
        <h2 className="text-3xl font-bold text-center">로그인</h2>

        {/* Google 로그인 */}
        <button
          onClick={handleGoogleLogin}
          className="w-full bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
        >
          Google로 로그인
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-500">또는</span>
          </div>
        </div>

        {/* 이메일 로그인 */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

---

## 6. 미들웨어 설정

### 📁 `proxy.ts` (프로젝트 루트 — Next 16 컨벤션)

> 이 리포는 루트 `middleware.ts` 를 쓰지 않는다. Next 16 의 **`proxy.ts`**(`export async function proxy`)가
> i18n 리다이렉트(lang prefix 없는 경로 → `/{lang}`)·AI 크롤러 403·세션 갱신(`updateSession`)·보호/관리자 경로·
> 약관/온보딩 게이트·`Cache-Control: no-store` 를 담당한다 — 구조는 파일 참조. **`middleware.ts` 를 새로 만들면
> `proxy.ts` 와 중복되니 만들지 말 것.** 초기 템플릿의 `middleware.ts` 예시는 삭제했고, matcher 만 아래와 같이 동일하다.

```typescript
export const config = {
  matcher: [
    /*
     * 다음 경로를 제외한 모든 요청에 매칭:
     * - _next/static (정적 파일)
     * - _next/image (이미지 최적화)
     * - favicon.ico (파비콘)
     * - public 폴더의 파일들
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

---

## 7. 사용 예시

### 📁 Server Component에서 사용

```typescript
// app/[lang]/recipes/page.tsx (개념 예시)
import { createClient } from '@/lib/supabase/server'

export default async function RecipesPage() {
  const supabase = await createClient()

  // 레시피 목록 가져오기
  const { data: recipes, error } = await supabase
    .from('recipes')
    .select(`
      *,
      author:profiles(username, avatar_url),
      ingredients:recipe_ingredients(*)
    `)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('Error fetching recipes:', error)
    return <div>레시피를 불러오는데 실패했습니다.</div>
  }

  return (
    <div>
      <h1>레시피 목록</h1>
      {recipes?.map((recipe) => (
        <div key={recipe.id}>
          <h2>{recipe.title}</h2>
          <p>작성자: {recipe.author?.username}</p>
        </div>
      ))}
    </div>
  )
}
```

### 📁 Client Component에서 사용

> ⚠️ 현재 규칙상 클라이언트 컴포넌트의 Supabase 직접 read 는 금지다(`npm run scan:fragility` 의 RATCHET 이 머지 차단) — 데이터는 서버 컴포넌트·`lib/queries/`·API 라우트에서 읽고 props 로 내린다(`docs/DATA_LAYER.md`). 아래는 초기 템플릿의 개념 예시.

```typescript
'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export default function RecipesList() {
  const [recipes, setRecipes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchRecipes() {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error:', error)
      } else {
        setRecipes(data || [])
      }
      setLoading(false)
    }

    fetchRecipes()
  }, [])

  if (loading) return <div>로딩 중...</div>

  return (
    <div>
      {recipes.map((recipe) => (
        <div key={recipe.id}>{recipe.title}</div>
      ))}
    </div>
  )
}
```

### 📁 API Route에서 사용

```typescript
// app/api/recipes/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()

  const { data: recipes, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('status', 'published')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ recipes })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  
  // 현재 로그인한 사용자 확인
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  const { data, error } = await supabase
    .from('recipes')
    .insert({
      ...body,
      author_id: user.id,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ recipe: data })
}
```

### 📁 실시간 구독 (Realtime) — ⛔ 사용 금지

> 초기 템플릿에 있던 `supabase.channel(...).on('postgres_changes', …)` 예제는 삭제했다. 이 리포는 `next.config.ts` 에서
> `@supabase/realtime-js` 를 shim(`lib/supabase/shims/realtime-js.ts`)으로 대체하므로 그 코드는 동작하지 않으며,
> CLAUDE.md "Storage / 이식성" 규칙상 Realtime 사용 자체가 금지다. 알림은 요청 기반(`/api/notifications`)으로 조회한다.

---

## 📁 최종 프로젝트 구조

```
naelum/ (2026-10-04 기준 — 주요 경로만)
├── app/
│   ├── layout.tsx                # 루트 레이아웃
│   ├── [lang]/                   # 모든 페이지 (경로 기반 i18n)
│   │   ├── auth/callback/route.ts  # OAuth 콜백
│   │   ├── signin/page.tsx       # 로그인 페이지
│   │   ├── signup/               # 회원가입
│   │   └── recipes/page.tsx      # 레시피 목록
│   └── api/
│       └── recipes/route.ts      # API Routes (스스로 인증)
├── lib/
│   ├── queries/                  # 서버 read 데이터 계층
│   ├── storage/                  # Storage 래퍼 (업로드는 반드시 경유)
│   └── supabase/
│       ├── client.ts             # 클라이언트 사이드 (싱글톤)
│       ├── server.ts             # 서버 사이드
│       ├── middleware.ts         # updateSession (proxy.ts 가 호출)
│       ├── service.ts            # service role 클라이언트
│       ├── shims/                # realtime-js·functions-js·iceberg-js 대체
│       └── database.types.ts     # 수기 타입 스냅샷 (재생성 필요)
├── supabase/migrations/          # 스키마 변경 SQL
├── proxy.ts                      # Next 16 미들웨어 (middleware.ts 아님)
├── .env.local                    # 환경 변수 (gitignore)
├── env.example                   # 환경 변수 템플릿
└── package.json
```

---

## ✅ 체크리스트

### Supabase Dashboard 설정
- [ ] 프로젝트 생성
- [ ] 스키마 준비 — ⚠️ 초기 `supabase-schema.sql` 단독 실행 금지(폐기된 설계). 리포만으로는 현행 스키마를 재현할 수 없으니(머리 경고 참고) 운영 DB 스키마 기준으로 만들고, 이후 변경만 `supabase/migrations/` 로
- [ ] OAuth 설정 (Authentication → Providers — 현재 Google·Kakao 사용)
- [ ] Redirect URLs 추가:
  - `http://localhost:3000/auth/callback`
  - `https://yourdomain.com/auth/callback`
- [ ] Storage Buckets 생성 — 7개: recipe-images, recipe-videos, tip-images, avatars, step-images, contact-screenshots, recipe-completion-photos (`lib/storage/index.ts` `StorageBucket`)
- [ ] RLS 정책 확인

### 프로젝트 설정
- [ ] 패키지 설치 (`@supabase/supabase-js`, `@supabase/ssr`)
- [ ] `.env.local` 파일 생성 및 키 설정
- [ ] `lib/supabase/` 폴더 및 파일 생성
- [ ] `proxy.ts` 확인 (이미 있음 — `middleware.ts` 는 만들지 말 것)
- [ ] TypeScript 타입 생성
- [ ] 로그인/회원가입 페이지 구현
- [ ] OAuth 콜백 라우트 생성

### 테스트
- [ ] 로그인 테스트
- [ ] 데이터 조회 테스트
- [ ] 파일 업로드 테스트 (`lib/storage` 경유)

---

## 🔧 트러블슈팅

### 문제: "Invalid API key" 에러
**해결**: `.env.local` 파일의 키가 정확한지 확인하고, 개발 서버를 재시작하세요.

```bash
npm run dev
```

### 문제: OAuth 리다이렉트 에러
**해결**: Supabase Dashboard에서 Redirect URLs가 정확히 설정되었는지 확인하세요.

### 문제: RLS 정책으로 데이터 조회 불가
**해결**: Supabase Dashboard → Authentication → Policies에서 RLS 정책을 확인하고, 필요시 수정하세요.

### 문제: TypeScript 타입 에러
**해결**: `database.types.ts` 파일을 다시 생성하거나, 수동으로 타입을 정의하세요.

---

## 📚 추가 참고 자료

- [Supabase 공식 문서](https://supabase.com/docs)
- [Next.js + Supabase 가이드](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

**작성일**: 2026-02-02  
**버전**: 1.0.0  
**Next.js 버전**: 작성 당시 16.1.6 (현재 16.2.x — lockfile 16.2.6)  
**작성자**: 낼름 개발팀
