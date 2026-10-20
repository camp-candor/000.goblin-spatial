import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
    'apps/worker/vitest.config.ts',
    'packages/100.agent/vitest.config.ts',
    'packages/001.spatial/vitest.config.ts',
])
