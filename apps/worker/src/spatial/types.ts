import { z } from 'zod'

export type SpatialQueryType =
    'RAYCAST' | 'BOUNDED_PATH' | 'REACHABILITY' | 'DISPLACEMENT'

export const EdgeAxialCoordSchema = z
    .object({
        q: z.number().int({
            message: '[FLOAT_PROHIBITED] Coordinate q must be an integer',
        }),
        r: z.number().int({
            message: '[FLOAT_PROHIBITED] Coordinate r must be an integer',
        }),
        s: z.number().int({
            message: '[FLOAT_PROHIBITED] Coordinate s must be an integer',
        }),
    })
    .strict()
    .refine((data) => data.q + data.r + data.s === 0, {
        message:
            '[CUBIC_INVARIANT_BREACH] Coordinate must satisfy q + r + s === 0',
    })

export type EdgeAxialCoord = z.infer<typeof EdgeAxialCoordSchema>

export const EdgeSpatialAuditQuadrupleSchema = z
    .object({
        topologyHash: z.string().regex(/^[a-f0-9]{64}$/),
        overlayHash: z.string().regex(/^[a-f0-9]{64}$/),
        queryHash: z.string().regex(/^[a-f0-9]{64}$/),
        receiptHash: z.string().regex(/^[a-f0-9]{64}$/),
    })
    .strict()

export type EdgeSpatialAuditQuadruple = z.infer<
    typeof EdgeSpatialAuditQuadrupleSchema
>

export interface EdgeExecutionReceipt<T = unknown> {
    readonly ok: boolean
    readonly queryType: SpatialQueryType
    readonly kernelVersion: string
    readonly payload: T
    readonly cellsExpanded: number
    readonly failureCode?:
        'BUDGET_EXCEEDED' | 'UNREACHABLE' | 'OCCLUDED' | 'SCHEMA_BREACH'
    readonly executionMicros: number
}

export interface EdgeBatchExecutionResult<T = unknown> {
    readonly ok: boolean
    readonly batchId: string
    readonly summary: {
        readonly totalQueries: number
        readonly succeededCount: number
        readonly failedCount: number
        readonly totalDurationMicros: number
        readonly averageDurationMicros: number
        readonly batchAuditHash: string
    }
    readonly receipts: Readonly<Record<string, EdgeExecutionReceipt<T>>>
}
