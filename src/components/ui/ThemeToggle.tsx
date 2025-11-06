/**
 * ThemeToggle 组件
 * Theme Toggle Button Component
 *
 * 提供明暗主题切换功能的按钮组件
 */

'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@heroui/react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { Sun, Moon, Monitor } from 'lucide-react';

export interface ThemeToggleProps {
  /**
   * 按钮大小
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * 自定义类名
   */
  className?: string;
  /**
   * 是否显示文字标签
   */
  showLabel?: boolean;
}

/**
 * ThemeToggle 组件
 *
 * 在明暗主题之间切换，支持三种模式：
 * - light: 明亮主题
 * - dark: 暗色主题
 * - system: 跟随系统
 *
 * @param props - ThemeToggle props
 * @returns JSX.Element
 */
export function ThemeToggle({ size = 'sm', className, showLabel = false }: ThemeToggleProps) {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // 确保组件已在客户端挂载 (用于避免 hydration 不匹配)
  useEffect(() => {
    setMounted(true);
  }, []);

  const getThemeIcon = () => {
    if (theme === 'system') return <Monitor className="h-4 w-4" />;
    return theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />;
  };

  const getThemeLabel = () => {
    if (showLabel) {
      switch (theme) {
        case 'light':
          return '明亮';
        case 'dark':
          return '暗色';
        case 'system':
          return '跟随系统';
        default:
          return '切换主题';
      }
    }
    return null;
  };

  const cycleTheme = () => {
    const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  // 在服务端或客户端挂载前，显示占位符
  if (!mounted) {
    return (
      <Button variant="ghost" size={size} className={className} disabled aria-label="主题切换">
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={cycleTheme}
      className={className}
      aria-label={`切换到下一个主题模式 (当前: ${theme})`}
      title={`当前主题: ${theme === 'light' ? '明亮' : theme === 'dark' ? '暗色' : '跟随系统'}`}
    >
      {getThemeIcon()}
      {showLabel && <span className="ml-2">{getThemeLabel()}</span>}
    </Button>
  );
}

export default ThemeToggle;
