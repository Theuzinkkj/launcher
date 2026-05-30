import { createClient } from '@/lib/supabase/server'
import { PerfilView } from './perfil-view'

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  return <PerfilView userId={user.id} profile={profile} />
}
