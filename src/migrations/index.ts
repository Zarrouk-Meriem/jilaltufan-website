import * as migration_20260911_112709_initial from './20260911_112709_initial'
import * as migration_20260915_203151_windows from './20260915_203151_windows'
import * as migration_20260915_204945_navigation_cta_optional from './20260915_204945_navigation_cta_optional'
import * as migration_20260916_120441_programs_projects_track from './20260916_120441_programs_projects_track'
import * as migration_20260917_204927_application_intake from './20260917_204927_application_intake'
import * as migration_20260917_212451_application_program_optional from './20260917_212451_application_program_optional'
import * as migration_20260921_152214_hero_cutout from './20260921_152214_hero_cutout'
import * as migration_20260921_185210_acceptance_email_sent_at from './20260921_185210_acceptance_email_sent_at'
import * as migration_20260922_075008_status_emails from './20260922_075008_status_emails'
import * as migration_20260922_124615_activity_log from './20260922_124615_activity_log'
import * as migration_20260922_135917_activity_auth_actions from './20260922_135917_activity_auth_actions'

export const migrations = [
  {
    up: migration_20260911_112709_initial.up,
    down: migration_20260911_112709_initial.down,
    name: '20260911_112709_initial',
  },
  {
    up: migration_20260915_203151_windows.up,
    down: migration_20260915_203151_windows.down,
    name: '20260915_203151_windows',
  },
  {
    up: migration_20260915_204945_navigation_cta_optional.up,
    down: migration_20260915_204945_navigation_cta_optional.down,
    name: '20260915_204945_navigation_cta_optional',
  },
  {
    up: migration_20260916_120441_programs_projects_track.up,
    down: migration_20260916_120441_programs_projects_track.down,
    name: '20260916_120441_programs_projects_track',
  },
  {
    up: migration_20260917_204927_application_intake.up,
    down: migration_20260917_204927_application_intake.down,
    name: '20260917_204927_application_intake',
  },
  {
    up: migration_20260917_212451_application_program_optional.up,
    down: migration_20260917_212451_application_program_optional.down,
    name: '20260917_212451_application_program_optional',
  },
  {
    up: migration_20260921_152214_hero_cutout.up,
    down: migration_20260921_152214_hero_cutout.down,
    name: '20260921_152214_hero_cutout',
  },
  {
    up: migration_20260921_185210_acceptance_email_sent_at.up,
    down: migration_20260921_185210_acceptance_email_sent_at.down,
    name: '20260921_185210_acceptance_email_sent_at',
  },
  {
    up: migration_20260922_075008_status_emails.up,
    down: migration_20260922_075008_status_emails.down,
    name: '20260922_075008_status_emails',
  },
  {
    up: migration_20260922_124615_activity_log.up,
    down: migration_20260922_124615_activity_log.down,
    name: '20260922_124615_activity_log',
  },
  {
    up: migration_20260922_135917_activity_auth_actions.up,
    down: migration_20260922_135917_activity_auth_actions.down,
    name: '20260922_135917_activity_auth_actions',
  },
]
