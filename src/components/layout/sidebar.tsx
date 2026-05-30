'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Dumbbell, Utensils, TrendingUp, Bot,
  User, ChevronLeft, Activity
} from 'lucide-react'
import { useAppStore } from '@/store'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/treinos', label: 'Treinos', icon: Dumbbell },
  { href: '/alimentacao', label: 'Alimentação', icon: Utensils },
  { href: '/progresso', label: 'Progresso', icon: TrendingUp },
  { href: '/ia', label: 'Assistente IA', icon: Bot },
  { href: '/perfil', label: 'Perfil', icon: User },
]

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarOpen, setSidebarOpen } = useAppStore()

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={cn(
        'fixed left-0 top-0 z-30 h-screen flex flex-col bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 transition-all duration-300',
        sidebarOpen ? 'w-64' : 'w-16',
        'lg:relative lg:translate-x-0',
        !sidebarOpen && '-translate-x-full lg:translate-x-0'
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-800">
          {sidebarOpen && (
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-gray-900 dark:text-gray-100">FitHub</span>
            </Link>
          )}
          {!sidebarOpen && (
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center mx-auto">
              <Activity className="w-5 h-5 text-white" />
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:flex p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
          >
            <ChevronLeft className={cn('w-4 h-4 transition-transform duration-300', !sidebarOpen && 'rotate-180')} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                )}
                onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
              >
                <Icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-emerald-500')} />
                {sidebarOpen && <span>{label}</span>}
                {isActive && sidebarOpen && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        {sidebarOpen && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            <p className="text-xs text-gray-400 dark:text-gray-600 text-center">
              FitHub v1.0 &bull; Seu Hub de Saúde
            </p>
          </div>
        )}
      </aside>
    </>
  )
}
