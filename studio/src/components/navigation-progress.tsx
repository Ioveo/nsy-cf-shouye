import { useRouterState } from '@tanstack/react-router'

export function NavigationProgress() {
  const state = useRouterState()
  if (state.status !== 'pending') return null

  return (
    <div className='fixed top-0 left-0 right-0 z-50 h-0.5 bg-primary animate-pulse' />
  )
}
