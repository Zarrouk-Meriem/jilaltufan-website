// Runs in the browser before the app's client code hydrates (Next convention).
// Dev only: keeps browser-extension noise out of the Next dev overlay —
// hydration reports caused by DOM stamping, and errors thrown inside extension scripts.
import {
  installExtensionErrorFilter,
  installExtensionNoiseFilter,
} from '@/lib/dev/extension-noise-filter'

if (process.env.NODE_ENV !== 'production') {
  installExtensionNoiseFilter()
  installExtensionErrorFilter()
}
