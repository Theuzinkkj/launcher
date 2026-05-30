import { createClient } from '@/lib/supabase/server'
import { DashboardView } from './dashboard-view'
import { getTodayString } from '@/lib/utils'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const today = getTodayString()

  const [
    { data: profile },
    { data: todayMeals },
    { data: todayWater },
    { data: todayWorkouts },
    { data: recentWorkouts },
    { data: lastMeasurement },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('meals').select('total_calories, total_protein, total_carbs, total_fat').eq('user_id', user.id).eq('date', today),
    supabase.from('water_logs').select('amount_ml').eq('user_id', user.id).eq('date', today),
    supabase.from('workout_logs').select('id, workout_name, duration_minutes, completed').eq('user_id', user.id).eq('date', today),
    supabase.from('workout_logs').select('id, workout_name, date, duration_minutes, completed').eq('user_id', user.id).order('date', { ascending: false }).limit(5),
    supabase.from('body_measurements').select('weight, body_fat_percentage, date').eq('user_id', user.id).order('date', { ascending: false }).limit(1).single(),
  ])

  const calories = todayMeals?.reduce((sum, m) => sum + m.total_calories, 0) ?? 0
  const protein = todayMeals?.reduce((sum, m) => sum + m.total_protein, 0) ?? 0
  const carbs = todayMeals?.reduce((sum, m) => sum + m.total_carbs, 0) ?? 0
  const fat = todayMeals?.reduce((sum, m) => sum + m.total_fat, 0) ?? 0
  const waterMl = todayWater?.reduce((sum, w) => sum + w.amount_ml, 0) ?? 0

  return (
    <DashboardView
      profile={profile}
      stats={{ calories, protein, carbs, fat, waterMl }}
      todayWorkouts={todayWorkouts ?? []}
      recentWorkouts={recentWorkouts ?? []}
      lastMeasurement={lastMeasurement}
    />
  )
}
