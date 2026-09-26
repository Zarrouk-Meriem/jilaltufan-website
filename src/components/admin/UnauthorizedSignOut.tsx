'use client'
import { Button } from '@payloadcms/ui'
import React, { useState } from 'react'

/**
 * Signs out through the signed-in account's own collection — `/api/users/logout` refuses
 * anyone else — then opens the admin sign-in with a full load, so no cached admin state
 * still believes the old account is signed in.
 */
export function SignOutButton({ collection, label }: { collection: string; label: string }) {
  const [busy, setBusy] = useState(false)
  return (
    <Button
      size="large"
      disabled={busy}
      onClick={async () => {
        setBusy(true)
        await fetch(`/api/${collection}/logout`, { method: 'POST', credentials: 'include' }).catch(
          () => null,
        )
        // A full load on purpose: the admin's client state still holds the old account.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign('/admin/login')
      }}
    >
      {label}
    </Button>
  )
}
