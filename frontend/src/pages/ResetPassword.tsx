import React, { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { KeyRound } from 'lucide-react'
import { useAppDispatch } from '@/store/hooks'
import { setToken, setUser } from '@/store/slices/authSlice'
import { authService } from '@/services/auth.service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const ResetPassword: React.FC = () => {
  const { token } = useParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')

    if (!token) {
      setError('Reset token is missing')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)
    try {
      const response = await authService.resetPassword(token, password)
      if (response.data?.token) {
        dispatch(setToken(response.data.token))
      }
      if (response.data?.user) {
        dispatch(setUser(response.data.user))
      }
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not reset password')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <KeyRound className="w-6 h-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-center text-2xl">Reset password</CardTitle>
          <CardDescription className="text-center">
            Create a new password for your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                New password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                disabled={isLoading}
              />
            </div>

            {error && <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">{error}</div>}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Resetting...' : 'Reset password'}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Back to{' '}
              <Link to="/login" className="text-primary hover:underline">
                sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
