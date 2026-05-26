import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { tasksService } from '@/services/tasks.service'
import {
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskStatus,
  TaskComment,
  TaskFilter,
} from '@/types/index'

export interface TaskState {
  tasks: Task[]
  currentTask: Task | null
  comments: TaskComment[]
  isLoading: boolean
  isFetching: boolean
  error: string | null
  filter: TaskFilter
}

const initialState: TaskState = {
  tasks: [],
  currentTask: null,
  comments: [],
  isLoading: false,
  isFetching: false,
  error: null,
  filter: {},
}

// Async thunks
export const fetchTasks = createAsyncThunk(
  'tasks/fetchTasks',
  async ({ clubId, filters }: { clubId: string; filters?: TaskFilter }, { rejectWithValue }) => {
    try {
      const response = await tasksService.listTasks(clubId, filters)
      return response.data.tasks
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch tasks')
    }
  }
)

export const fetchPersonalTasks = createAsyncThunk(
  'tasks/fetchPersonalTasks',
  async (filters: TaskFilter | undefined, { rejectWithValue }) => {
    try {
      const response = await tasksService.listPersonalTasks(filters)
      return response.data.tasks
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch personal tasks')
    }
  }
)

export const fetchTaskDetail = createAsyncThunk(
  'tasks/fetchTaskDetail',
  async ({ clubId, taskId }: { clubId: string; taskId: string }, { rejectWithValue }) => {
    try {
      const response = await tasksService.getTask(clubId, taskId)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch task')
    }
  }
)

export const createTask = createAsyncThunk(
  'tasks/createTask',
  async (
    { clubId, data }: { clubId: string; data: CreateTaskRequest },
    { rejectWithValue }
  ) => {
    try {
      const response = await tasksService.createTask(clubId, data)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create task')
    }
  }
)

export const updateTask = createAsyncThunk(
  'tasks/updateTask',
  async (
    { clubId, taskId, data }: { clubId: string; taskId: string; data: UpdateTaskRequest },
    { rejectWithValue }
  ) => {
    try {
      const response = await tasksService.updateTask(clubId, taskId, data)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update task')
    }
  }
)

export const deleteTask = createAsyncThunk(
  'tasks/deleteTask',
  async ({ clubId, taskId }: { clubId: string; taskId: string }, { rejectWithValue }) => {
    try {
      await tasksService.deleteTask(clubId, taskId)
      return taskId
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete task')
    }
  }
)

export const updateTaskStatus = createAsyncThunk(
  'tasks/updateTaskStatus',
  async (
    { clubId, taskId, status }: { clubId: string; taskId: string; status: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await tasksService.updateTaskStatus(clubId, taskId, status)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update task status')
    }
  }
)

export const assignTask = createAsyncThunk(
  'tasks/assignTask',
  async (
    { clubId, taskId, assigneeIds }: { clubId: string; taskId: string; assigneeIds: string[] },
    { rejectWithValue }
  ) => {
    try {
      const response = await tasksService.assignTask(clubId, taskId, assigneeIds)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to assign task')
    }
  }
)

export const addComment = createAsyncThunk(
  'tasks/addComment',
  async (
    { clubId, taskId, content }: { clubId: string; taskId: string; content: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await tasksService.addComment(clubId, taskId, { content })
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add comment')
    }
  }
)

export const uploadTaskAttachment = createAsyncThunk(
  'tasks/uploadTaskAttachment',
  async (
    { clubId, taskId, file }: { clubId: string; taskId: string; file: File },
    { rejectWithValue }
  ) => {
    try {
      const response = await tasksService.uploadAttachment(clubId, taskId, file)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to upload attachment')
    }
  }
)

export const addTaskSubtask = createAsyncThunk(
  'tasks/addTaskSubtask',
  async (
    { clubId, taskId, title }: { clubId: string; taskId: string; title: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await tasksService.addSubtask(clubId, taskId, title)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add subtask')
    }
  }
)

