import api from './api'
import {
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  AddTaskCommentRequest,
  TaskComment,
  TaskFilter,
} from '@/types/index'
import { mapTask, mapTaskComment, wrapData, unwrapApiData } from './adapters'

const normalizeDueDate = (dueDate?: string) => {
  if (!dueDate) return undefined
  if (/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    return `${dueDate}T23:59:59.999Z`
  }
  return dueDate
}

export const tasksService = {
  // Task CRUD
  listPersonalTasks: async (filters?: TaskFilter) => {
    const response = await api.get('/tasks', {
      params: { ...filters, assignedTo: 'me' },
    })
    const tasks = (unwrapApiData<any[]>(response) || []).map(mapTask)
    return wrapData({ tasks, total: tasks.length })
  },

  listTasks: async (clubId: string, filters?: TaskFilter) => {
    const response = await api.get(`/clubs/${clubId}/tasks`, {
      params: filters,
    })
    const tasks = (unwrapApiData<any[]>(response) || []).map(mapTask)
    return wrapData({ tasks, total: tasks.length })
  },

  getTask: async (_clubId: string, taskId: string) => {
    const response = await api.get(`/tasks/${taskId}`)
    return wrapData(mapTask(unwrapApiData(response)))
  },

  createTask: async (clubId: string, data: CreateTaskRequest) => {
    const response = await api.post(`/clubs/${clubId}/tasks`, {
      ...data,
      club: clubId,
      assignedTo: data.assigneeIds,
      recurrence: data.recurringPattern
        ? {
            frequency: data.recurringPattern,
            interval: data.recurringInterval || 1,
            endDate: data.recurringEndDate,
          }
        : undefined,
      dueDate: normalizeDueDate(data.dueDate),
      priority: data.priority === 'urgent' ? 'critical' : data.priority,
      status:
        data.status === 'in_progress'
          ? 'inprogress'
          : data.status === 'in_review'
            ? 'review'
            : data.status === 'done'
              ? 'completed'
              : data.status,
      subtasks: data.subtasks?.filter((subtask) => subtask.title.trim()),
    })
    return wrapData(mapTask(unwrapApiData(response)))
  },

  updateTask: async (_clubId: string, taskId: string, data: UpdateTaskRequest) => {
    const response = await api.put(`/tasks/${taskId}`, {
      ...data,
      assignedTo: data.assigneeIds,
      dueDate: normalizeDueDate(data.dueDate),
      priority: data.priority === 'urgent' ? 'critical' : data.priority,
    })
    return wrapData(mapTask(unwrapApiData(response)))
  },

  deleteTask: (_clubId: string, taskId: string) =>
    api.delete(`/tasks/${taskId}`),

  // Task Actions
  updateTaskStatus: async (_clubId: string, taskId: string, status: string) => {
    const backendStatus =
      status === 'in_progress' ? 'inprogress' : status === 'in_review' ? 'review' : status === 'done' ? 'completed' : status
    const response = await api.patch(`/tasks/${taskId}/status`, { status: backendStatus })
    return wrapData(mapTask(unwrapApiData(response)))
  },

  assignTask: async (_clubId: string, taskId: string, assigneeIds: string[]) => {
    const response = await api.post(`/tasks/${taskId}/assign`, { userIds: assigneeIds })
    return wrapData(mapTask(unwrapApiData(response)))
  },

  // Comments
  addComment: async (_clubId: string, taskId: string, data: AddTaskCommentRequest) => {
    const response = await api.post(`/tasks/${taskId}/comments`, data)
    return wrapData(mapTaskComment(unwrapApiData(response)))
  },

  getComments: async (clubId: string, taskId: string) => {
    const taskResponse = await tasksService.getTask(clubId, taskId)
    return wrapData({ comments: taskResponse.data.comments || [] })
  },

  deleteComment: (clubId: string, taskId: string, commentId: string) =>
    api.delete(`/clubs/${clubId}/tasks/${taskId}/comments/${commentId}`),

  // Subtasks
  addSubtask: async (_clubId: string, taskId: string, title: string) => {
    const response = await api.post(`/tasks/${taskId}/subtasks`, { title })
    return wrapData(mapTask(unwrapApiData(response)))
  },

  toggleSubtask: async (_clubId: string, taskId: string, subtaskId: string) => {
    const response = await api.patch(`/tasks/${taskId}/subtasks/${subtaskId}`)
    return wrapData(mapTask(unwrapApiData(response)))
  },

  updateSubtask: async (_clubId: string, taskId: string, subtaskId: string, title: string) => {
    const response = await api.put(`/tasks/${taskId}/subtasks/${subtaskId}`, { title })
    return wrapData(mapTask(unwrapApiData(response)))
  },

  deleteSubtask: async (_clubId: string, taskId: string, subtaskId: string) => {
    const response = await api.delete(`/tasks/${taskId}/subtasks/${subtaskId}`)
    return wrapData(mapTask(unwrapApiData(response)))
  },

  // File uploads
  uploadAttachment: async (_clubId: string, taskId: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post(`/tasks/${taskId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return wrapData(mapTask(unwrapApiData(response)))
  },

  deleteAttachment: (clubId: string, taskId: string, attachmentId: string) =>
    api.delete(`/clubs/${clubId}/tasks/${taskId}/attachments/${attachmentId}`),

  // Edit history
  getEditHistory: (clubId: string, taskId: string) =>
    api.get(`/clubs/${clubId}/tasks/${taskId}/history`),

  // Bulk operations
  bulkUpdateStatus: (clubId: string, taskIds: string[], status: string) =>
    api.patch(`/clubs/${clubId}/tasks/bulk/status`, { taskIds, status }),

  bulkDelete: (clubId: string, taskIds: string[]) =>
    api.post(`/clubs/${clubId}/tasks/bulk/delete`, { taskIds }),
}
