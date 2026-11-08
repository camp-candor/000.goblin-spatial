import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        name: 'packages/301.spatial',
        globals: true,
        environment: 'node',
    },
})
