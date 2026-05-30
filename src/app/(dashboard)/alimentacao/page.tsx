import { createClient } from '@/lib/supabase/server'
import { AlimentacaoView } from './alimentacao-view'
import { getTodayString } from '@/lib/utils'

export default async function AlimentacaoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const today = getTodayString()

  const [{ data: profile }, { data: todayMeals }, { data: recentMeals }] = await Promise.all([
    supabase.from('profiles').select('daily_calorie_goal, daily_protein_goal, daily_carb_goal, daily_fat_goal').eq('id', user.id).single(),
    supabase.from('meals').select('*, food_items(*)').eq('user_id', user.id).eq('date', today).order('created_at', { ascending: true }),
    supabase.from('meals').select('*, food_items(*)').eq('user_id', user.id).order('date', { ascending: false }).limit(30),
  ])

  return (
    <AlimentacaoView
      userId={user.id}
      todayMeals={todayMeals ?? []}
      recentMeals={recentMeals ?? []}
      profile={profile}
    />
  )
}
