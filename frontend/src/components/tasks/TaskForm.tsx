import React, { useState } from 'react'
import { TaskPriority, TaskStatus, CreateTaskRequest, ClubMember } from '@/types/index'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X } from 'lucide-react'

interface TaskFormProps {
  onSubmit: (data: CreateTaskRequest) => void
  onCancel: () => void
  members?: ClubMember[]
  canAssign?: boolean
  isLoading?: boolean
}

export const TaskForm: React.FC<TaskFormProps> = ({
  onSubmit,
  onCancel,
  members = [],
  canAssign = false,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<CreateTaskRequest>({
    title: '',
    description: '',
    priority: TaskPriority.MEDIUM,
    status: TaskStatus.TODO,
    tags: [],
    isRecurring: false,
    recurringInterval: 1,
    subtasks: [],
  })
  const [tagInput, setTagInput] = useState('')
  const [subtaskInput, setSubtaskInput] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const toggleAssignee = (userId: string) => {
    const currentAssignees = formData.assigneeIds || []
    setFormData({
      ...formData,
      assigneeIds: currentAssignees.includes(userId)
        ? currentAssignees.filter((id) => id !== userId)
        : [...currentAssignees, userId],
    })
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.title.trim()) newErrors.title = 'Title is required'
    if (!formData.description.trim()) newErrors.description = 'Description is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSubmit(formData)
    }
  }

  const addTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tagInput.trim()],
      })
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter(t => t !== tag) || [],
    })
  }

  const addSubtask = () => {
    if (!subtaskInput.trim()) return
    setFormData({
      ...formData,
      subtasks: [...(formData.subtasks || []), { title: subtaskInput.trim() }],
    })
    setSubtaskInput('')
  }

  const removeSubtask = (index: number) => {
    setFormData({
      ...formData,
      subtasks: formData.subtasks?.filter((_, currentIndex) => currentIndex !== index) || [],
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Task</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Title</label>
            <Input
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="Task title"
              disabled={isLoading}
              className="mt-1"
            />
            {errors.title && <p className="text-xs text-destructive mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Task description"
              disabled={isLoading}
              className="mt-1 min-h-24 w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-xs outline-none transition-colors focus:border-primary focus:shadow-[var(--focus-ring)]"
            />
            {errors.description && <p className="text-xs text-destructive mt-1">{errors.description}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Priority</label>
              <select
                value={formData.priority}
                onChange={e => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                disabled={isLoading}
                className="mt-1 h-9 w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-xs outline-none transition-colors focus:border-primary focus:shadow-[var(--focus-ring)]"
              >
                <option value={TaskPriority.LOW}>Low</option>
                <option value={TaskPriority.MEDIUM}>Medium</option>
                <option value={TaskPriority.HIGH}>High</option>
                <option value={TaskPriority.URGENT}>Urgent</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Status</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                disabled={isLoading}
                className="mt-1 h-9 w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-xs outline-none transition-colors focus:border-primary focus:shadow-[var(--focus-ring)]"
              >
                <option value={TaskStatus.TODO}>To Do</option>
                <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
                <option value={TaskStatus.IN_REVIEW}>In Review</option>
                <option value={TaskStatus.DONE}>Done</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Due Date</label>
              <Input
                type="date"
                value={formData.dueDate || ''}
                onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                disabled={isLoading}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Estimated Hours</label>
              <Input
                type="number"
                min="0"
                step="0.5"
                value={formData.estimatedHours ?? ''}
                onChange={e => setFormData({ ...formData, estimatedHours: e.target.value ? Number(e.target.value) : undefined })}
                disabled={isLoading}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Tags</label>
            <div className="flex gap-2 mt-1">
              <Input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Add tag and press Enter"
                disabled={isLoading}
              />
              <Button type="button" onClick={addTag} variant="outline" disabled={isLoading}>
                Add
              </Button>
            </div>
            {formData.tags && formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {canAssign && members.length > 0 && (
            <div>
              <label className="text-sm font-medium">Assign Members</label>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {members.map((member) => (
                  <label
                    key={member.userId || member.id}
                    className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={(formData.assigneeIds || []).includes(member.userId || member.id)}
                      onChange={() => toggleAssignee(member.userId || member.id)}
                      disabled={isLoading}
                    />
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{member.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">{member.email}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3 rounded-lg border border-border bg-secondary/35 p-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Recurring Task</label>
              <input
                type="checkbox"
                checked={Boolean(formData.isRecurring)}
                onChange={e => setFormData({ ...formData, isRecurring: e.target.checked, recurringPattern: e.target.checked ? formData.recurringPattern || 'weekly' : undefined })}
                disabled={isLoading}
              />
            </div>

            {formData.isRecurring && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Frequency</label>
                  <select
                    value={formData.recurringPattern || 'weekly'}
                    onChange={e => setFormData({ ...formData, recurringPattern: e.target.value })}
                    disabled={isLoading}
                    className="mt-1 h-9 w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-xs outline-none transition-colors focus:border-primary focus:shadow-[var(--focus-ring)]"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Interval</label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.recurringInterval ?? 1}
                    onChange={e => setFormData({ ...formData, recurringInterval: Number(e.target.value) || 1 })}
                    disabled={isLoading}
                    className="mt-1"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">Subtasks</label>
            <div className="mt-1 flex gap-2">
              <Input
                value={subtaskInput}
                onChange={e => setSubtaskInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSubtask())}
                placeholder="Add subtask title"
                disabled={isLoading}
              />
              <Button type="button" variant="outline" onClick={addSubtask} disabled={isLoading}>
                Add
              </Button>
            </div>
            {formData.subtasks && formData.subtasks.length > 0 && (
              <div className="mt-3 space-y-2">
                {formData.subtasks.map((subtask, index) => (
                  <div key={`${subtask.title}-${index}`} className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-sm">
                    <span>{subtask.title}</span>
                    <button type="button" onClick={() => removeSubtask(index)} className="text-muted-foreground hover:text-destructive">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Task'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
