import React, { useEffect } from 'react'
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
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      textColor: 'text-yellow-900 dark:text-yellow-100',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
    },
  }

  const config = typeConfig[notification.type]
  const IconComponent = config.icon

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-2">
      <div
        className={`
          flex items-start gap-3 p-4 rounded-lg border
          ${config.bgColor} ${config.textColor} ${config.borderColor}
          shadow-lg max-w-md
        `}
      >
        <IconComponent className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.iconColor}`} />
        <p className="text-sm font-medium flex-1">{notification.message}</p>
        <button
          onClick={() => dispatch(hideNotification())}
          className="flex-shrink-0 p-1 hover:bg-black/10 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
