export const APP_NAME = 'ClubFlow'
export const APP_VERSION = '0.1.0'

export const ROLES = {
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  MEMBER: 'member',
} as const

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  THEME: 'theme',
  SIDEBAR_STATE: 'sidebarOpen',
} as const

export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  SIGNUP: '/auth/signup',
  LOGOUT: '/auth/logout',
  ME: '/auth/me',

  // Clubs
  CLUBS: '/clubs',
  CLUB_DETAIL: (id: string) => `/clubs/${id}`,

  // Events
  EVENTS: '/events',
  EVENT_DETAIL: (id: string) => `/events/${id}`,

  // Members
  MEMBERS: '/members',
  MEMBER_DETAIL: (id: string) => `/members/${id}`,
} as const
