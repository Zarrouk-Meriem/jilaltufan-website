import * as migration_20260911_112709_initial from './20260911_112709_initial'
import * as migration_20260915_203151_windows from './20260915_203151_windows'
import * as migration_20260915_204945_navigation_cta_optional from './20260915_204945_navigation_cta_optional'
import * as migration_20260916_120441_programs_projects_track from './20260916_120441_programs_projects_track'
import * as migration_20260917_204927_application_intake from './20260917_204927_application_intake'
import * as migration_20260917_212451_application_program_optional from './20260917_212451_application_program_optional'

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
]
