import React from 'react'
import { BaseLayout } from '@/components/layout/BaseLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const Settings: React.FC = () => {
  return (
    <BaseLayout title="Settings">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account and preferences.
          </p>
        </div>

        <div className="grid gap-6 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Update your account information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline">Edit Account</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Privacy</CardTitle>
              <CardDescription>
                Control your privacy settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline">Manage Privacy</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Manage notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline">Notification Settings</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </BaseLayout>
  )
}
