'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Re-renders the page (server-side) when the next session-state boundary passes,
 * so "upcoming" → "starting soon" → "live" → "completed" flips without a reload
 * and without polling. `inMs` is computed on the server from the sessions shown.
 */
export function RefreshAtBoundary({ inMs }: { inMs: number | null }) {
  const router = useRouter()
  useEffect(() => {
    if (inMs === null) return
    const id = setTimeout(
      () => router.refresh(),
      Math.max(1_000, Math.min(inMs + 500, 2_147_000_000)),
    )
    return () => clearTimeout(id)
  }, [inMs, router])
  return null
}
