import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail } from 'lucide-react'
import { authService } from '@/services/auth.service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email address')
      return
    }

    setIsLoading(true)
    try {
      const response = await authService.forgotPassword(email)
      setMessage((response.data as any)?.message || 'Password reset email sent')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not send reset email')
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
              <Mail className="w-6 h-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-center text-2xl">Forgot password</CardTitle>
          <CardDescription className="text-center">
            Enter your email and we will send a reset link
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={isLoading}
              />
            </div>

            {error && <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">{error}</div>}
            {message && <div className="p-3 bg-emerald-500/10 text-emerald-700 text-sm rounded-md">{message}</div>}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send reset link'}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Remembered it?{' '}
              <Link to="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
