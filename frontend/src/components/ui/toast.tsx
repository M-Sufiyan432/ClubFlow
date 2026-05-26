import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { hideNotification } from '@/store/slices/uiSlice'
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react'

const TOAST_DURATION = 3000

export const Toast = () => {
  const dispatch = useAppDispatch()
  const notification = useAppSelector((state) => state.ui.notification)

  useEffect(() => {
    if (notification?.open) {
      const timer = setTimeout(() => {
        dispatch(hideNotification())
      }, TOAST_DURATION)

      return () => clearTimeout(timer)
    }
    return undefined
  }, [notification?.open, dispatch])

  if (!notification?.open) {
    return null
  }

  const typeConfig = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      textColor: 'text-green-900 dark:text-green-100',
      borderColor: 'border-green-200 dark:border-green-800',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    error: {
      icon: AlertCircle,
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      textColor: 'text-red-900 dark:text-red-100',
      borderColor: 'border-red-200 dark:border-red-800',
      iconColor: 'text-red-600 dark:text-red-400',
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-900 dark:text-blue-100',
      borderColor: 'border-blue-200 dark:border-blue-800',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      textColor: 'text-amber-900 dark:text-amber-100',
      borderColor: 'border-amber-200 dark:border-amber-800',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
  }

  const config = typeConfig[notification.type]
  const IconComponent = config.icon

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-[calc(100vw-2rem)] animate-slideInUp">
      <div
        className={`
          flex max-w-md items-start gap-3 rounded-lg border p-4
          ${config.bgColor} ${config.textColor} ${config.borderColor}
          shadow-lg
        `}
        role="status"
      >
        <IconComponent className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.iconColor}`} />
        <p className="text-sm font-medium flex-1">{notification.message}</p>
        <button
          onClick={() => dispatch(hideNotification())}
          className="flex-shrink-0 rounded p-1 transition-colors hover:bg-black/10"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
