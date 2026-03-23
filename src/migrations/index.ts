import * as migration_20260319_045530_add_header_global from './20260319_045530_add_header_global'

export const migrations = [
  {
    up: migration_20260319_045530_add_header_global.up,
    down: migration_20260319_045530_add_header_global.down,
    name: '20260319_045530_add_header_global',
  },
]
