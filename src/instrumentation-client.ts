// Runs in the browser before the app's client code hydrates (Next convention).
// Dev only: filters the hydration report caused by DOM-stamping extensions.
import { installExtensionNoiseFilter } from '@/lib/dev/extension-noise-filter'

if (process.env.NODE_ENV !== 'production') installExtensionNoiseFilter()
