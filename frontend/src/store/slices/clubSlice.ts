import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { clubsService } from '@/services/clubs.service'
import {
  Club,
  CreateClubRequest,
  UpdateClubRequest,
  InviteMemberRequest,
  UpdateMemberRoleRequest,
  ClubMember,
} from '@/types/index'

export interface ClubState {
  clubs: Club[]
  currentClub: Club | null
  activeClub: Club | null
  members: ClubMember[]
  isLoading: boolean
  isFetching: boolean
  error: string | null
}

const ACTIVE_CLUB_STORAGE_KEY = 'activeClub'

const readStoredActiveClub = (): Club | null => {
  if (typeof window === 'undefined') return null

  try {
    const stored = localStorage.getItem(ACTIVE_CLUB_STORAGE_KEY)
    return stored ? (JSON.parse(stored) as Club) : null
  } catch {
    return null
  }
}

const persistActiveClub = (club: Club | null) => {
  if (typeof window === 'undefined') return

  if (!club) {
    localStorage.removeItem(ACTIVE_CLUB_STORAGE_KEY)
    return
  }

  localStorage.setItem(ACTIVE_CLUB_STORAGE_KEY, JSON.stringify(club))
}

const getPreferredActiveClub = (clubs: Club[], currentActiveClub: Club | null) => {
  if (clubs.length === 0) return null

  const storedActiveClub = readStoredActiveClub()
  const preferredId = currentActiveClub?.id || storedActiveClub?.id

  if (preferredId) {
    const matchingClub = clubs.find((club) => club.id === preferredId)
    if (matchingClub) {
      return matchingClub
    }
  }

  return clubs[0]
}

const initialState: ClubState = {
  clubs: [],
  currentClub: null,
  activeClub: readStoredActiveClub(),
  members: [],
  isLoading: false,
  isFetching: false,
  error: null,
}

// Async thunks
export const fetchClubs = createAsyncThunk(
  'clubs/fetchClubs',
  async (params?: { page?: number; limit?: number }, { rejectWithValue }) => {
    try {
      const response = await clubsService.listClubs(params)
      return response.data.clubs
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch clubs')
    }
  }
)

export const fetchClubDetail = createAsyncThunk(
  'clubs/fetchClubDetail',
  async (clubId: string, { rejectWithValue }) => {
    try {
      const response = await clubsService.getClub(clubId)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch club details')
    }
  }
)

export const createClub = createAsyncThunk(
  'clubs/createClub',
  async (data: CreateClubRequest, { rejectWithValue }) => {
    try {
      const response = await clubsService.createClub(data)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create club')
    }
  }
)

export const joinClub = createAsyncThunk(
  'clubs/joinClub',
  async (clubId: string, { rejectWithValue }) => {
    try {
      await clubsService.joinClub(clubId)
      const response = await clubsService.getClub(clubId)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to join club')
    }
  }
)

export const updateClub = createAsyncThunk(
  'clubs/updateClub',
  async ({ clubId, data }: { clubId: string; data: UpdateClubRequest }, { rejectWithValue }) => {
    try {
      const response = await clubsService.updateClub(clubId, data)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update club')
    }
  }
)

export const deleteClub = createAsyncThunk(
  'clubs/deleteClub',
  async (clubId: string, { rejectWithValue }) => {
    try {
      await clubsService.deleteClub(clubId)
      return clubId
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete club')
    }
  }
)

export const fetchClubMembers = createAsyncThunk(
  'clubs/fetchClubMembers',
  async (clubId: string, { rejectWithValue }) => {
    try {
      const response = await clubsService.getClubMembers(clubId)
      return response.data.members
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch members')
    }
  }
)

export const inviteMember = createAsyncThunk(
  'clubs/inviteMember',
  async (
    { clubId, data }: { clubId: string; data: InviteMemberRequest },
    { rejectWithValue }
  ) => {
    try {
      const response = await clubsService.inviteMember(clubId, data)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to invite member')
    }
  }
)

