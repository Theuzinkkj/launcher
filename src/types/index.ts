export type Goal = 'emagrecimento' | 'hipertrofia' | 'manutencao' | 'performance'
export type ExperienceLevel = 'iniciante' | 'intermediario' | 'avancado'
export type Sex = 'masculino' | 'feminino' | 'outro'
export type MealType = 'cafe_da_manha' | 'almoco' | 'jantar' | 'lanche' | 'pre_treino' | 'pos_treino'
export type WorkoutType = 'A' | 'B' | 'C' | 'D' | 'E' | 'fullbody' | 'hiit' | 'cardio' | 'personalizado'
export type MuscleGroup = 'peito' | 'costas' | 'ombro' | 'biceps' | 'triceps' | 'pernas' | 'abdomen' | 'gluteos' | 'cardio'

export interface Profile {
  id: string
  name: string | null
  email: string | null
  avatar_url: string | null
  age: number | null
  sex: Sex | null
  height: number | null
  weight: number | null
  goal: Goal | null
  experience_level: ExperienceLevel | null
  available_days: string[]
  food_restrictions: string[]
  daily_calorie_goal: number
  daily_protein_goal: number
  daily_carb_goal: number
  daily_fat_goal: number
  daily_water_goal: number
  created_at: string
  updated_at: string
}

export interface Workout {
  id: string
  user_id: string
  name: string
  description: string | null
  muscle_groups: string[]
  type: WorkoutType
  estimated_duration: number | null
  is_template: boolean
  exercises?: Exercise[]
  created_at: string
  updated_at: string
}

export interface Exercise {
  id: string
  workout_id: string
  name: string
  muscle_group: string | null
  sets: number
  reps: string
  weight: number | null
  rest_seconds: number
  notes: string | null
  order_index: number
  created_at: string
}

export interface WorkoutLog {
  id: string
  user_id: string
  workout_id: string | null
  workout_name: string
  date: string
  duration_minutes: number | null
  notes: string | null
  completed: boolean
  exercise_logs?: ExerciseLog[]
  created_at: string
}

export interface ExerciseLog {
  id: string
  workout_log_id: string
  exercise_name: string
  muscle_group: string | null
  sets_completed: number | null
  reps_completed: string | null
  weight: number | null
  notes: string | null
  created_at: string
}

export interface PersonalRecord {
  id: string
  user_id: string
  exercise_name: string
  weight: number | null
  reps: number | null
  date: string
  notes: string | null
  created_at: string
}

export interface Meal {
  id: string
  user_id: string
  name: string
  meal_type: MealType
  date: string
  total_calories: number
  total_protein: number
  total_carbs: number
  total_fat: number
  notes: string | null
  food_items?: FoodItem[]
  created_at: string
}

export interface FoodItem {
  id: string
  meal_id: string
  name: string
  quantity: number
  unit: string
  calories: number
  protein: number
  carbs: number
  fat: number
  created_at: string
}

export interface WaterLog {
  id: string
  user_id: string
  date: string
  amount_ml: number
  logged_at: string
}

export interface BodyMeasurement {
  id: string
  user_id: string
  date: string
  weight: number | null
  body_fat_percentage: number | null
  chest: number | null
  waist: number | null
  hips: number | null
  left_arm: number | null
  right_arm: number | null
  left_thigh: number | null
  right_thigh: number | null
  left_calf: number | null
  right_calf: number | null
  notes: string | null
  created_at: string
}

export interface AiConversation {
  id: string
  user_id: string
  title: string | null
  messages?: AiMessage[]
  ai_messages?: AiMessage[]
  created_at: string
  updated_at: string
}

export interface AiMessage {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface DailyStats {
  calories_consumed: number
  calories_remaining: number
  protein: number
  carbs: number
  fat: number
  water_consumed: number
  workouts_completed: number
}

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  cafe_da_manha: 'Café da Manhã',
  almoco: 'Almoço',
  jantar: 'Jantar',
  lanche: 'Lanche',
  pre_treino: 'Pré-Treino',
  pos_treino: 'Pós-Treino',
}

export const GOAL_LABELS: Record<Goal, string> = {
  emagrecimento: 'Emagrecimento',
  hipertrofia: 'Hipertrofia',
  manutencao: 'Manutenção',
  performance: 'Performance',
}

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  peito: 'Peito',
  costas: 'Costas',
  ombro: 'Ombro',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  pernas: 'Pernas',
  abdomen: 'Abdômen',
  gluteos: 'Glúteos',
  cardio: 'Cardio',
}

export const EXPERIENCE_LABELS: Record<ExperienceLevel, string> = {
  iniciante: 'Iniciante',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
}
