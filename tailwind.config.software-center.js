/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./public/download.html",
    "./public/software-center.js"
  ],
  theme: {
    extend: {
      colors: {
        background: '#07090E',
        surface: '#0F1420',
        accent: {
          cyan: '#00F2FE',
          blue: '#06B6D4',
          indigo: '#4F46E5',
          violet: '#7C3AED'
        }
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Display',
          'SF Pro Text',
          'PingFang SC',
          'Hiragino Sans GB',
          'Microsoft YaHei',
          'ui-sans-serif',
          'system-ui',
          'sans-serif'
        ],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace']
      },
      lineHeight: {
        golden: '1.618'
      }
    }
  },
  safelist: [
    'md:grid-cols-1',
    'md:grid-cols-2',
    'md:grid-cols-3',
    'md:col-span-4',
    'md:col-span-6',
    'max-w-md',
    'mx-auto',
    'ring-1',
    'hidden',
    'rotate-180',
    'btn-shimmer',
    'z-[100]'
  ]
};
