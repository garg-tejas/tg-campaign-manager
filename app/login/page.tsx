'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      const data = await res.json()

      if (data.success) {
        router.push('/')
        router.refresh()
      } else {
        setError(data.error || 'Invalid password')
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-obsidian-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(0,240,255,0.15),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_100%_100%,rgba(255,184,0,0.08),transparent)]" />

      {/* Animated Grid */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 240, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 240, 255, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Floating Orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-cyan-glow/5 blur-[100px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-amber-glow/5 blur-[80px] animate-pulse" style={{ animationDelay: '1s' }} />

      {/* Login Card */}
      <div className="relative w-full max-w-md mx-4 animate-fade-in">
        {/* Card Glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-glow/20 via-transparent to-amber-glow/20 rounded-2xl blur-xl opacity-50" />

        <div className="relative bg-obsidian-900/80 backdrop-blur-xl rounded-2xl border border-obsidian-700/50 shadow-[0_0_60px_rgba(0,0,0,0.5)]">
          {/* Header */}
          <div className="p-8 pb-0">
            <div className="flex flex-col items-center text-center">
              {/* Logo */}
              <div className="relative mb-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-glow to-cyan-dim flex items-center justify-center shadow-[0_0_40px_rgba(0,240,255,0.4)]">
                  <svg className="w-10 h-10 text-obsidian-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </div>
                <div className="absolute inset-0 w-20 h-20 rounded-2xl bg-cyan-glow/30 blur-2xl -z-10" />
              </div>

              {/* Title */}
              <h1 className="text-2xl font-mono font-bold text-obsidian-100 tracking-tight mb-2">
                CAMPAIGN<span className="text-cyan-glow">_</span>TERMINAL
              </h1>
              <p className="text-obsidian-400 font-mono text-sm">
                Enter credentials to access the system
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="px-8 py-6">
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-obsidian-600 to-transparent" />
              <span className="text-[10px] font-mono text-obsidian-500 tracking-widest uppercase">Authentication</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-obsidian-600 to-transparent" />
            </div>
          </div>

          {/* Form */}
          <div className="px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="password" className="block text-xs font-mono text-obsidian-400 tracking-wider uppercase mb-3">
                  Access Key
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="
                      w-full px-4 py-4
                      bg-obsidian-800/50
                      border border-obsidian-600
                      rounded-xl
                      text-obsidian-100 font-mono
                      placeholder-obsidian-500
                      focus:outline-none focus:border-cyan-glow/50 focus:bg-obsidian-800
                      focus:shadow-[0_0_20px_rgba(0,240,255,0.1)]
                      transition-all duration-300
                    "
                    placeholder="Enter password..."
                    required
                    autoFocus
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <svg className="w-5 h-5 text-obsidian-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-danger-glow/5 border border-danger-glow/20 rounded-xl animate-fade-in">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-danger-glow shadow-[0_0_8px_rgba(255,51,102,0.8)]" />
                    <p className="text-sm font-mono text-danger-glow">{error}</p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="
                  relative w-full py-4 px-6
                  bg-gradient-to-r from-cyan-glow to-cyan-dim
                  hover:from-cyan-glow hover:to-cyan-glow/80
                  text-obsidian-950 font-mono font-semibold
                  rounded-xl
                  shadow-[0_0_30px_rgba(0,240,255,0.3),0_4px_12px_rgba(0,0,0,0.4)]
                  hover:shadow-[0_0_40px_rgba(0,240,255,0.5),0_6px_20px_rgba(0,0,0,0.4)]
                  border border-cyan-glow/50
                  transition-all duration-300
                  transform hover:scale-[1.02] active:scale-[0.98]
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:scale-100
                  focus-ring
                  overflow-hidden
                  group
                "
              >
                {/* Button Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

                <span className="relative flex items-center justify-center gap-3">
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                        <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Authenticating...
                    </>
                  ) : (
                    <>
                      Initialize Session
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </span>
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="px-8 py-4 border-t border-obsidian-700/50 bg-obsidian-800/30 rounded-b-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-success-glow shadow-[0_0_6px_rgba(0,255,136,0.8)] status-pulse" />
                <span className="text-[10px] font-mono text-obsidian-500 tracking-wider uppercase">System Ready</span>
              </div>
              <span className="text-[10px] font-mono text-obsidian-600">v1.0.0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
