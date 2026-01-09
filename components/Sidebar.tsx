'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'

const navItems = [
  {
    href: '/',
    label: 'Dashboard',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  },
  {
    href: '/campaigns',
    label: 'Campaigns',
    icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z',
  },
  {
    href: '/channels',
    label: 'Channels',
    icon: 'M7 20l4-16m2 16l4-16M6 9h14M4 15h14',
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-72 bg-obsidian-900/80 backdrop-blur-xl border-r border-obsidian-700/50 flex flex-col z-10">
      {/* Logo Section */}
      <div className="p-6 border-b border-obsidian-700/50">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-glow to-cyan-dim flex items-center justify-center shadow-[0_0_30px_rgba(0,240,255,0.4)]">
              <svg className="w-7 h-7 text-obsidian-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
            {/* Glow effect */}
            <div className="absolute inset-0 w-12 h-12 rounded-xl bg-cyan-glow/20 blur-xl -z-10" />
          </div>
          <div>
            <h1 className="font-mono font-bold text-lg text-obsidian-100 tracking-tight">
              CAMPAIGN<span className="text-cyan-glow">_</span>
            </h1>
            <p className="text-xs text-obsidian-400 font-mono tracking-widest uppercase">
              Telegram Ops
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <p className="px-4 mb-3 text-[10px] font-mono text-obsidian-500 tracking-[0.2em] uppercase">
          Navigation
        </p>
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    group flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300
                    ${isActive
                      ? 'bg-cyan-glow/10 text-cyan-glow border border-cyan-glow/30 shadow-[0_0_20px_rgba(0,240,255,0.15)]'
                      : 'text-obsidian-400 hover:bg-obsidian-800/50 hover:text-obsidian-100 border border-transparent'
                    }
                  `}
                >
                  <div className={`
                    relative flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300
                    ${isActive
                      ? 'bg-cyan-glow/20'
                      : 'bg-obsidian-800 group-hover:bg-obsidian-700'
                    }
                  `}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                    </svg>
                    {isActive && (
                      <div className="absolute inset-0 rounded-lg bg-cyan-glow/10 blur-md" />
                    )}
                  </div>
                  <span className="font-medium text-sm">{item.label}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-glow shadow-[0_0_8px_rgba(0,240,255,0.8)]" />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-obsidian-700/50">
        {/* Quick Stats Mini */}
        <div className="mb-4 px-4 py-3 rounded-lg bg-obsidian-800/50 border border-obsidian-700/50">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-obsidian-500 tracking-wider uppercase">System</span>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-success-glow shadow-[0_0_6px_rgba(0,255,136,0.8)] status-pulse" />
              <span className="text-[10px] font-mono text-success-glow">Online</span>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="
            w-full flex items-center gap-3 px-4 py-3 rounded-lg
            text-obsidian-400 hover:text-danger-glow
            bg-transparent hover:bg-danger-glow/10
            border border-transparent hover:border-danger-glow/30
            transition-all duration-300
            disabled:opacity-50 disabled:cursor-not-allowed
            group
          "
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-obsidian-800 group-hover:bg-danger-glow/20 transition-all duration-300">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </div>
          <span className="font-medium text-sm">
            {loggingOut ? 'Logging out...' : 'Logout'}
          </span>
        </button>
      </div>
    </aside>
  )
}
