import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import uiReducer from './slices/uiSlice'
import clubReducer from './slices/clubSlice'
import eventReducer from './slices/eventSlice'
import memberReducer from './slices/memberSlice'
import taskReducer from './slices/taskSlice'
import analyticsReducer from './slices/analyticsSlice'
import notificationReducer from './slices/notificationSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    clubs: clubReducer,
    events: eventReducer,
    members: memberReducer,
    tasks: taskReducer,
    analytics: analyticsReducer,
    notifications: notificationReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
