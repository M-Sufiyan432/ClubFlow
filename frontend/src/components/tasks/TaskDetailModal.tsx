import React, { useState } from 'react'
import { Task, TaskStatus, TaskPriority } from '@/types/index'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  X,
  Send,
  Edit2,
  Trash2,
  AlertCircle,
  Repeat2,
  CheckSquare,
  Circle,
  UploadCloud,
  Image as ImageIcon,
  FileText,
  CheckCircle2,
  Plus,
  Pencil,
  Save,
} from 'lucide-react'

interface TaskDetailModalProps {
  task: Task
  onClose: () => void
  onStatusChange: (status: TaskStatus) => void
  onPriorityChange: (priority: TaskPriority) => void
  onAddComment: (content: string) => void
  onUploadAttachment: (file: File) => Promise<void>
  onAddSubtask: (title: string) => Promise<void>
  onToggleSubtask: (subtaskId: string) => Promise<void>
  onUpdateSubtask: (subtaskId: string, title: string) => Promise<void>
  onDeleteSubtask: (subtaskId: string) => Promise<void>
  onUpdate: (updates: any) => void
  onDelete: () => void
  canEditDetails?: boolean
  canDeleteTask?: boolean
  isLoading?: boolean
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  onClose,
  onStatusChange,
  onPriorityChange,
  onAddComment,
  onUploadAttachment,
  onAddSubtask,
  onToggleSubtask,
  onUpdateSubtask,
  onDeleteSubtask,
  onUpdate,
  onDelete,
  canEditDetails = false,
  canDeleteTask = false,
  isLoading = false,
}) => {
  const [commentText, setCommentText] = useState('')
  const [proofNote, setProofNote] = useState('')
  const [statusDraft, setStatusDraft] = useState<TaskStatus>(task.status)
  const [isUploadingProof, setIsUploadingProof] = useState(false)
  const [subtaskTitle, setSubtaskTitle] = useState('')
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null)
  const [editingSubtaskTitle, setEditingSubtaskTitle] = useState('')
  const [subtaskActionId, setSubtaskActionId] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  void onUpdate

  React.useEffect(() => {
    setStatusDraft(task.status)
  }, [task.status])

  const handleAddComment = () => {
    if (commentText.trim()) {
      onAddComment(commentText)
      setCommentText('')
    }
  }

  const handleApplyStatus = () => {
    if (proofNote.trim()) {
      onAddComment(`Proof note: ${proofNote.trim()}`)
      setProofNote('')
    }
    onStatusChange(statusDraft)
  }

  const handleProofUpload = async (file?: File) => {
    if (!file) return
    setIsUploadingProof(true)
    try {
      await onUploadAttachment(file)
    } finally {
      setIsUploadingProof(false)
    }
  }

  const handleAddSubtask = async () => {
    const cleanTitle = subtaskTitle.trim()
    if (!cleanTitle) return

    setSubtaskActionId('new')
    try {
      await onAddSubtask(cleanTitle)
      setSubtaskTitle('')
    } finally {
      setSubtaskActionId(null)
    }
  }

  const handleToggleSubtask = async (subtaskId: string) => {
    setSubtaskActionId(subtaskId)
    try {
      await onToggleSubtask(subtaskId)
    } finally {
      setSubtaskActionId(null)
    }
  }

  const startEditingSubtask = (subtaskId: string, title: string) => {
    setEditingSubtaskId(subtaskId)
    setEditingSubtaskTitle(title)
  }

  const handleSaveSubtask = async () => {
    const cleanTitle = editingSubtaskTitle.trim()
    if (!editingSubtaskId || !cleanTitle) return

    setSubtaskActionId(editingSubtaskId)
    try {
      await onUpdateSubtask(editingSubtaskId, cleanTitle)
      setEditingSubtaskId(null)
      setEditingSubtaskTitle('')
    } finally {
      setSubtaskActionId(null)
    }
  }

  const handleDeleteSubtask = async (subtaskId: string) => {
    setSubtaskActionId(subtaskId)
    try {
      await onDeleteSubtask(subtaskId)
    } finally {
      setSubtaskActionId(null)
    }
  }

  const statusOptions = [
    { value: TaskStatus.TODO, label: 'To Do', helper: 'Queued' },
    { value: TaskStatus.IN_PROGRESS, label: 'In Progress', helper: 'Work started' },
    { value: TaskStatus.IN_REVIEW, label: 'In Review', helper: 'Needs check' },
    { value: TaskStatus.DONE, label: 'Done', helper: 'Completed' },
  ]

  const formatBytes = (bytes: number) => {
    if (!bytes) return 'Unknown size'
    const units = ['B', 'KB', 'MB', 'GB']
    const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
    return `${(bytes / Math.pow(1024, unitIndex)).toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
  }

  const completedSubtasks = task.subtasks.filter(subtask => subtask.completed).length
  const hasSubtasks = task.subtasks.length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-3 sm:p-4" role="presentation">
      <Card className="max-h-[92vh] w-full max-w-3xl overflow-y-auto shadow-lg" role="dialog" aria-modal="true" aria-label={task.title}>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-2xl break-words">{task.title}</CardTitle>
            {task.isOverdue && (
              <div className="flex items-center gap-2 mt-2 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                This task is overdue
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            disabled={isLoading}
            className="flex-shrink-0"
            aria-label="Close task details"
          >
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Description */}
          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-muted-foreground whitespace-pre-wrap">{task.description}</p>
          </div>

          <div className="rounded-lg border border-border bg-secondary/35 p-4">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="font-semibold">Status and Proof</h3>
                <p className="text-sm text-muted-foreground">
                  Update progress and attach proof of work in the same flow.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {task.progress}% complete
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
              {statusOptions.map(option => {
                const isSelected = statusDraft === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setStatusDraft(option.value)}
                    disabled={isLoading}
                    className={`rounded-md border p-3 text-left transition-colors ${
                      isSelected
                        ? 'border-primary/35 bg-primary/10 text-primary shadow-xs'
                        : 'border-border bg-card hover:bg-secondary/70'
                    }`}
                  >
                    <span className="block text-sm font-semibold">{option.label}</span>
                    <span className="text-xs text-muted-foreground">{option.helper}</span>
                  </button>
                )
              })}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
              <textarea
                value={proofNote}
                onChange={event => setProofNote(event.target.value)}
                placeholder="Add a short proof note before changing status..."
                disabled={isLoading}
                rows={3}
                className="min-h-24 resize-none rounded-md border border-input bg-card px-3 py-2 text-sm shadow-xs outline-none transition-colors focus:border-primary focus:shadow-[var(--focus-ring)]"
              />
              <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border bg-card px-4 py-3 text-center text-sm transition-colors hover:border-primary/40 hover:bg-accent/35">
                <UploadCloud className="h-6 w-6 text-muted-foreground" />
                <span className="font-medium">{isUploadingProof ? 'Uploading...' : 'Attach proof'}</span>
                <span className="text-xs text-muted-foreground">Photo, PDF, or document</span>
                <input
                  type="file"
                  className="sr-only"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                  disabled={isLoading || isUploadingProof}
                  onChange={event => {
                    void handleProofUpload(event.target.files?.[0])
                    event.target.value = ''
                  }}
                />
              </label>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <label className="text-sm font-medium">Priority</label>
                <select
                  value={task.priority}
                  onChange={e => onPriorityChange(e.target.value as TaskPriority)}
                  disabled={isLoading || !canEditDetails}
                  className="ml-0 mt-1 h-9 w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-xs outline-none transition-colors focus:border-primary focus:shadow-[var(--focus-ring)] sm:ml-2 sm:mt-0 sm:w-auto"
                >
                  <option value={TaskPriority.LOW}>Low</option>
                  <option value={TaskPriority.MEDIUM}>Medium</option>
                  <option value={TaskPriority.HIGH}>High</option>
                  <option value={TaskPriority.URGENT}>Urgent</option>
                </select>
              </div>
              <Button
                onClick={handleApplyStatus}
                disabled={isLoading || isUploadingProof || statusDraft === task.status}
                className="w-full sm:w-auto"
              >
                Save Status
              </Button>
            </div>
          </div>

          {/* Due Date */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {task.dueDate && (
              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="font-semibold text-sm mb-1">Due Date</h3>
                <p className="text-sm text-muted-foreground">
                  {new Date(task.dueDate).toLocaleDateString()}
                </p>
              </div>
            )}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="font-semibold text-sm mb-1">Estimated Hours</h3>
              <p className="text-sm text-muted-foreground">{task.estimatedHours ?? 'Not set'}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="font-semibold text-sm mb-1">Progress</h3>
              <p className="text-sm text-muted-foreground">{task.progress}% complete</p>
            </div>
          </div>

          {task.isRecurring && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-border/60 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Repeat2 className="h-4 w-4" />
                  <h3 className="font-semibold text-sm">Recurrence</h3>
                </div>
                <p className="text-sm text-muted-foreground capitalize">
                  Every {task.recurringInterval || 1} {task.recurringPattern}
                </p>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-border/70 bg-background/80 p-4">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-4 w-4" />
                  <h3 className="font-semibold">Subtasks</h3>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Break the task into small, reviewable steps.
                </p>
              </div>
              <div className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">
                {completedSubtasks}/{task.subtasks.length} done
              </div>
            </div>

            <div className="mb-4 h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${hasSubtasks ? task.progress : 0}%` }}
              />
            </div>

            <div className="mb-4 flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={subtaskTitle}
                onChange={event => setSubtaskTitle(event.target.value)}
                onKeyDown={event => {
                  if (event.key === 'Enter') {
                    void handleAddSubtask()
                  }
                }}
                placeholder="Add a subtask..."
                disabled={isLoading || subtaskActionId === 'new'}
                className="min-w-0 flex-1 rounded-md border border-input bg-card px-3 py-2 text-sm shadow-xs outline-none transition-colors focus:border-primary focus:shadow-[var(--focus-ring)]"
              />
              <Button
                onClick={() => void handleAddSubtask()}
                disabled={isLoading || !subtaskTitle.trim() || subtaskActionId === 'new'}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>

            {task.subtasks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 bg-secondary/30 px-4 py-5 text-sm text-muted-foreground">
                No subtasks yet. Add the first small step to make progress easier to track.
              </div>
            ) : (
              <div className="space-y-2">
                {task.subtasks.map((subtask) => {
                  const isEditingSubtask = editingSubtaskId === subtask.id
                  const isBusy = isLoading || subtaskActionId === subtask.id

                  return (
                    <div
                      key={subtask.id}
                      className={`rounded-xl border px-3 py-3 transition ${
                        subtask.completed
                          ? 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-500/20 dark:bg-emerald-950/20'
                          : 'border-border bg-background'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => void handleToggleSubtask(subtask.id)}
                          disabled={isBusy}
                          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition hover:border-primary hover:text-primary"
                          title={subtask.completed ? 'Mark open' : 'Mark done'}
                        >
                          {subtask.completed ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Circle className="h-4 w-4" />}
                        </button>

                        <div className="min-w-0 flex-1">
                          {isEditingSubtask ? (
                            <input
                              type="text"
                              value={editingSubtaskTitle}
                              onChange={event => setEditingSubtaskTitle(event.target.value)}
                              onKeyDown={event => {
                                if (event.key === 'Enter') {
                                  void handleSaveSubtask()
                                }
                              }}
                              disabled={isBusy}
                              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                            />
                          ) : (
                            <p className={`break-words text-sm font-medium ${subtask.completed ? 'text-muted-foreground line-through' : ''}`}>
                              {subtask.title}
                            </p>
                          )}
                          <p className="mt-1 text-xs text-muted-foreground">
                            {subtask.completed ? `Completed${subtask.completedAt ? ` on ${new Date(subtask.completedAt).toLocaleDateString()}` : ''}` : 'Open'}
                          </p>
                        </div>

                        <div className="flex flex-shrink-0 items-center gap-1">
                          {isEditingSubtask ? (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => void handleSaveSubtask()}
                                disabled={isBusy || !editingSubtaskTitle.trim()}
                                title="Save subtask"
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  setEditingSubtaskId(null)
                                  setEditingSubtaskTitle('')
                                }}
                                disabled={isBusy}
                                title="Cancel edit"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => startEditingSubtask(subtask.id, subtask.title)}
                                disabled={isBusy}
                                title="Rename subtask"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-destructive hover:text-destructive"
                                onClick={() => void handleDeleteSubtask(subtask.id)}
                                disabled={isBusy}
                                title="Delete subtask"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Assignees */}
          {task.assignees && task.assignees.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm mb-2">Assignees</h3>
              <div className="flex flex-wrap gap-2">
                {task.assignees.map(assignee => (
                  <div
                    key={assignee.id}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-secondary rounded-full"
                  >
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                      {assignee.name.charAt(0)}
                    </span>
                    <span className="text-sm">{assignee.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {task.tags.map(tag => (
                  <span key={tag} className="inline-block px-3 py-1 bg-secondary text-secondary-foreground text-xs rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="font-semibold text-sm mb-2">Proof Attachments ({task.attachments.length})</h3>
            {task.attachments.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {task.attachments.map((attachment) => {
                  const isImage = attachment.fileType?.startsWith('image/')
                  return (
                    <a
                      key={attachment.id}
                      href={attachment.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="group overflow-hidden rounded-xl border border-border/60 bg-background text-sm transition hover:border-primary/60 hover:shadow-sm"
                    >
                      {isImage ? (
                        <img
                          src={attachment.fileUrl}
                          alt={attachment.fileName}
                          className="h-28 w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-28 items-center justify-center bg-secondary/60">
                          <FileText className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex items-start gap-3 p-3">
                        {isImage ? <ImageIcon className="mt-0.5 h-4 w-4" /> : <FileText className="mt-0.5 h-4 w-4" />}
                        <div className="min-w-0">
                          <p className="truncate font-medium group-hover:text-primary">{attachment.fileName}</p>
                          <p className="text-xs text-muted-foreground">
                            {attachment.fileType || 'File'} - {formatBytes(attachment.fileSize)}
                          </p>
                        </div>
                      </div>
                    </a>
                  )
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border/70 bg-secondary/30 px-4 py-5 text-sm text-muted-foreground">
                No proof attached yet.
              </div>
            )}
          </div>

          {task.dependencies.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm mb-2">Dependencies</h3>
              <div className="space-y-2">
                {task.dependencies.map((dependency) => (
                  <div key={dependency.id} className="rounded-xl border border-border/60 px-3 py-2 text-sm text-muted-foreground">
                    Blocked by task {dependency.dependsOnTaskId}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Comments ({task.comments.length})</h3>
            <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
              {task.comments.map(comment => (
                <div key={comment.id} className="bg-secondary/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium">{comment.author.name}</p>
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{comment.content}</p>
                </div>
              ))}
            </div>

            {/* Add Comment */}
            <div className="flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleAddComment()}
                placeholder="Add a comment..."
                disabled={isLoading}
                className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-sm"
              />
              <Button
                onClick={handleAddComment}
                disabled={isLoading || !commentText.trim()}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {task.editHistory.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm mb-3">History</h3>
              <div className="space-y-2">
                {task.editHistory.slice(0, 8).map((entry) => (
                  <div key={entry.id} className="rounded-xl border border-border/60 px-3 py-2 text-sm">
                    <p className="font-medium">{entry.field}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.changedBy.name || 'System'} - {entry.changedAt ? new Date(entry.changedAt).toLocaleString() : ''}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row">
            {canEditDetails && (
              <Button variant="outline" size="sm" disabled={isLoading} onClick={() => setIsEditing(!isEditing)}>
                <Edit2 className="h-4 w-4 mr-1" />
                Edit
              </Button>
            )}
            {canDeleteTask && (
              <Button
                variant="destructive"
                size="sm"
                disabled={isLoading}
                onClick={() => {
                  if (confirm('Delete this task?')) {
                    onDelete()
                  }
                }}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
