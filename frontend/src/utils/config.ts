const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '')

export const API_URL = trimTrailingSlash(import.meta.env.VITE_API_URL || '/api')
export const SOCKET_URL = trimTrailingSlash(
  import.meta.env.VITE_SOCKET_URL || window.location.origin
)

export const validateEnvVars = () => {
  const requiredVars = []

  if (!import.meta.env.VITE_API_URL) {
    requiredVars.push('VITE_API_URL')
  }

  if (requiredVars.length > 0) {
    console.warn(
      `Missing environment variables: ${requiredVars.join(', ')}. Using defaults.`
    )
  }
}

validateEnvVars()
