import { createClient } from '@/lib/supabase/server'
import { IAView } from './ia-view'

export default async function IAPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: profile }, { data: conversations }] = await Promise.all([
    supabase.from('profiles').select('name, goal, experience_level').eq('id', user.id).single(),
    supabase.from('ai_conversations').select('*, ai_messages(*)').eq('user_id', user.id).order('updated_at', { ascending: false }).limit(10),
  ])

  return <IAView userId={user.id} profile={profile} conversations={conversations ?? []} />
}
