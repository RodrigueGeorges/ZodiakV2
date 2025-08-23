import { cn } from '../utils';

export const designUtils = {
  input: (className?: string) =>
    cn(
      'w-full px-4 py-3 rounded-lg',
      'bg-white/5 backdrop-blur-lg',
      'border border-white/10',
      'text-white placeholder-gray-400',
      'focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50',
      'transition-all duration-200',
      className
    ),

  button: {
    primary: (className?: string) =>
      cn(
        'px-4 py-2 rounded-lg',
        'bg-gradient-to-r from-blue-400 to-blue-600',
        'text-white font-semibold',
        'transition-all duration-200',
        'hover:opacity-90',
        'focus:outline-none focus:ring-2 focus:ring-blue-400/50',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      ),
    secondary: (className?: string) =>
      cn(
        'px-4 py-2 rounded-lg',
        'bg-white/5 hover:bg-white/10',
        'text-white',
        'transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-white/50',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )
  }
};