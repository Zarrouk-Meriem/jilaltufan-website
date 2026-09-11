import { getSessionState, type SessionTiming } from './index'

export type JoinPolicy = 'always' | 'window' | 'email-only'

export type JoinGate = { policy: JoinPolicy; windowMinutes: number; now: Date }

/**
 * Whether a session's Zoom link may appear publicly right now.
 *   always     → whenever a link exists and the session is not cancelled/completed
 *   window     → from `windowMinutes` before start until the session ends
 *   email-only → never on the site
 * This is the only place the rule lives; the query layer applies it so the URL
 * is absent from the payload — and therefore from the HTML — when it is false.
 */
export function canShowJoinLink(session: SessionTiming, gate: JoinGate): boolean {
  if (gate.policy === 'email-only') return false
  const state = getSessionState(session, gate.now, gate.windowMinutes)
  if (state === 'cancelled' || state === 'completed') return false
  if (gate.policy === 'always') return true
  return state === 'starting-soon' || state === 'live'
}
