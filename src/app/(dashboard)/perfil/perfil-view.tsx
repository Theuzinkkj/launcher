'use client'

import { useState, useTransition } from 'react'
import { Navbar } from '@/components/layout/navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Profile, Goal, Sex, ExperienceLevel, GOAL_LABELS, EXPERIENCE_LABELS } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store'
import { calculateBMI, getBMICategory, calculateCalorieGoal } from '@/lib/utils'
import { User, Target, Dumbbell, Utensils, Save, Calculator, CheckCircle2 } from 'lucide-react'

interface PerfilViewProps { userId: string; profile: Profile | null }

const DAYS = [
  { value: 'segunda', label: 'Seg' },
  { value: 'terca', label: 'Ter' },
  { value: 'quarta', label: 'Qua' },
  { value: 'quinta', label: 'Qui' },
  { value: 'sexta', label: 'Sex' },
  { value: 'sabado', label: 'Sáb' },
  { value: 'domingo', label: 'Dom' },
]

const RESTRICTIONS = ['Vegetariano', 'Vegano', 'Sem glúten', 'Sem lactose', 'Sem amendoim', 'Halal', 'Kosher']

export function PerfilView({ userId, profile }: PerfilViewProps) {
  const router = useRouter()
  const setStoreProfile = useAppStore(s => s.setProfile)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<'pessoal' | 'objetivos' | 'nutricao'>('pessoal')

  const [form, setForm] = useState({
    name: profile?.name ?? '',
    age: profile?.age?.toString() ?? '',
    sex: profile?.sex ?? '',
    height: profile?.height?.toString() ?? '',
    weight: profile?.weight?.toString() ?? '',
    goal: profile?.goal ?? '',
    experience_level: profile?.experience_level ?? '',
    available_days: profile?.available_days ?? [],
    food_restrictions: profile?.food_restrictions ?? [],
    daily_calorie_goal: profile?.daily_calorie_goal?.toString() ?? '2000',
    daily_protein_goal: profile?.daily_protein_goal?.toString() ?? '150',
    daily_carb_goal: profile?.daily_carb_goal?.toString() ?? '250',
    daily_fat_goal: profile?.daily_fat_goal?.toString() ?? '65',
    daily_water_goal: profile?.daily_water_goal?.toString() ?? '2.5',
  })

  const bmi = form.weight && form.height
    ? calculateBMI(parseFloat(form.weight), parseFloat(form.height))
    : null

  function toggleDay(day: string) {
    setForm(p => ({
      ...p,
      available_days: p.available_days.includes(day)
        ? p.available_days.filter(d => d !== day)
        : [...p.available_days, day],
    }))
  }

  function toggleRestriction(r: string) {
    setForm(p => ({
      ...p,
      food_restrictions: p.food_restrictions.includes(r)
        ? p.food_restrictions.filter(x => x !== r)
        : [...p.food_restrictions, r],
    }))
  }

  function autoCalculate() {
    if (!form.weight || !form.height || !form.age || !form.sex || !form.goal) return
    const cals = calculateCalorieGoal(
      parseFloat(form.weight), parseFloat(form.height),
      parseInt(form.age), form.sex, form.goal
    )
    const protein = Math.round(parseFloat(form.weight) * 2)
    const fat = Math.round(cals * 0.25 / 9)
    const carbs = Math.round((cals - protein * 4 - fat * 9) / 4)
    setForm(p => ({
      ...p,
      daily_calorie_goal: cals.toString(),
      daily_protein_goal: protein.toString(),
      daily_carb_goal: carbs.toString(),
      daily_fat_goal: fat.toString(),
    }))
  }

  async function saveProfile() {
    const supabase = createClient()
    const data = {
      name: form.name || null,
      age: form.age ? parseInt(form.age) : null,
      sex: form.sex as Sex || null,
      height: form.height ? parseFloat(form.height) : null,
      weight: form.weight ? parseFloat(form.weight) : null,
      goal: form.goal as Goal || null,
      experience_level: form.experience_level as ExperienceLevel || null,
      available_days: form.available_days,
      food_restrictions: form.food_restrictions,
      daily_calorie_goal: parseInt(form.daily_calorie_goal),
      daily_protein_goal: parseFloat(form.daily_protein_goal),
      daily_carb_goal: parseFloat(form.daily_carb_goal),
      daily_fat_goal: parseFloat(form.daily_fat_goal),
      daily_water_goal: parseFloat(form.daily_water_goal),
      updated_at: new Date().toISOString(),
    }

    await supabase.from('profiles').update(data).eq('id', userId)
    setStoreProfile({ ...profile!, ...data } as Profile)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    startTransition(() => router.refresh())
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar title="Perfil" />

      <div className="flex-1 p-4 lg:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Meu Perfil</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Configure suas informações para personalizar a experiência</p>
          </div>
          <Button onClick={saveProfile} className="gap-2" disabled={isPending}>
            {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? 'Salvo!' : 'Salvar'}
          </Button>
        </div>

        {/* Profile Header */}
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
              {form.name ? form.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : '?'}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{form.name || 'Usuário'}</h3>
              <div className="flex gap-2 flex-wrap mt-1">
                {form.goal && <Badge variant="default">{GOAL_LABELS[form.goal as Goal]}</Badge>}
                {form.experience_level && <Badge variant="secondary">{EXPERIENCE_LABELS[form.experience_level as ExperienceLevel]}</Badge>}
                {bmi && <Badge variant="blue">IMC: {bmi.toFixed(1)} - {getBMICategory(bmi)}</Badge>}
              </div>
            </div>
            <div className="hidden sm:flex gap-6 text-center">
              <div>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{form.weight || '--'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">kg</p>
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{form.height || '--'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">cm</p>
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{form.age || '--'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">anos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
          {([
            { id: 'pessoal', label: 'Dados Pessoais', icon: <User className="w-4 h-4" /> },
            { id: 'objetivos', label: 'Objetivos', icon: <Target className="w-4 h-4" /> },
            { id: 'nutricao', label: 'Nutrição', icon: <Utensils className="w-4 h-4" /> },
          ] as const).map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>
              {tab.icon} <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {activeTab === 'pessoal' && (
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><User className="w-4 h-4" /> Dados Pessoais</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Nome completo</label>
                  <Input placeholder="Seu nome completo" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Idade</label>
                  <Input type="number" placeholder="25" value={form.age} onChange={e => setForm(p => ({ ...p, age: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Sexo</label>
                  <Select value={form.sex} onValueChange={v => setForm(p => ({ ...p, sex: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="masculino">Masculino</SelectItem>
                      <SelectItem value="feminino">Feminino</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Altura (cm)</label>
                  <Input type="number" placeholder="175" value={form.height} onChange={e => setForm(p => ({ ...p, height: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Peso atual (kg)</label>
                  <Input type="number" step="0.1" placeholder="70.5" value={form.weight} onChange={e => setForm(p => ({ ...p, weight: e.target.value }))} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'objetivos' && (
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Target className="w-4 h-4" /> Objetivos e Nível</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Objetivo principal</label>
                    <Select value={form.goal} onValueChange={v => setForm(p => ({ ...p, goal: v }))}>
                      <SelectTrigger><SelectValue placeholder="Selecione seu objetivo" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="emagrecimento">🏃 Emagrecimento</SelectItem>
                        <SelectItem value="hipertrofia">💪 Hipertrofia</SelectItem>
                        <SelectItem value="manutencao">⚖️ Manutenção</SelectItem>
                        <SelectItem value="performance">🏆 Performance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Nível de experiência</label>
                    <Select value={form.experience_level} onValueChange={v => setForm(p => ({ ...p, experience_level: v }))}>
                      <SelectTrigger><SelectValue placeholder="Selecione seu nível" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="iniciante">🌱 Iniciante (0-1 ano)</SelectItem>
                        <SelectItem value="intermediario">🔥 Intermediário (1-3 anos)</SelectItem>
                        <SelectItem value="avancado">⚡ Avançado (3+ anos)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Dumbbell className="w-4 h-4" /> Dias de Treino</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => toggleDay(value)}
                      className={`w-12 h-12 rounded-xl text-sm font-semibold transition-all ${form.available_days.includes(value) ? 'bg-emerald-500 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                  {form.available_days.length} dia{form.available_days.length !== 1 ? 's' : ''} por semana selecionado{form.available_days.length !== 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Restrições Alimentares</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {RESTRICTIONS.map(r => (
                    <button
                      key={r}
                      onClick={() => toggleRestriction(r)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${form.food_restrictions.includes(r) ? 'bg-emerald-500 text-white' : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-emerald-300 dark:hover:border-emerald-700'}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'nutricao' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><Utensils className="w-4 h-4" /> Metas Nutricionais</CardTitle>
                <Button variant="outline" size="sm" onClick={autoCalculate} className="gap-1.5">
                  <Calculator className="w-3.5 h-3.5" /> Calcular Automaticamente
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Clique em "Calcular Automaticamente" para gerar metas baseadas no seu perfil e objetivo, ou defina manualmente.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Meta de Calorias (kcal/dia)</label>
                  <Input type="number" value={form.daily_calorie_goal} onChange={e => setForm(p => ({ ...p, daily_calorie_goal: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Meta de Proteínas (g/dia)</label>
                  <Input type="number" value={form.daily_protein_goal} onChange={e => setForm(p => ({ ...p, daily_protein_goal: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Meta de Carboidratos (g/dia)</label>
                  <Input type="number" value={form.daily_carb_goal} onChange={e => setForm(p => ({ ...p, daily_carb_goal: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Meta de Gorduras (g/dia)</label>
                  <Input type="number" value={form.daily_fat_goal} onChange={e => setForm(p => ({ ...p, daily_fat_goal: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Meta de Água (litros/dia)</label>
                  <Input type="number" step="0.1" value={form.daily_water_goal} onChange={e => setForm(p => ({ ...p, daily_water_goal: e.target.value }))} />
                </div>
              </div>

              {/* Macros distribution preview */}
              {form.daily_calorie_goal && (
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Distribuição calórica</p>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-lg font-bold text-red-500">{Math.round(parseFloat(form.daily_protein_goal) * 4)} kcal</p>
                      <p className="text-xs text-gray-500">Proteínas ({Math.round((parseFloat(form.daily_protein_goal) * 4 / parseFloat(form.daily_calorie_goal)) * 100)}%)</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-yellow-500">{Math.round(parseFloat(form.daily_carb_goal) * 4)} kcal</p>
                      <p className="text-xs text-gray-500">Carbs ({Math.round((parseFloat(form.daily_carb_goal) * 4 / parseFloat(form.daily_calorie_goal)) * 100)}%)</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-emerald-500">{Math.round(parseFloat(form.daily_fat_goal) * 9)} kcal</p>
                      <p className="text-xs text-gray-500">Gorduras ({Math.round((parseFloat(form.daily_fat_goal) * 9 / parseFloat(form.daily_calorie_goal)) * 100)}%)</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
