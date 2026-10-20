import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        name: 'packages/001.spatial',
        globals: true,
        environment: 'node',
    },
})
