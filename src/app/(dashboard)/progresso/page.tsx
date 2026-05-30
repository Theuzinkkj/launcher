import { createClient } from '@/lib/supabase/server'
import { ProgressoView } from './progresso-view'

export default async function ProgressoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: profile }, { data: measurements }, { data: personalRecords }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('body_measurements').select('*').eq('user_id', user.id).order('date', { ascending: true }),
    supabase.from('personal_records').select('*').eq('user_id', user.id).order('date', { ascending: false }),
  ])

  return (
    <ProgressoView
      userId={user.id}
      profile={profile}
      measurements={measurements ?? []}
      personalRecords={personalRecords ?? []}
    />
  )
}
