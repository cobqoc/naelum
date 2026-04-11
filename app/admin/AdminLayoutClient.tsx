'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

interface AdminLayoutClientProps {
  profile: {
    role: string
    username: string
  }
  children: React.ReactNode
}

export default function AdminLayoutClient({ profile, children }: AdminLayoutClientProps) {
  const pathname = usePathname()

  const navItems = [
    { key: 'dashboard', label: '대시보드', icon: '📊', href: '/admin' },
    { key: 'users', label: '사용자 관리', icon: '👥', href: '/admin/users' },
    { key: 'recipes', label: '레시피 관리', icon: '🍳', href: '/admin/recipes' },
    { key: 'reports', label: '신고 관리', icon: '🚨', href: '/admin/reports' },
    { key: 'inquiries', label: '문의 관리', icon: '✉️', href: '/admin/inquiries' },
    { key: 'analytics', label: '통계', icon: '📈', href: '/admin/analytics' },
    { key: 'actions', label: '감사 로그', icon: '🗂️', href: '/admin/actions' },
  ]

  return (
    <div className="min-h-screen bg-background-primary text-text-primary">
      {/* Admin Header */}
      <header className="fixed top-0 z-50 w-full bg-background-secondary/90 backdrop-blur-xl border-b border-white/10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xl font-bold text-accent-warm">
              낼름
            </Link>
            <span className="px-2 py-1 text-xs font-bold rounded bg-error text-white">
              ADMIN
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-text-muted hidden md:block">@{profile.username}</span>
            <Link
              href="/"
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm transition-colors"
            >
              메인으로
            </Link>
          </div>
        </div>
      </header>

      <div className="flex pt-16">
        {/* Sidebar - Desktop */}
        <aside className="hidden md:block fixed left-0 top-16 w-64 h-[calc(100vh-4rem)] bg-background-secondary border-r border-white/10 overflow-y-auto">
          <nav className="p-4 space-y-2">
            {navItems.map(item => (
              <Link
                key={item.key}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  pathname === item.href
                    ? 'bg-accent-warm text-background-primary font-bold'
                    : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 md:ml-64 p-4 md:p-6 pb-24 md:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background-secondary border-t border-white/10 z-40">
        <div className="flex justify-around py-2">
          {navItems.map(item => (
            <Link
              key={item.key}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                pathname === item.href
                  ? 'text-accent-warm'
                  : 'text-text-muted'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  )
}