export const updateMemberRole = createAsyncThunk(
  'clubs/updateMemberRole',
  async (
    { clubId, memberId, data }: { clubId: string; memberId: string; data: UpdateMemberRoleRequest },
    { rejectWithValue }
  ) => {
    try {
      const response = await clubsService.updateMemberRole(clubId, memberId, data)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update member role')
    }
  }
)

export const removeMember = createAsyncThunk(
  'clubs/removeMember',
  async ({ clubId, memberId }: { clubId: string; memberId: string }, { rejectWithValue }) => {
    try {
      await clubsService.removeMember(clubId, memberId)
      return { clubId, memberId }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove member')
    }
  }
)

const clubSlice = createSlice({
  name: 'clubs',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    clearCurrentClub: (state) => {
      state.currentClub = null
      state.members = []
    },
    setActiveClub: (state, action: PayloadAction<Club | null>) => {
      state.activeClub = action.payload
      persistActiveClub(action.payload)
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch clubs
      .addCase(fetchClubs.pending, (state) => {
        state.isFetching = true
        state.error = null
      })
      .addCase(fetchClubs.fulfilled, (state, action) => {
        state.isFetching = false
        state.clubs = action.payload
        state.activeClub = getPreferredActiveClub(action.payload, state.activeClub)
        persistActiveClub(state.activeClub)
      })
      .addCase(fetchClubs.rejected, (state, action) => {
        state.isFetching = false
        state.error = action.payload as string
      })

      // Fetch club detail
      .addCase(fetchClubDetail.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchClubDetail.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentClub = action.payload
        state.members = action.payload.members || []
        if (state.activeClub?.id === action.payload.id) {
          state.activeClub = action.payload
          persistActiveClub(action.payload)
        }
      })
      .addCase(fetchClubDetail.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })

      // Create club
      .addCase(createClub.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(createClub.fulfilled, (state, action) => {
        state.isLoading = false
        state.clubs.push(action.payload)
        state.currentClub = action.payload
        state.activeClub = action.payload
        persistActiveClub(action.payload)
      })
      .addCase(createClub.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })

      // Join club
      .addCase(joinClub.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(joinClub.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentClub = action.payload
        state.activeClub = action.payload
        persistActiveClub(action.payload)
        const existingClubIndex = state.clubs.findIndex((club) => club.id === action.payload.id)
        if (existingClubIndex !== -1) {
          state.clubs[existingClubIndex] = action.payload
        } else {
          state.clubs.unshift(action.payload)
        }
      })
      .addCase(joinClub.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })

      // Update club
      .addCase(updateClub.fulfilled, (state, action) => {
        state.currentClub = action.payload
        const index = state.clubs.findIndex((c) => c.id === action.payload.id)
        if (index !== -1) {
          state.clubs[index] = action.payload
        }
        if (state.activeClub?.id === action.payload.id) {
          state.activeClub = action.payload
          persistActiveClub(action.payload)
        }
      })

      // Delete club
      .addCase(deleteClub.fulfilled, (state, action) => {
        state.clubs = state.clubs.filter((c) => c.id !== action.payload)
        if (state.currentClub?.id === action.payload) {
          state.currentClub = null
          state.members = []
        }
        if (state.activeClub?.id === action.payload) {
          state.activeClub = state.clubs[0] || null
          persistActiveClub(state.activeClub)
        }
      })

      // Fetch members
      .addCase(fetchClubMembers.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchClubMembers.fulfilled, (state, action) => {
        state.isLoading = false
        state.members = action.payload
      })

      // Invite member
      .addCase(inviteMember.fulfilled, (state) => {
        state.error = null
      })

      // Update member role
      .addCase(updateMemberRole.fulfilled, (state, action) => {
        const index = state.members.findIndex((m) => m.id === action.payload.id)
        if (index !== -1) {
          state.members[index] = action.payload
        }
      })

      // Remove member
      .addCase(removeMember.fulfilled, (state, action) => {
        state.members = state.members.filter((m) => m.id !== action.payload.memberId)
        if (state.currentClub) {
          state.currentClub.memberCount -= 1
        }
      })
  },
})

export const { clearError, clearCurrentClub, setActiveClub } = clubSlice.actions
export default clubSlice.reducer
