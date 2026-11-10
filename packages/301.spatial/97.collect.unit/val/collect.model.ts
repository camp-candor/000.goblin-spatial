import { z } from 'zod'
import { Sha256HashSchema } from '../../19.ledger.unit/val/ledger.model.js'

export const BatchQueryEnvelopeSchema = z
    .object({
        batchId: z.string().min(1),
        queries: z.record(z.string().min(1), z.unknown()),
    })
    .strict()

export const BatchExecutionSummarySchema = z
    .object({
        totalQueries: z.number().int().min(0),
        succeededCount: z.number().int().min(0),
        failedCount: z.number().int().min(0),
        totalDurationMicros: z.number().int().min(0),
        averageDurationMicros: z.number().int().min(0),
        batchAuditHash: Sha256HashSchema,
    })
    .strict()

export const BatchExecutionResultSchema = z
    .object({
        batchId: z.string().min(1),
        receipts: z.record(z.string().min(1), z.unknown()),
        summary: BatchExecutionSummarySchema,
    })
    .strict()
