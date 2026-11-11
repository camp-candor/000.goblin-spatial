import { Hono } from 'hono'
import { EdgeSpatialAdapter } from './spatial/inProcessAdapter.js'

export interface Env {
    ENVIRONMENT?: string
    GATEWAY_SECRET?: string
}

const app = new Hono<{ Bindings: Env }>()
const spatialAdapter = new EdgeSpatialAdapter()

// Health Check
app.get('/health', (c) => {
    return c.json({
        status: 'HEALTHY',
        service: 'goblin-spatial-edge-worker',
        kernelVersion: spatialAdapter.kernelVersion,
        timestampMs: Date.now(),
    })
})

app.get('/spatial/health', (c) => {
    return c.text(
        '>> [SPATIAL::EDGE] Goblin Spatial Edge Oracle Online. Version: ' +
            spatialAdapter.kernelVersion,
    )
})

// Single Spatial Query Endpoint
app.post('/spatial/query', async (c) => {
    try {
        const body = await c.req.json()
        const topologyHash = c.req.header('X-Topology-Hash')
        const overlayHash = c.req.header('X-Overlay-Hash')

        const receipt = await spatialAdapter.evaluateQuery(body, {
            topologyHash: topologyHash || undefined,
            overlayHash: overlayHash || undefined,
        })

        return c.json(receipt, receipt.ok ? 200 : 400)
    } catch (err: any) {
        return c.json(
            {
                ok: false,
                failureCode: 'SCHEMA_BREACH',
                error: err.message || 'MALFORMED_JSON_REQUEST',
            },
            400,
        )
    }
})

// Batch Spatial Aggregation Endpoint
app.post('/spatial/batch', async (c) => {
    try {
        const body = await c.req.json()
        if (!body || !body.batchId || typeof body.queries !== 'object') {
            return c.json(
                {
                    ok: false,
                    error: '[SCHEMA_BREACH] Missing batchId or queries map',
                },
                400,
            )
        }

        const batchResult = await spatialAdapter.evaluateBatch(body)
        return c.json(batchResult, batchResult.ok ? 200 : 207)
    } catch (err: any) {
        return c.json(
            { ok: false, error: err.message || 'MALFORMED_BATCH_REQUEST' },
            400,
        )
    }
})

// Root Gateway Banner
app.get('/', (c) => {
    return c.text('GOBLIN SPATIAL EDGE ADAPTER ONLINE')
})

export default app
