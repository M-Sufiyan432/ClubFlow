import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface Member {
  id: string
  clubId: string
  name: string
  email: string
  avatar?: string
  role: 'admin' | 'moderator' | 'member'
  joinedAt: string
  status: 'active' | 'inactive' | 'pending'
}

export interface MemberState {
  members: Member[]
  currentMember: Member | null
  isLoading: boolean
  error: string | null
}

const initialState: MemberState = {
  members: [],
  currentMember: null,
  isLoading: false,
  error: null,
}

const memberSlice = createSlice({
  name: 'members',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    setMembers: (state, action: PayloadAction<Member[]>) => {
      state.members = action.payload
      state.error = null
    },
    addMember: (state, action: PayloadAction<Member>) => {
      state.members.push(action.payload)
    },
    updateMember: (state, action: PayloadAction<Member>) => {
      const index = state.members.findIndex((m) => m.id === action.payload.id)
      if (index !== -1) {
        state.members[index] = action.payload
      }
    },
    removeMember: (state, action: PayloadAction<string>) => {
      state.members = state.members.filter((m) => m.id !== action.payload)
    },
    setCurrentMember: (state, action: PayloadAction<Member | null>) => {
      state.currentMember = action.payload
    },
  },
})

export const {
  setLoading,
  setError,
  setMembers,
  addMember,
  updateMember,
  removeMember,
  setCurrentMember,
} = memberSlice.actions
export default memberSlice.reducer
