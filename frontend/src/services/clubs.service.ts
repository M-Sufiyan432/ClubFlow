import api from './api'
import {
  Club,
  CreateClubRequest,
  UpdateClubRequest,
  InviteMemberRequest,
  UpdateMemberRoleRequest,
  ClubMember,
} from '@/types/index'
import { mapClub, mapClubMember, wrapData, unwrapApiData } from './adapters'

export const clubsService = {
  // Club CRUD
  listClubs: async (params?: { page?: number; limit?: number }) => {
    const response = await api.get('/clubs', { params })
    const clubs = (unwrapApiData<any[]>(response) || []).map(mapClub)
    return wrapData({ clubs, total: response.data?.total || clubs.length })
  },

  getClub: async (clubId: string) => {
    const response = await api.get(`/clubs/${clubId}`)
    return wrapData(mapClub(unwrapApiData(response)))
  },

  createClub: async (data: CreateClubRequest) => {
    const response = await api.post('/clubs', {
      ...data,
      visibility: data.isPrivate ? 'private' : 'public',
    })
    return wrapData(mapClub(unwrapApiData(response)))
  },

  updateClub: async (clubId: string, data: UpdateClubRequest) => {
    const response = await api.put(`/clubs/${clubId}`, data)
    return wrapData(mapClub(unwrapApiData(response)))
  },

  deleteClub: (clubId: string) =>
    api.delete(`/clubs/${clubId}`),

  joinClub: async (clubId: string) => {
    const response = await api.post(`/clubs/${clubId}/join`)
    return wrapData(unwrapApiData(response) || response.data)
  },

  // Member management
  getClubMembers: async (clubId: string) => {
    const response = await api.get(`/clubs/${clubId}/members`)
    return wrapData({ members: (unwrapApiData<any[]>(response) || []).map(mapClubMember) })
  },

  inviteMember: async (clubId: string, data: InviteMemberRequest) => {
    const response = await api.post(`/clubs/${clubId}/invite`, data)
    return wrapData(unwrapApiData(response) || response.data)
  },

  updateMemberRole: async (clubId: string, memberId: string, data: UpdateMemberRoleRequest) => {
    await api.put(`/clubs/${clubId}/members/${memberId}/role`, data)
    return wrapData({ id: memberId, userId: memberId, role: data.role })
  },

  removeMember: (clubId: string, memberId: string) =>
    api.delete(`/clubs/${clubId}/members/${memberId}`),

  transferOwnership: (clubId: string, newOwnerId: string) =>
    api.post<Club>(`/clubs/${clubId}/transfer`, { newPresidentId: newOwnerId }),

  // Invitations
  getPendingInvites: (clubId: string) =>
    api.get(`/clubs/${clubId}/pending-invites`),

  respondToInvite: (inviteId: string, accept: boolean) =>
    api.post(`/invites/${inviteId}/respond`, { accept }),
}
