import { getTranslations } from 'next-intl/server'
import { Loader } from '@/components/ui/Loader'

/**
 * Route loading state, re-exported from a segment's `loading.tsx`. Only segments
 * that never call `notFound()` get one: a loading boundary above a not-found page
 * streams the shell with a 200 before the 404 is known, which turns hard 404s
 * (the catch-all, unknown slugs) into soft ones.
 */
export async function RouteLoading() {
  const t = await getTranslations('common')
  return (
    <div className="route-loading container-site flex min-h-[60dvh] items-center justify-center py-20">
      <Loader size="lg" label={t('loading')} />
    </div>
  )
}
