'use client'

import { Button } from '@/components/ui/Button'

/** The browser's own print dialog: print the sheet, or choose «Save as PDF». */
export function PrintButton({ label }: { label: string }) {
  return <Button onClick={() => window.print()}>{label}</Button>
}
