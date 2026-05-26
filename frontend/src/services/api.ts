import axios, { AxiosInstance, AxiosError } from 'axios'
import { API_URL } from '@/utils/config'
import { setupInterceptors } from './apiInterceptors'

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

setupInterceptors(api)

export default api

export type { AxiosError }