export const toggleTaskSubtask = createAsyncThunk(
  'tasks/toggleTaskSubtask',
  async (
    { clubId, taskId, subtaskId }: { clubId: string; taskId: string; subtaskId: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await tasksService.toggleSubtask(clubId, taskId, subtaskId)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update subtask')
    }
  }
)

export const updateTaskSubtask = createAsyncThunk(
  'tasks/updateTaskSubtask',
  async (
    { clubId, taskId, subtaskId, title }: { clubId: string; taskId: string; subtaskId: string; title: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await tasksService.updateSubtask(clubId, taskId, subtaskId, title)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to rename subtask')
    }
  }
)

export const deleteTaskSubtask = createAsyncThunk(
  'tasks/deleteTaskSubtask',
  async (
    { clubId, taskId, subtaskId }: { clubId: string; taskId: string; subtaskId: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await tasksService.deleteSubtask(clubId, taskId, subtaskId)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete subtask')
    }
  }
)

export const fetchComments = createAsyncThunk(
  'tasks/fetchComments',
  async ({ clubId, taskId }: { clubId: string; taskId: string }, { rejectWithValue }) => {
    try {
      const response = await tasksService.getComments(clubId, taskId)
      return response.data.comments
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch comments')
    }
  }
)

const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    // Socket event handlers
    addTaskFromSocket: (state, action: PayloadAction<Task>) => {
      const existingIndex = state.tasks.findIndex((task) => task.id === action.payload.id)
      if (existingIndex === -1) {
        state.tasks.unshift(action.payload)
      } else {
        state.tasks[existingIndex] = action.payload
      }
    },
    updateTaskFromSocket: (state, action: PayloadAction<Partial<Task> & { id: string }>) => {
      const taskIndex = state.tasks.findIndex((t) => t.id === action.payload.id)
      if (taskIndex !== -1) {
        state.tasks[taskIndex] = { ...state.tasks[taskIndex], ...action.payload }
      }
      if (state.currentTask?.id === action.payload.id) {
        state.currentTask = { ...state.currentTask, ...action.payload }
      }
    },
    addCommentFromSocket: (state, action: PayloadAction<TaskComment & { taskId: string }>) => {
      const taskIndex = state.tasks.findIndex((t) => t.id === action.payload.taskId)
      if (taskIndex !== -1) {
        state.tasks[taskIndex].comments.push(action.payload)
      }
      if (state.currentTask?.id === action.payload.taskId) {
        state.currentTask.comments.push(action.payload)
      }
    },
    removeTaskFromSocket: (state, action: PayloadAction<{ taskId: string }>) => {
      state.tasks = state.tasks.filter((task) => task.id !== action.payload.taskId)
      if (state.currentTask?.id === action.payload.taskId) {
        state.currentTask = null
      }
    },
    clearError: (state) => {
      state.error = null
    },
    setFilter: (state, action: PayloadAction<TaskFilter>) => {
      state.filter = action.payload
    },
    clearCurrentTask: (state) => {
      state.currentTask = null
      state.comments = []
    },
    // Optimistic updates
    optimisticTaskStatusUpdate: (state, action: PayloadAction<{ taskId: string; status: TaskStatus }>) => {
      const task = state.tasks.find(t => t.id === action.payload.taskId)
      if (task) {
        task.status = action.payload.status
      }
      if (state.currentTask?.id === action.payload.taskId) {
        state.currentTask.status = action.payload.status
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch tasks
      .addCase(fetchTasks.pending, (state) => {
        state.isFetching = true
        state.error = null
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.isFetching = false
        state.tasks = action.payload
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.isFetching = false
        state.error = action.payload as string
      })

      // Fetch personal tasks
      .addCase(fetchPersonalTasks.pending, (state) => {
        state.isFetching = true
        state.error = null
      })
      .addCase(fetchPersonalTasks.fulfilled, (state, action) => {
        state.isFetching = false
        state.tasks = action.payload
      })
      .addCase(fetchPersonalTasks.rejected, (state, action) => {
        state.isFetching = false
        state.error = action.payload as string
      })

      // Fetch task detail
      .addCase(fetchTaskDetail.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchTaskDetail.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentTask = action.payload
        state.comments = action.payload.comments || []
      })
      .addCase(fetchTaskDetail.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })

      // Create task
      .addCase(createTask.fulfilled, (state, action) => {
        state.tasks.unshift(action.payload)
      })

      // Update task
      .addCase(updateTask.fulfilled, (state, action) => {
        const index = state.tasks.findIndex(t => t.id === action.payload.id)
        if (index !== -1) {
          state.tasks[index] = action.payload
        }
        if (state.currentTask?.id === action.payload.id) {
          state.currentTask = action.payload
        }
      })

      // Delete task
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.tasks = state.tasks.filter(t => t.id !== action.payload)
        if (state.currentTask?.id === action.payload) {
          state.currentTask = null
        }
      })

      // Update task status
      .addCase(updateTaskStatus.fulfilled, (state, action) => {
        const index = state.tasks.findIndex(t => t.id === action.payload.id)
        if (index !== -1) {
          state.tasks[index] = action.payload
        }
        if (state.currentTask?.id === action.payload.id) {
          state.currentTask = action.payload
        }
      })

      // Attachment upload
      .addCase(uploadTaskAttachment.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(uploadTaskAttachment.fulfilled, (state, action) => {
        state.isLoading = false
        const index = state.tasks.findIndex(t => t.id === action.payload.id)
        if (index !== -1) {
          state.tasks[index] = action.payload
        }
        if (state.currentTask?.id === action.payload.id) {
          state.currentTask = action.payload
        }
      })
      .addCase(uploadTaskAttachment.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })

      // Subtasks
      .addCase(addTaskSubtask.fulfilled, (state, action) => {
        const index = state.tasks.findIndex(t => t.id === action.payload.id)
        if (index !== -1) {
          state.tasks[index] = action.payload
        }
        if (state.currentTask?.id === action.payload.id) {
          state.currentTask = action.payload
        }
      })
      .addCase(toggleTaskSubtask.fulfilled, (state, action) => {
        const index = state.tasks.findIndex(t => t.id === action.payload.id)
        if (index !== -1) {
          state.tasks[index] = action.payload
        }
        if (state.currentTask?.id === action.payload.id) {
          state.currentTask = action.payload
        }
      })
      .addCase(updateTaskSubtask.fulfilled, (state, action) => {
        const index = state.tasks.findIndex(t => t.id === action.payload.id)
        if (index !== -1) {
          state.tasks[index] = action.payload
        }
        if (state.currentTask?.id === action.payload.id) {
          state.currentTask = action.payload
        }
      })
      .addCase(deleteTaskSubtask.fulfilled, (state, action) => {
        const index = state.tasks.findIndex(t => t.id === action.payload.id)
        if (index !== -1) {
          state.tasks[index] = action.payload
        }
        if (state.currentTask?.id === action.payload.id) {
          state.currentTask = action.payload
        }
      })

      // Assign task
      .addCase(assignTask.fulfilled, (state, action) => {
        const index = state.tasks.findIndex(t => t.id === action.payload.id)
        if (index !== -1) {
          state.tasks[index] = action.payload
        }
        if (state.currentTask?.id === action.payload.id) {
          state.currentTask = action.payload
        }
      })

      // Comments
      .addCase(addComment.fulfilled, (state, action) => {
        state.comments.push(action.payload)
        if (state.currentTask) {
          state.currentTask.comments.push(action.payload)
        }
      })

      .addCase(fetchComments.fulfilled, (state, action) => {
        state.comments = action.payload
      })
  },
})

export const {
  clearError,
  setFilter,
  clearCurrentTask,
  optimisticTaskStatusUpdate,
  updateTaskFromSocket,
  addCommentFromSocket,
  addTaskFromSocket,
  removeTaskFromSocket,
} = taskSlice.actions
export default taskSlice.reducer
