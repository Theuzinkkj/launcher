'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Dumbbell, Utensils, TrendingUp, Bot, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/treinos', label: 'Treinos', icon: Dumbbell },
  { href: '/alimentacao', label: 'Alimentos', icon: Utensils },
  { href: '/progresso', label: 'Progresso', icon: TrendingUp },
  { href: '/ia', label: 'IA', icon: Bot },
  { href: '/perfil', label: 'Perfil', icon: User },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 safe-area-pb">
      <div className="flex items-stretch h-16">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors',
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-gray-500 dark:text-gray-400'
              )}
            >
              <div className={cn(
                'w-8 h-5 flex items-center justify-center rounded-full transition-all',
                isActive && 'bg-emerald-100 dark:bg-emerald-900/30'
              )}>
                <Icon className={cn('w-4 h-4', isActive && 'text-emerald-600 dark:text-emerald-400')} />
              </div>
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
