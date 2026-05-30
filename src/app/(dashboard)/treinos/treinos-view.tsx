'use client'

import { useState, useTransition } from 'react'
import { Navbar } from '@/components/layout/navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Workout, Exercise, WorkoutLog, PersonalRecord, MUSCLE_GROUP_LABELS, MuscleGroup } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { formatDate, getTodayString } from '@/lib/utils'
import {
  Plus, Dumbbell, Trash2, Edit, Play, Trophy, Calendar,
  Clock, CheckCircle2, ChevronDown, ChevronUp, Target, Flame
} from 'lucide-react'

interface TreinosViewProps {
  workouts: Workout[]
  workoutLogs: WorkoutLog[]
  personalRecords: PersonalRecord[]
  userId: string
}

const MUSCLE_GROUPS: MuscleGroup[] = ['peito', 'costas', 'ombro', 'biceps', 'triceps', 'pernas', 'abdomen', 'gluteos', 'cardio']

export function TreinosView({ workouts, workoutLogs, personalRecords, userId }: TreinosViewProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState<'treinos' | 'historico' | 'records'>('treinos')
  const [showNewWorkout, setShowNewWorkout] = useState(false)
  const [showLogWorkout, setShowLogWorkout] = useState<string | null>(null)
  const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null)

  // New workout form
  const [newWorkout, setNewWorkout] = useState({
    name: '', description: '', type: 'personalizado' as const, estimated_duration: '',
  })
  const [exercises, setExercises] = useState<Partial<Exercise>[]>([
    { name: '', muscle_group: '', sets: 3, reps: '10', weight: undefined, rest_seconds: 60, order_index: 0 }
  ])

  // Log workout form
  const [logData, setLogData] = useState({ duration_minutes: '', notes: '', completed: true })

  const refresh = () => startTransition(() => router.refresh())

  async function createWorkout() {
    const supabase = createClient()
    const { data: workout, error } = await supabase.from('workouts').insert({
      user_id: userId,
      name: newWorkout.name,
      description: newWorkout.description || null,
      type: newWorkout.type,
      estimated_duration: newWorkout.estimated_duration ? parseInt(newWorkout.estimated_duration) : null,
      muscle_groups: [...new Set(exercises.filter(e => e.muscle_group).map(e => e.muscle_group!))],
    }).select().single()

    if (error || !workout) return

    if (exercises.length > 0) {
      await supabase.from('exercises').insert(
        exercises.filter(e => e.name).map((e, i) => ({
          workout_id: workout.id,
          name: e.name!,
          muscle_group: e.muscle_group || null,
          sets: e.sets ?? 3,
          reps: e.reps ?? '10',
          weight: e.weight ?? null,
          rest_seconds: e.rest_seconds ?? 60,
          order_index: i,
        }))
      )
    }

    setShowNewWorkout(false)
    setNewWorkout({ name: '', description: '', type: 'personalizado', estimated_duration: '' })
    setExercises([{ name: '', muscle_group: '', sets: 3, reps: '10', weight: undefined, rest_seconds: 60, order_index: 0 }])
    refresh()
  }

  async function logWorkout(workoutId: string, workoutName: string) {
    const supabase = createClient()
    await supabase.from('workout_logs').insert({
      user_id: userId,
      workout_id: workoutId,
      workout_name: workoutName,
      date: getTodayString(),
      duration_minutes: logData.duration_minutes ? parseInt(logData.duration_minutes) : null,
      notes: logData.notes || null,
      completed: logData.completed,
    })
    setShowLogWorkout(null)
    setLogData({ duration_minutes: '', notes: '', completed: true })
    refresh()
  }

  async function deleteWorkout(id: string) {
    const supabase = createClient()
    await supabase.from('workouts').delete().eq('id', id)
    refresh()
  }

  function addExercise() {
    setExercises(prev => [...prev, {
      name: '', muscle_group: '', sets: 3, reps: '10', weight: undefined, rest_seconds: 60, order_index: prev.length
    }])
  }

  function updateExercise(index: number, field: string, value: string | number) {
    setExercises(prev => prev.map((e, i) => i === index ? { ...e, [field]: value } : e))
  }

  function removeExercise(index: number) {
    setExercises(prev => prev.filter((_, i) => i !== index))
  }

  const tabs = [
    { id: 'treinos', label: 'Meus Treinos', count: workouts.length },
    { id: 'historico', label: 'Histórico', count: workoutLogs.length },
    { id: 'records', label: 'Records (PR)', count: personalRecords.length },
  ] as const

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar title="Treinos" />

      <div className="flex-1 p-4 lg:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Gestão de Treinos</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Crie e acompanhe seus treinos</p>
          </div>
          <Button onClick={() => setShowNewWorkout(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Novo Treino
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total de Treinos', value: workoutLogs.length, icon: <Dumbbell className="w-5 h-5 text-purple-500" /> },
            { label: 'Este Mês', value: workoutLogs.filter(l => l.date >= new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]).length, icon: <Calendar className="w-5 h-5 text-blue-500" /> },
            { label: 'Records', value: personalRecords.length, icon: <Trophy className="w-5 h-5 text-yellow-500" /> },
          ].map(({ label, value, icon }) => (
            <Card key={label}>
              <CardContent className="p-4 flex items-center gap-3">
                {icon}
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'treinos' && (
          <div className="space-y-4">
            {workouts.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Dumbbell className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 mb-4">Nenhum treino criado ainda</p>
                  <Button onClick={() => setShowNewWorkout(true)}>Criar meu primeiro treino</Button>
                </CardContent>
              </Card>
            ) : (
              workouts.map(workout => (
                <Card key={workout.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-base">{workout.name}</CardTitle>
                          <Badge variant="secondary">{workout.type}</Badge>
                        </div>
                        {workout.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{workout.description}</p>
                        )}
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {workout.muscle_groups?.map(mg => (
                            <Badge key={mg} variant="blue">{MUSCLE_GROUP_LABELS[mg as MuscleGroup] ?? mg}</Badge>
                          ))}
                          {workout.estimated_duration && (
                            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                              <Clock className="w-3 h-3" /> {workout.estimated_duration}min
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost" size="icon" className="h-8 w-8"
                          onClick={() => setExpandedWorkout(expandedWorkout === workout.id ? null : workout.id)}
                        >
                          {expandedWorkout === workout.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={() => deleteWorkout(workout.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  {expandedWorkout === workout.id && workout.exercises && (
                    <CardContent className="pt-0">
                      <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                          Exercícios ({workout.exercises.length})
                        </p>
                        <div className="space-y-2">
                          {workout.exercises
                            .sort((a, b) => a.order_index - b.order_index)
                            .map((ex, i) => (
                              <div key={ex.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                                  {i + 1}
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{ex.name}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {ex.sets}x{ex.reps}{ex.weight ? ` • ${ex.weight}kg` : ''} • Descanso: {ex.rest_seconds}s
                                  </p>
                                </div>
                                {ex.muscle_group && (
                                  <Badge variant="secondary">{MUSCLE_GROUP_LABELS[ex.muscle_group as MuscleGroup] ?? ex.muscle_group}</Badge>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    </CardContent>
                  )}

                  <CardContent className="pt-0 pb-4">
                    <Button
                      className="w-full gap-2" size="sm"
                      onClick={() => setShowLogWorkout(workout.id)}
                    >
                      <Play className="w-4 h-4" /> Registrar Treino
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === 'historico' && (
          <div className="space-y-3">
            {workoutLogs.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">Nenhum treino registrado ainda</p>
                </CardContent>
              </Card>
            ) : (
              workoutLogs.map(log => (
                <Card key={log.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {log.completed
                          ? <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                          : <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600 flex-shrink-0" />
                        }
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{log.workout_name}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            <span>{formatDate(log.date)}</span>
                            {log.duration_minutes && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {log.duration_minutes}min
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Badge variant={log.completed ? 'default' : 'secondary'}>
                        {log.completed ? 'Completo' : 'Incompleto'}
                      </Badge>
                    </div>
                    {log.notes && <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 pl-8">{log.notes}</p>}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === 'records' && (
          <div className="space-y-3">
            {personalRecords.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Trophy className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">Nenhum record registrado ainda</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {personalRecords.map(pr => (
                  <Card key={pr.id} className="overflow-hidden border-l-4 border-l-yellow-400">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{pr.exercise_name}</h3>
                        <Trophy className="w-4 h-4 text-yellow-500" />
                      </div>
                      <div className="flex gap-4">
                        {pr.weight && (
                          <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{pr.weight}kg</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Carga máxima</p>
                          </div>
                        )}
                        {pr.reps && (
                          <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{pr.reps}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Repetições</p>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-600 mt-2">{formatDate(pr.date)}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* New Workout Dialog */}
      <Dialog open={showNewWorkout} onOpenChange={setShowNewWorkout}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Novo Treino</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Nome do Treino *</label>
                <Input placeholder="Ex: Treino A - Peito e Tríceps" value={newWorkout.name} onChange={e => setNewWorkout(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Tipo</label>
                <Select value={newWorkout.type} onValueChange={v => setNewWorkout(p => ({ ...p, type: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['A','B','C','D','E'].map(t => <SelectItem key={t} value={t}>Treino {t}</SelectItem>)}
                    <SelectItem value="fullbody">Full Body</SelectItem>
                    <SelectItem value="hiit">HIIT</SelectItem>
                    <SelectItem value="cardio">Cardio</SelectItem>
                    <SelectItem value="personalizado">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Duração estimada (min)</label>
                <Input type="number" placeholder="60" value={newWorkout.estimated_duration} onChange={e => setNewWorkout(p => ({ ...p, estimated_duration: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Descrição</label>
                <Textarea placeholder="Descrição opcional..." value={newWorkout.description} onChange={e => setNewWorkout(p => ({ ...p, description: e.target.value }))} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Exercícios</label>
                <Button size="sm" variant="outline" onClick={addExercise}><Plus className="w-3 h-3 mr-1" /> Adicionar</Button>
              </div>
              <div className="space-y-3">
                {exercises.map((ex, i) => (
                  <div key={i} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Exercício {i + 1}</span>
                      {exercises.length > 1 && (
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={() => removeExercise(i)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="col-span-2">
                        <Input placeholder="Nome do exercício *" value={ex.name ?? ''} onChange={e => updateExercise(i, 'name', e.target.value)} />
                      </div>
                      <Select value={ex.muscle_group ?? ''} onValueChange={v => updateExercise(i, 'muscle_group', v)}>
                        <SelectTrigger><SelectValue placeholder="Grupo muscular" /></SelectTrigger>
                        <SelectContent>
                          {MUSCLE_GROUPS.map(mg => <SelectItem key={mg} value={mg}>{MUSCLE_GROUP_LABELS[mg]}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Input type="number" placeholder="Séries" value={ex.sets ?? ''} onChange={e => updateExercise(i, 'sets', parseInt(e.target.value))} />
                      <Input placeholder="Reps (ex: 8-12)" value={ex.reps ?? ''} onChange={e => updateExercise(i, 'reps', e.target.value)} />
                      <Input type="number" placeholder="Carga (kg)" value={ex.weight ?? ''} onChange={e => updateExercise(i, 'weight', parseFloat(e.target.value))} />
                      <Input type="number" placeholder="Descanso (s)" value={ex.rest_seconds ?? ''} onChange={e => updateExercise(i, 'rest_seconds', parseInt(e.target.value))} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewWorkout(false)}>Cancelar</Button>
            <Button onClick={createWorkout} disabled={!newWorkout.name}>Criar Treino</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Log Workout Dialog */}
      <Dialog open={!!showLogWorkout} onOpenChange={() => setShowLogWorkout(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Treino</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Duração (minutos)</label>
              <Input type="number" placeholder="60" value={logData.duration_minutes} onChange={e => setLogData(p => ({ ...p, duration_minutes: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Observações</label>
              <Textarea placeholder="Como foi o treino?" value={logData.notes} onChange={e => setLogData(p => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogWorkout(null)}>Cancelar</Button>
            <Button
              onClick={() => {
                const workout = workouts.find(w => w.id === showLogWorkout)
                if (workout) logWorkout(workout.id, workout.name)
              }}
            >
              Confirmar Treino
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
