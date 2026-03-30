'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Palette, Moon, Sun, Monitor } from 'lucide-react';

const themes = [
  {
    name: 'Dark',
    value: 'dark',
    icon: Moon,
    description: 'Deep dark theme',
    color: 'bg-slate-950'
  },
  {
    name: 'Light',
    value: 'light',
    icon: Sun,
    description: 'Clean light theme',
    color: 'bg-white'
  },
  {
    name: 'System',
    value: 'system',
    icon: Monitor,
    description: 'Follow system preference',
    color: 'bg-gray-100'
  }
];

export default function ThemeSelector() {
  const [currentTheme, setCurrentTheme] = useState('dark');

  useEffect(() => {
    // Load theme from localStorage or default to dark
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setCurrentTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (theme) => {
    const root = document.documentElement;

    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.setProperty('--background', '#020617');
      root.style.setProperty('--foreground', '#ffffff');
    } else if (theme === 'light') {
      root.classList.remove('dark');
      root.style.setProperty('--background', '#ffffff');
      root.style.setProperty('--foreground', '#000000');
    } else if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      applyTheme(systemTheme);
      return;
    }

    localStorage.setItem('theme', theme);
  };

  const handleThemeChange = (themeValue) => {
    setCurrentTheme(themeValue);
    applyTheme(themeValue);
  };

  return (
    <Card className="w-64 bg-slate-900 border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-white">
          <Palette className="h-5 w-5 text-blue-400" />
          Theme Selector
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {themes.map((theme) => {
          const Icon = theme.icon;
          const isActive = currentTheme === theme.value;

          return (
            <Button
              key={theme.value}
              variant={isActive ? "default" : "ghost"}
              className={`w-full justify-start gap-3 h-auto p-3 ${
                isActive
                  ? 'bg-orange-500 hover:bg-orange-600 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
              onClick={() => handleThemeChange(theme.value)}
            >
              <div className={`w-4 h-4 rounded-full ${theme.color} border border-slate-600`} />
              <div className="flex items-center gap-2 flex-1">
                <Icon className="h-4 w-4" />
                <div className="text-left">
                  <div className="font-medium">{theme.name}</div>
                  <div className="text-xs opacity-70">{theme.description}</div>
                </div>
              </div>
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}
