import { z } from 'zod'
import { Sha256HashSchema } from '../../19.ledger.unit/val/ledger.model.js'

export const BatchQueryEnvelopeSchema = z
    .object({
        batchId: z
            .string()
            .min(1, { message: '[BATCH_ID_EMPTY] batchId cannot be empty' }),
        queries: z.record(z.string().min(1), z.unknown()),
    })
    .strict()

export const BatchExecutionSummarySchema = z
    .object({
        totalQueries: z
            .number()
            .int({
                message: '[FLOAT_PROHIBITED] totalQueries must be an integer',
            })
            .nonnegative(),
        succeededCount: z
            .number()
            .int({
                message: '[FLOAT_PROHIBITED] succeededCount must be an integer',
            })
            .nonnegative(),
        failedCount: z
            .number()
            .int({
                message: '[FLOAT_PROHIBITED] failedCount must be an integer',
            })
            .nonnegative(),
        totalDurationMicros: z
            .number()
            .int({
                message:
                    '[FLOAT_PROHIBITED] totalDurationMicros must be an integer',
            })
            .nonnegative(),
        averageDurationMicros: z
            .number()
            .int({
                message:
                    '[FLOAT_PROHIBITED] averageDurationMicros must be an integer',
            })
            .nonnegative(),
        batchAuditHash: Sha256HashSchema,
    })
    .strict()

export const BatchExecutionResultSchema = z
    .object({
        ok: z.boolean(),
        batchId: z.string().min(1),
        summary: BatchExecutionSummarySchema,
        receipts: z.record(z.string().min(1), z.unknown()),
    })
    .strict()

export type ValidatedBatchQueryEnvelope = z.infer<
    typeof BatchQueryEnvelopeSchema
>
export type ValidatedBatchExecutionSummary = z.infer<
    typeof BatchExecutionSummarySchema
>
export type ValidatedBatchExecutionResult = z.infer<
    typeof BatchExecutionResultSchema
>
