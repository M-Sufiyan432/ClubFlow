export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  roles: string[]
  role?: string
  clubId?: string
  clubs?: Array<{
    club: string | { id?: string; _id?: string; name?: string; logo?: string }
    role: string
    joinedAt?: string
  }>
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
  expiresIn?: number
}

export interface SignUpRequest {
  email: string
  password: string
  name: string
  clubName?: string
}

export interface SignUpResponse {
  token: string
  user: User
  expiresIn?: number
}

export interface CurrentUserResponse {
  user: User
}

export interface UpdateProfileRequest {
  name?: string
  profilePhoto?: string
}
