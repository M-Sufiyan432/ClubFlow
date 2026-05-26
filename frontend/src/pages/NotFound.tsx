import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Home, ChevronRight } from 'lucide-react'

export const NotFound: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center space-y-8 max-w-md">
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
            <div className="relative text-6xl font-bold text-primary/40">404</div>
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-5xl font-bold">Page Not Found</h1>
          <h2 className="text-lg font-medium text-foreground">Oops!</h2>
        </div>

        <p className="text-base text-muted-foreground leading-relaxed">
          Sorry, we couldn't find the page you're looking for. It might have been
          moved, deleted, or the URL might be incorrect.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Go Back
          </Button>
          <Button onClick={() => navigate('/dashboard')}>
            <Home className="mr-2 h-4 w-4" />
            <span>Back to Home</span>
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        <div className="pt-8 border-t border-border">
          <p className="text-xs text-muted-foreground">
            If you continue to experience issues, please contact our support team.
          </p>
        </div>
      </div>
    </div>
  )
}
