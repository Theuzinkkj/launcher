import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateBMI(weight: number, height: number): number {
  const heightInMeters = height / 100
  return weight / (heightInMeters * heightInMeters)
}

export function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return 'Abaixo do peso'
  if (bmi < 25) return 'Peso normal'
  if (bmi < 30) return 'Sobrepeso'
  if (bmi < 35) return 'Obesidade grau I'
  if (bmi < 40) return 'Obesidade grau II'
  return 'Obesidade grau III'
}

export function formatDate(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function formatDateShort(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

export function getWeekDates(): string[] {
  const dates = []
  const today = new Date()
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    dates.push(date.toISOString().split('T')[0])
  }
  return dates
}

export function getMonthDates(months = 3): string[] {
  const dates = []
  const today = new Date()
  for (let i = months * 30; i >= 0; i -= 7) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    dates.push(date.toISOString().split('T')[0])
  }
  return dates
}

export function calculateCalorieGoal(
  weight: number,
  height: number,
  age: number,
  sex: string,
  goal: string
): number {
  // Harris-Benedict equation
  let bmr: number
  if (sex === 'masculino') {
    bmr = 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age
  } else {
    bmr = 447.593 + 9.247 * weight + 3.098 * height - 4.33 * age
  }

  // Moderate activity multiplier
  const tdee = bmr * 1.55

  if (goal === 'emagrecimento') return Math.round(tdee - 500)
  if (goal === 'hipertrofia') return Math.round(tdee + 300)
  if (goal === 'performance') return Math.round(tdee + 200)
  return Math.round(tdee)
}

export function mlToLiters(ml: number): string {
  return (ml / 1000).toFixed(1)
}

export function getProgressColor(value: number, max: number): string {
  const percentage = (value / max) * 100
  if (percentage >= 100) return 'text-green-500'
  if (percentage >= 75) return 'text-blue-500'
  if (percentage >= 50) return 'text-yellow-500'
  return 'text-red-500'
}

export function getDayOfWeek(date: string): string {
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const d = new Date(date + 'T12:00:00')
  return days[d.getDay()]
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
}
