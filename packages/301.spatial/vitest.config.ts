import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        // Spatial microbenchmarks (raycast, batch, invoker) are sensitive to
        // multi-worker CPU contention; run test files sequentially.
        fileParallelism: false,
    },
})
