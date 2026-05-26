import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Lock, ChevronRight } from 'lucide-react'

export const Forbidden: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/10 px-4">
      <div className="text-center space-y-8 max-w-md">
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-destructive/20 blur-xl rounded-full"></div>
            <div className="relative bg-destructive/10 p-4 rounded-full">
              <Lock className="h-12 w-12 text-destructive" />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-5xl font-bold">403</h1>
          <h2 className="text-2xl font-semibold text-foreground">Access Denied</h2>
        </div>

        <p className="text-base text-muted-foreground leading-relaxed">
          You don't have permission to access this resource. If you believe this is a mistake,
          please contact your administrator.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Go Back
          </Button>
          <Button onClick={() => navigate('/dashboard')}>
            <span>Go to Dashboard</span>
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
