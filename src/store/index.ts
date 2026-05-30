import { create } from 'zustand'
import { Profile } from '@/types'

interface AppStore {
  profile: Profile | null
  setProfile: (profile: Profile | null) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

export const useAppStore = create<AppStore>((set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}))
