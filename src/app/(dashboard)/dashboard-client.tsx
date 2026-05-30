'use client'

import { useEffect } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { useAppStore } from '@/store'
import { Profile } from '@/types'
import { User } from '@supabase/supabase-js'

interface DashboardClientProps {
  children: React.ReactNode
  profile: Profile | null
  user: User
}

export function DashboardClient({ children, profile, user }: DashboardClientProps) {
  const setProfile = useAppStore(s => s.setProfile)
  const sidebarOpen = useAppStore(s => s.sidebarOpen)

  useEffect(() => {
    if (profile) {
      setProfile(profile)
    } else {
      setProfile({ id: user.id, email: user.email ?? null, name: null, avatar_url: null, age: null, sex: null, height: null, weight: null, goal: null, experience_level: null, available_days: [], food_restrictions: [], daily_calorie_goal: 2000, daily_protein_goal: 150, daily_carb_goal: 250, daily_fat_goal: 65, daily_water_goal: 2.5, created_at: '', updated_at: '' })
    }
  }, [profile, user, setProfile])

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <main className={`flex-1 overflow-y-auto transition-all duration-300`}>
        {children}
      </main>
    </div>
  )
}
