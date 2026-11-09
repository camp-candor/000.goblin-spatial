import { z } from 'zod'
import { StrictAxialCoordSchema } from '../../14.port.unit/val/port.model.js'

export const OpticalPerceptEvidenceSchema = z
    .object({
        transmissionBps: z.number().int().min(0).max(10000),
        pathLength: z.number().int().min(0),
        severedAtCell: z.number().int().optional(),
    })
    .strict()

export const AcousticPerceptEvidenceSchema = z
    .object({
        arrivingIntensityCdb: z.number().int().min(0).max(12000),
        ambientNoiseFloorCdb: z.number().int().min(0).max(12000),
        snrMarginCdb: z.number().int().min(-12000).max(12000),
        hops: z.number().int().min(0),
    })
    .strict()

export const PerceptCandidateSchema = z
    .object({
        channel: z.enum(['OPTICAL', 'ACOUSTIC']),
        sourceCoord: StrictAxialCoordSchema,
        sourcePacked: z.number().int(),
        observerCoord: StrictAxialCoordSchema,
        observerPacked: z.number().int(),
        qualityPermille: z.number().int().min(0).max(1000),
        arrivalBearing: z.number().int().min(0).max(5).nullable(),
        isOccluded: z.boolean(),
        opticalEvidence: OpticalPerceptEvidenceSchema.optional(),
        acousticEvidence: AcousticPerceptEvidenceSchema.optional(),
        topologyRootHash: z
            .string()
            .length(64)
            .regex(/^[0-9a-f]{64}$/)
            .optional(),
        overlayRootHash: z
            .string()
            .length(64)
            .regex(/^[0-9a-f]{64}$/)
            .optional(),
    })
    .strict()

export const ReceiptBatchSummarySchema = z
    .object({
        totalCandidates: z.number().int().min(0),
        opticalCandidates: z.number().int().min(0),
        acousticCandidates: z.number().int().min(0),
        occludedCount: z.number().int().min(0),
        averageQualityPermille: z.number().int().min(0).max(1000),
    })
    .strict()
