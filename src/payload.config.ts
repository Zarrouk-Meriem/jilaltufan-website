import { postgresAdapter } from '@payloadcms/db-postgres'
import { importExportPlugin } from '@payloadcms/plugin-import-export'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { ar } from '@payloadcms/translations/languages/ar'
import { en } from '@payloadcms/translations/languages/en'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { ApplicationFiles } from './collections/ApplicationFiles'
import { Applications } from './collections/Applications'
import { ContactMessages } from './collections/ContactMessages'
import { Events } from './collections/Events'
import { Instructors } from './collections/Instructors'
import { Materials } from './collections/Materials'
import { Media } from './collections/Media'
import { MinbarPosts } from './collections/MinbarPosts'
import { Programs } from './collections/Programs'
import { Projects } from './collections/Projects'
import { Sessions } from './collections/Sessions'
import { Users } from './collections/Users'
import { AboutPage } from './globals/AboutPage'
import { Footer } from './globals/Footer'
import { HomePage } from './globals/HomePage'
import { InstructorsPage } from './globals/InstructorsPage'
import { Navigation } from './globals/Navigation'
import { SiteSettings } from './globals/SiteSettings'
import { StudentsPage } from './globals/StudentsPage'
import { emailAdapter } from './lib/payload/email'
import { storagePlugins } from './lib/payload/storage'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SITE_URL,
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    // The S3 storage plugin is enabled only when S3_* is set, so its client component
    // would be absent from an import map generated in an environment without it — and
    // Payload then renders the whole admin blank wherever the plugin *is* active (first
    // Vercel deploy). Pinning it here keeps the generated map identical in every env.
    dependencies: {
      s3ClientUploadHandler: {
        path: '@payloadcms/storage-s3/client#S3ClientUploadHandler',
        type: 'component',
      },
    },
    meta: {
      titleSuffix: ' — أكاديمية جيل الطوفان',
      icons: [{ rel: 'icon', type: 'image/svg+xml', url: '/brand/favicon.svg' }],
    },
    components: {
      graphics: {
        Logo: '@/components/admin/Logo#Logo',
        Icon: '@/components/admin/Icon#Icon',
      },
    },
    livePreview: {
      breakpoints: [
        { label: 'Mobile', name: 'mobile', width: 375, height: 812 },
        { label: 'Tablet', name: 'tablet', width: 768, height: 1024 },
        { label: 'Desktop', name: 'desktop', width: 1280, height: 900 },
      ],
    },
  },
  i18n: { supportedLanguages: { ar, en }, fallbackLanguage: 'ar' },
  localization: {
    locales: [
      { code: 'ar', label: 'العربية', rtl: true },
      { code: 'en', label: 'English' },
    ],
    defaultLocale: 'ar',
    fallback: true,
  },
  // Order = admin sidebar order within each group.
  collections: [
    Programs,
    Sessions,
    Instructors,
    Projects,
    MinbarPosts,
    Materials,
    Events,
    Applications,
    ApplicationFiles,
    ContactMessages,
    Users,
    Media,
  ],
  globals: [AboutPage, HomePage, StudentsPage, InstructorsPage, SiteSettings, Navigation, Footer],
  editor: lexicalEditor(),
  email: emailAdapter(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL || '' },
    migrationDir: path.resolve(dirname, 'migrations'),
  }),
  upload: { limits: { fileSize: 20 * 1024 * 1024 } },
  sharp,
  plugins: [
    importExportPlugin({
      collections: [
        { slug: 'applications', import: false },
        { slug: 'contact-messages', import: false },
      ],
    }),
    // After the import/export plugin, so its `exports`/`imports` upload collections exist
    // when the storage adapter attaches (it silently skips collections it cannot find).
    ...storagePlugins(),
  ],
})
