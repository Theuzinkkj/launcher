import { createClient } from '@/lib/supabase/server'
import { TreinosView } from './treinos-view'

export default async function TreinosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: workouts }, { data: workoutLogs }, { data: personalRecords }] = await Promise.all([
    supabase.from('workouts').select('*, exercises(*)').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('workout_logs').select('*, exercise_logs(*)').eq('user_id', user.id).order('date', { ascending: false }).limit(20),
    supabase.from('personal_records').select('*').eq('user_id', user.id).order('date', { ascending: false }),
  ])

  return (
    <TreinosView
      workouts={workouts ?? []}
      workoutLogs={workoutLogs ?? []}
      personalRecords={personalRecords ?? []}
      userId={user.id}
    />
  )
}
