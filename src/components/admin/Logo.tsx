import React from 'react'

/** Admin login/branding lockup. Theme-aware: ink wordmark on light, white on dark. */
export function Logo() {
  return (
    <span className="jaa-admin-logo" aria-label="أكاديمية جيل الطوفان" role="img">
      <img className="jaa-admin-logo__light" src="/brand/logo.svg" alt="" />
      <img className="jaa-admin-logo__dark" src="/brand/logo-on-dark.svg" alt="" />
    </span>
  )
}
