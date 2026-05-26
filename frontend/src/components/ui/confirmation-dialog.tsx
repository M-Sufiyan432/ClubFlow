import React, { ReactNode } from 'react'
import { AlertCircle, AlertTriangle } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'

interface ConfirmationDialogProps {
  isOpen: boolean
  onConfirm: () => void | Promise<void>
  onCancel: () => void
  title: string
  message: string | ReactNode
  confirmText?: string
  cancelText?: string
  isDestructive?: boolean
  isLoading?: boolean
  icon?: 'alert' | 'warning' | 'custom'
  customIcon?: ReactNode
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  isLoading = false,
  icon = 'alert',
  customIcon,
}) => {
  const getIcon = () => {
    if (customIcon) return customIcon
    if (icon === 'warning') {
      return <AlertTriangle className="h-5 w-5 text-amber-600" />
    }
    return <AlertCircle className="h-5 w-5 text-blue-600" />
  }

  const iconBgColor = isDestructive
    ? 'bg-destructive/10'
    : icon === 'warning'
      ? 'bg-amber-50'
      : 'bg-blue-50'

  const iconColor = isDestructive ? 'text-destructive' : ''

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      size="sm"
      closeOnBackdropClick={!isLoading}
      closeButton={!isLoading}
    >
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className={`flex-shrink-0 ${iconBgColor} p-3 rounded-lg`}>
            <div className={iconColor}>{getIcon()}</div>
          </div>
          <div className="flex-1">
            {typeof message === 'string' ? (
              <p className="text-sm text-muted-foreground">{message}</p>
            ) : (
              <div className="text-sm text-muted-foreground">{message}</div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            variant={isDestructive ? 'destructive' : 'default'}
            disabled={isLoading}
            className={isLoading ? 'opacity-70 cursor-not-allowed' : ''}
          >
            {isLoading ? (
              <>
                <span className="inline-block animate-spin mr-2">⟳</span>
                {confirmText}
              </>
            ) : (
              confirmText
            )}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export const useConfirmationDialog = () => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [config, setConfig] = React.useState<Partial<ConfirmationDialogProps>>({})
  const [isLoading, setIsLoading] = React.useState(false)

  const confirm = async (options: Omit<ConfirmationDialogProps, 'isOpen' | 'onConfirm' | 'onCancel' | 'isLoading'> & { onConfirm: () => void | Promise<void> }) => {
    return new Promise<boolean>((resolve) => {
      setConfig({
        ...options,
        onConfirm: async () => {
          setIsLoading(true)
          try {
            await options.onConfirm()
            resolve(true)
            setIsOpen(false)
          } catch (error) {
            console.error('[v0] Confirmation dialog error:', error)
            resolve(false)
          } finally {
            setIsLoading(false)
          }
        },
        onCancel: () => {
          resolve(false)
          setIsOpen(false)
        },
      })
      setIsOpen(true)
    })
  }

  return {
    isOpen,
    confirm,
    config: {
      isOpen,
      ...config,
      isLoading,
    } as ConfirmationDialogProps,
  }
}
