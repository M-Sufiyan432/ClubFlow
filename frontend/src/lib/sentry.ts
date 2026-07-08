import * as Sentry from '@sentry/react'
import type { User } from '@/store/slices/authSlice'

export const initSentry = () => {
  if (!import.meta.env.VITE_SENTRY_DSN) return

  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_SENTRY_RELEASE,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
    replaysSessionSampleRate: Number(import.meta.env.VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE ?? 0),
    replaysOnErrorSampleRate: Number(import.meta.env.VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE ?? 1),
  })
}

export const setSentryUser = (user: User | null) => {
  Sentry.setUser(
    user
      ? {
          id: user.id,
          email: user.email,
          username: user.name,
        }
      : null
  )
}

export const setSentryClub = (clubId?: string | null) => {
  Sentry.setTag('clubId', clubId || undefined)
}

export const captureFrontendException = (
  error: unknown,
  context?: Record<string, unknown>
) => {
  Sentry.withScope((scope) => {
    if (context) scope.setContext('clubflow', context)
    Sentry.captureException(error)
  })
}
