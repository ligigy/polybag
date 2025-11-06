/**
 * ThemeProvider 组件
 * Theme Provider Component for Next.js with HeroUI
 *
 * 此组件为整个应用提供主题支持，包括明暗主题切换和持久化
 */

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { HeroUIProvider } from '@heroui/react';
import { useTheme as useNextTheme } from 'next-themes';

// 主题类型定义
export type Theme = 'light' | 'dark' | 'system';

// Theme Context 接口
interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isDark: boolean;
  isLight: boolean;
}

// 创建 Context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// ThemeProvider Props 接口
interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
}

// 默认主题配置
const defaultStorageKey = 'polybag-ui-theme';

// 本地存储键名映射
const themeStorageKeyMap: Record<string, string> = {
  'polybag-ui-theme': 'polybag-ui-theme',
  default: defaultStorageKey,
};

/**
 * ThemeProvider 组件
 *
 * @param children - 子组件
 * @param defaultTheme - 默认主题 (默认: 'system')
 * @param storageKey - 存储键名 (默认: 'polybag-ui-theme')
 * @param enableSystem - 是否启用系统主题 (默认: true)
 * @param disableTransitionOnChange - 主题切换时是否禁用过渡动画 (默认: false)
 */
export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = defaultStorageKey,
  enableSystem = true,
  disableTransitionOnChange = false,
}: ThemeProviderProps) {
  const [mounted, setMounted] = useState(false);

  // 使用 next-themes 管理主题
  const { theme, setTheme, resolvedTheme, systemTheme } = useNextTheme();

  // 确保组件已挂载（避免 hydration 错误）
  useEffect(() => {
    setMounted(true);
  }, []);

  // 计算实际应用的主题（考虑系统主题）
  const resolvedThemeValue = resolvedTheme || (theme === 'system' ? systemTheme : theme) || 'light';

  // 主题切换函数
  const toggleTheme = () => {
    setTheme(resolvedThemeValue === 'dark' ? 'light' : 'dark');
  };

  // 判断是否为暗色主题
  const isDark = resolvedThemeValue === 'dark';
  const isLight = resolvedThemeValue === 'light';

  // Context 值
  const contextValue: ThemeContextType = {
    theme: (theme as Theme) || defaultTheme,
    resolvedTheme: resolvedThemeValue as 'light' | 'dark',
    setTheme,
    toggleTheme,
    isDark,
    isLight,
  };

  // 始终提供 context，即使在服务端渲染或组件未挂载时
  return (
    <ThemeContext.Provider value={contextValue}>
      <HeroUIProvider>
        <div className={`${resolvedThemeValue} ${!mounted ? 'theme-transition-disabled' : ''}`}>
          {children}
        </div>
      </HeroUIProvider>
    </ThemeContext.Provider>
  );
}

/**
 * useTheme Hook
 *
 * 在子组件中使用此 Hook 获取主题状态和操作方法
 *
 * @returns ThemeContextType - 主题上下文
 * @throws Error - 如果在 ThemeProvider 外部使用
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}

/**
 * 获取系统主题偏好
 *
 * @returns 'light' | 'dark' - 系统主题
 */
export function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * 检测是否为暗色主题
 *
 * @param theme - 当前主题
 * @returns boolean - 是否为暗色主题
 */
export function isDarkTheme(theme: Theme | 'light' | 'dark'): boolean {
  return theme === 'dark' || (theme === 'system' && getSystemTheme() === 'dark');
}

export default ThemeProvider;
