import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BaseLayout } from '@/components/layout/BaseLayout'
import { TaskForm } from '@/components/tasks/TaskForm'
import { TaskBoard } from '@/components/tasks/TaskBoard'
import { TaskListView } from '@/components/tasks/TaskListView'
import { TaskCalendarView } from '@/components/tasks/TaskCalendarView'
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal'
import { CreateTaskButton } from '@/components/tasks/CreateTaskButton'
import { Button } from '@/components/ui/button'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  fetchTasks,
  fetchPersonalTasks,
  fetchTaskDetail,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  addComment,
  uploadTaskAttachment,
  addTaskSubtask,
  toggleTaskSubtask,
  updateTaskSubtask,
  deleteTaskSubtask,
} from '@/store/slices/taskSlice'
import { fetchClubDetail } from '@/store/slices/clubSlice'
import { Task, TaskStatus, TaskPriority, CreateTaskRequest } from '@/types/index'
import { LayoutGrid, List, Calendar } from 'lucide-react'
import { getClubRoleForClub, isSystemAdmin } from '@/utils/rbac'

type ViewType = 'kanban' | 'list' | 'calendar'

export const Tasks: React.FC = () => {
  const dispatch = useAppDispatch()
  const { clubId } = useParams<{ clubId?: string }>()
  const { tasks, currentTask, isLoading, isFetching, error } = useAppSelector(state => state.tasks)
  const { activeClub, currentClub, clubs } = useAppSelector(state => state.clubs)
  const user = useAppSelector(state => state.auth.user)
  const activeClubId = activeClub?.id
  const isClubTaskView = Boolean(clubId)
  const taskClubId = clubId || activeClubId
  const selectedClub =
    currentClub?.id === taskClubId
      ? currentClub
      : clubs.find(club => club.id === taskClubId) || (activeClubId === taskClubId ? activeClub : null)
  const clubRole = getClubRoleForClub(user, taskClubId)
  const canCreateTask =
    isClubTaskView &&
    (isSystemAdmin(user) || ['president', 'vicepresident', 'secretary'].includes(clubRole || ''))
  const canAssignTasks = isSystemAdmin(user) || ['president', 'vicepresident'].includes(clubRole || '')
  const canDeleteTasks = isSystemAdmin(user) || clubRole === 'president'
  const canManageTaskDetails = (task: Task) =>
    isSystemAdmin(user) ||
    ['president', 'vicepresident', 'secretary'].includes(clubRole || '') ||
    task.createdBy.id === user?.id
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [viewType, setViewType] = useState<ViewType>('kanban')

  useEffect(() => {
    if (clubId) {
      dispatch(fetchTasks({ clubId }))
      dispatch(fetchClubDetail(clubId))
      return
    }

    dispatch(fetchPersonalTasks(undefined))
  }, [dispatch, clubId])

  const handleCreateTask = async (data: CreateTaskRequest) => {
    if (taskClubId && canCreateTask) {
      try {
        await dispatch(createTask({ clubId: taskClubId, data })).unwrap()
        setShowCreateForm(false)
      } catch (err) {
        console.error('[v0] Failed to create task:', err)
      }
    }
  }

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    const targetClubId = tasks.find(task => task.id === taskId)?.clubId || currentTask?.clubId || taskClubId

    if (targetClubId) {
      try {
        await dispatch(updateTaskStatus({ clubId: targetClubId, taskId, status })).unwrap()
      } catch (err) {
        console.error('[v0] Failed to update task status:', err)
      }
    }
  }

  const handleDeleteTask = async () => {
    if (selectedTask && canDeleteTasks) {
      try {
        await dispatch(deleteTask({ clubId: selectedTask.clubId, taskId: selectedTask.id })).unwrap()
        setSelectedTask(null)
      } catch (err) {
        console.error('[v0] Failed to delete task:', err)
      }
    }
  }

  const handleAddComment = async (content: string) => {
    if (selectedTask) {
      try {
        await dispatch(
          addComment({ clubId: selectedTask.clubId, taskId: selectedTask.id, content })
        ).unwrap()
      } catch (err) {
        console.error('[v0] Failed to add comment:', err)
      }
    }
  }

  const handleSelectTask = (task: Task) => {
    setSelectedTask(task)
    if (task.clubId) {
      dispatch(fetchTaskDetail({ clubId: task.clubId, taskId: task.id }))
    }
  }

  const handleUploadAttachment = async (file: File) => {
    if (selectedTask) {
      try {
        await dispatch(
          uploadTaskAttachment({ clubId: selectedTask.clubId, taskId: selectedTask.id, file })
        ).unwrap()
      } catch (err) {
        console.error('[v0] Failed to upload task attachment:', err)
      }
    }
  }

  const handleAddSubtask = async (title: string) => {
    if (selectedTask) {
      await dispatch(
        addTaskSubtask({ clubId: selectedTask.clubId, taskId: selectedTask.id, title })
      ).unwrap()
    }
  }

  const handleToggleSubtask = async (subtaskId: string) => {
    if (selectedTask) {
      await dispatch(
        toggleTaskSubtask({ clubId: selectedTask.clubId, taskId: selectedTask.id, subtaskId })
      ).unwrap()
    }
  }

  const handleUpdateSubtask = async (subtaskId: string, title: string) => {
    if (selectedTask) {
      await dispatch(
        updateTaskSubtask({ clubId: selectedTask.clubId, taskId: selectedTask.id, subtaskId, title })
      ).unwrap()
    }
  }

  const handleDeleteSubtask = async (subtaskId: string) => {
    if (selectedTask) {
      await dispatch(
        deleteTaskSubtask({ clubId: selectedTask.clubId, taskId: selectedTask.id, subtaskId })
      ).unwrap()
    }
  }

  const handlePriorityChange = async (taskId: string, priority: TaskPriority) => {
    const targetTask = tasks.find(task => task.id === taskId) || selectedTask

    if (targetTask && canManageTaskDetails(targetTask)) {
      try {
        await dispatch(updateTask({ clubId: targetTask.clubId, taskId, data: { priority } })).unwrap()
      } catch (err) {
        console.error('[v0] Failed to update task priority:', err)
      }
    }
  }

  if (isClubTaskView && !taskClubId) {
    return (
      <BaseLayout title="Tasks">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Please select a club first</p>
        </div>
      </BaseLayout>
    )
  }

  const pageTitle = isClubTaskView ? `${selectedClub?.name || 'Club'} Tasks` : 'Personal Tasks'
  const pageDescription = isClubTaskView
    ? 'Club-scoped work board. Officers can create and assign tasks; members see assigned work.'
    : 'Your assigned tasks across all clubs.'

  return (
    <BaseLayout title={pageTitle}>
      <div className="min-w-0 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="mb-2 text-2xl font-bold sm:text-3xl">{pageTitle}</h1>
            <p className="text-muted-foreground">{pageDescription}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            {!isClubTaskView && activeClubId && (
              <Button asChild variant="outline" className="w-full sm:w-auto">
                <Link to={`/clubs/${activeClubId}/tasks`}>Open Club Tasks</Link>
              </Button>
            )}
            <CreateTaskButton
              canCreate={canCreateTask}
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="w-full sm:w-auto"
            />
          </div>
        </div>

        {error && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
            {error}
          </div>
        )}

        {showCreateForm && (
          <TaskForm
            onSubmit={handleCreateTask}
            onCancel={() => setShowCreateForm(false)}
            members={selectedClub?.members || []}
            canAssign={canAssignTasks}
            isLoading={isLoading}
          />
        )}

        {/* View Type Tabs */}
        <div className="flex flex-wrap gap-2 border-b pb-3">
          <Button
            variant={viewType === 'kanban' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewType('kanban')}
            className="flex-1 gap-2 sm:flex-none"
          >
            <LayoutGrid className="h-4 w-4" />
            Kanban
          </Button>
          <Button
            variant={viewType === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewType('list')}
            className="flex-1 gap-2 sm:flex-none"
          >
            <List className="h-4 w-4" />
            List
          </Button>
          <Button
            variant={viewType === 'calendar' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewType('calendar')}
            className="flex-1 gap-2 sm:flex-none"
          >
            <Calendar className="h-4 w-4" />
            Calendar
          </Button>
        </div>

        {/* Loading State */}
        {isFetching && tasks.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {viewType === 'kanban' && (
              <TaskBoard
                tasks={tasks}
                onTaskClick={handleSelectTask}
                onStatusChange={handleStatusChange}
                onCreateTask={() => setShowCreateForm(true)}
                canCreateTask={canCreateTask}
                isLoading={isLoading}
              />
            )}

            {viewType === 'list' && (
              <TaskListView tasks={tasks} onTaskClick={handleSelectTask} />
            )}

            {viewType === 'calendar' && (
              <TaskCalendarView
                tasks={tasks}
                onTaskClick={handleSelectTask}
                isLoading={isLoading}
              />
            )}
          </>
        )}

        {/* Task Detail Modal */}
        {selectedTask && (
          <TaskDetailModal
            task={currentTask?.id === selectedTask.id ? currentTask : selectedTask}
            onClose={() => setSelectedTask(null)}
            onStatusChange={status => handleStatusChange(selectedTask.id, status)}
            onPriorityChange={priority => handlePriorityChange(selectedTask.id, priority)}
            onAddComment={handleAddComment}
            onUploadAttachment={handleUploadAttachment}
            onAddSubtask={handleAddSubtask}
            onToggleSubtask={handleToggleSubtask}
            onUpdateSubtask={handleUpdateSubtask}
            onDeleteSubtask={handleDeleteSubtask}
            onUpdate={() => {}} // TODO: Implement update
            onDelete={handleDeleteTask}
            canEditDetails={canManageTaskDetails(selectedTask)}
            canDeleteTask={canDeleteTasks}
            isLoading={isLoading}
          />
        )}
      </div>
    </BaseLayout>
  )
}
