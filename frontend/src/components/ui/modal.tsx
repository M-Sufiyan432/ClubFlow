import React, { ReactNode } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  closeOnBackdropClick?: boolean
  closeButton?: boolean
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  className = '',
  closeOnBackdropClick = true,
  closeButton = true,
}) => {
  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 transition-opacity duration-200"
      role="presentation"
    >
      <div
        onClick={handleBackdropClick}
        className="flex w-full items-center justify-center"
      >
        <div
          className={`w-full ${sizeClasses[size]} max-h-[calc(100vh-2rem)] overflow-y-auto rounded-lg border border-border bg-card shadow-lg animate-scaleIn ${className}`}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label={title || 'Dialog'}
        >
          {/* Header */}
          {(title || closeButton) && (
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              {title && <h2 className="text-base font-semibold leading-6">{title}</h2>}
              {!title && <div />}
              {closeButton && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-8 w-8"
                  aria-label="Close dialog"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}

          {/* Body */}
          <div className="p-5">{children}</div>

          {/* Footer */}
          {footer && <div className="flex justify-end gap-2 border-t border-border p-5">{footer}</div>}
        </div>
      </div>
    </div>
  )
}

export const useModal = (initialOpen: boolean = false) => {
  const [isOpen, setIsOpen] = React.useState(initialOpen)

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(!isOpen),
  }
}
