import * as migration_20260911_104337_initial from './20260911_104337_initial'

export const migrations = [
  {
    up: migration_20260911_104337_initial.up,
    down: migration_20260911_104337_initial.down,
    name: '20260911_104337_initial',
  },
]
