'use client'

import { useAppStore } from '@/store'
import { Menu, Bell } from 'lucide-react'
import { ThemeToggle } from './theme-toggle'
import { UserMenu } from './user-menu'

interface NavbarProps {
  title?: string
}

export function Navbar({ title }: NavbarProps) {
  const { setSidebarOpen, sidebarOpen } = useAppStore()

  return (
    <header className="h-16 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        {title && (
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 hidden sm:block">{title}</h1>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors relative">
          <Bell className="w-5 h-5" />
        </button>
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  )
}
