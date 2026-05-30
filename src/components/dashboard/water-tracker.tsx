'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Droplets, Plus } from 'lucide-react'
import { getTodayString } from '@/lib/utils'

interface WaterTrackerProps {
  currentMl: number
  goalMl: number
}

const WATER_OPTIONS = [150, 200, 250, 300, 500]

export function WaterTracker({ currentMl, goalMl }: WaterTrackerProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const percentage = Math.min((currentMl / goalMl) * 100, 100)
  const liters = (currentMl / 1000).toFixed(1)
  const goalLiters = (goalMl / 1000).toFixed(1)

  async function addWater(ml: number) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('water_logs').insert({
      user_id: user.id,
      date: getTodayString(),
      amount_ml: ml,
    })

    startTransition(() => router.refresh())
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Hidratação</CardTitle>
          <Droplets className="w-4 h-4 text-blue-500" />
        </div>
      </CardHeader>
      <CardContent>
        {/* Water Glass Visual */}
        <div className="flex items-end justify-center mb-4">
          <div className="relative w-20 h-32 border-2 border-blue-200 dark:border-blue-900 rounded-b-xl overflow-hidden">
            <div
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-500 to-blue-400 transition-all duration-500"
              style={{ height: `${percentage}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-white drop-shadow">{Math.round(percentage)}%</span>
            </div>
          </div>
        </div>

        <div className="text-center mb-4">
          <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{liters}L</span>
          <span className="text-sm text-gray-500 dark:text-gray-400"> / {goalLiters}L</span>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {WATER_OPTIONS.slice(0, 3).map(ml => (
            <Button
              key={ml}
              variant="outline"
              size="sm"
              className="text-xs h-8"
              onClick={() => addWater(ml)}
              disabled={isPending}
            >
              +{ml}ml
            </Button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-1.5 mt-1.5">
          {WATER_OPTIONS.slice(3).map(ml => (
            <Button
              key={ml}
              variant="outline"
              size="sm"
              className="text-xs h-8"
              onClick={() => addWater(ml)}
              disabled={isPending}
            >
              +{ml}ml
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
