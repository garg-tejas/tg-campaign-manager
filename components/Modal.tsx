'use client'

import { useEffect } from 'react'
import Button from './Button'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export default function Modal({ isOpen, onClose, title, children, footer }: ModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-obsidian-950/80 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md mx-4 max-h-[90vh] overflow-hidden animate-fade-in">
        {/* Glow Effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-glow/10 via-transparent to-amber-glow/10 rounded-2xl blur-xl opacity-50" />

        <div className="relative bg-obsidian-900/95 backdrop-blur-xl rounded-2xl border border-obsidian-700/50 shadow-[0_0_60px_rgba(0,0,0,0.5)]">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-obsidian-700/50">
            <h2 className="text-lg font-mono font-semibold text-obsidian-100">{title}</h2>
            <button
              onClick={onClose}
              className="
                p-2 rounded-lg
                text-obsidian-400 hover:text-danger-glow
                bg-transparent hover:bg-danger-glow/10
                border border-transparent hover:border-danger-glow/30
                transition-all duration-300
              "
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-5 overflow-y-auto max-h-[60vh]">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="flex items-center justify-end gap-3 p-5 border-t border-obsidian-700/50 bg-obsidian-800/30">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  loading?: boolean
  variant?: 'danger' | 'primary'
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  loading = false,
  variant = 'danger',
}: ConfirmModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant={variant} onClick={onConfirm} loading={loading}>
            {confirmText}
          </Button>
        </>
      }
    >
      <p className="text-obsidian-300 font-mono text-sm leading-relaxed">{message}</p>
    </Modal>
  )
}
