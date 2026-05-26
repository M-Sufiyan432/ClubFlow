import React from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CreateTaskButtonProps {
  canCreate: boolean
  onClick: () => void
  className?: string
}

export const CreateTaskButton: React.FC<CreateTaskButtonProps> = ({ canCreate, onClick, className }) => {
  if (!canCreate) return null

  return (
    <Button onClick={onClick} className={className}>
      <Plus className="mr-2 h-4 w-4" />
      New Task
    </Button>
  )
}

