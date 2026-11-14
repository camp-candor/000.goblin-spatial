import { z } from 'zod'
import IncidentBit from './incident.bit.js'

export default interface Incident {
    lastIncidentReport?: unknown
    incidentReceiptCount?: number
}

export const AxialCoordSchema = z
    .object({
        q: z.number().int(),
        r: z.number().int(),
        s: z.number().int(),
    })
    .strict()
    .refine((v) => v.q + v.r + v.s === 0, {
        message: 'AXIAL_INVARIANT_VIOLATION',
    })

export const IncidentActorInputSchema = z
    .object({
        actorId: z.string().min(1).max(128),
        coord: AxialCoordSchema,
    })
    .strict()

export const IncidentWitnessInputSchema = z
    .object({
        locationId: z.string().min(1).max(128),
        originCoord: AxialCoordSchema,
        actors: z.array(IncidentActorInputSchema).min(1).max(256),
        eventSeverityBps: z.number().int().min(0).max(10000).optional(),
        startDate: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .optional(),
        startTime: z
            .string()
            .regex(/^\d{2}:\d{2}(:\d{2})?$/)
            .optional(),
        startTimeHm: z
            .string()
            .regex(/^\d{2}:\d{2}$/)
            .optional(),
        opaqueCells: z.array(AxialCoordSchema).max(1024).optional(),
        acousticSourceCdb: z.number().int().min(0).max(12000).optional(),
        ambientNoiseFloorCdb: z.number().int().min(0).max(12000).optional(),
    })
    .strict()

export type IncidentActorInput = z.infer<typeof IncidentActorInputSchema>
export type IncidentWitnessInput = z.infer<typeof IncidentWitnessInputSchema>

export const IncidentWitnessEvaluationSchema = z
    .object({
        actorId: z.string().min(1),
        coord: AxialCoordSchema,
        distanceHex: z.number().int().min(0),
        sawEvent: z.boolean(),
        heardEvent: z.boolean(),
        occlusionReason: z.string().min(1),
        transmissionBps: z.number().int().min(0).max(10000),
        effectiveTransmissionBps: z.number().int().min(0).max(10000),
        arrivingIntensityCdb: z.number().int(),
        snrMarginCdb: z.number().int(),
    })
    .strict()

export type IncidentWitnessEvaluation = z.infer<
    typeof IncidentWitnessEvaluationSchema
>

export const DiurnalProfileSchema = z
    .object({
        daypart: z.enum(['DAWN', 'MORNING', 'AFTERNOON', 'DUSK', 'NIGHT']),
        ambientLuminanceBps: z.number().int().min(0).max(10000),
        opticalRangeScaleBps: z.number().int().min(0).max(10000),
        diurnalNoiseDeltaCdb: z.number().int(),
    })
    .strict()

export const SpatialIncidentReportSchema = z
    .object({
        locationId: z.string().min(1),
        originCoord: AxialCoordSchema,
        clockTimeHm: z.string().regex(/^\d{2}:\d{2}$/),
        diurnalDaypart: z.enum([
            'DAWN',
            'MORNING',
            'AFTERNOON',
            'DUSK',
            'NIGHT',
        ]),
        diurnalProfile: DiurnalProfileSchema,
        witnesses: z.array(IncidentWitnessEvaluationSchema),
        visibleWitnessIds: z.array(z.string()),
        audibleWitnessIds: z.array(z.string()),
    })
    .strict()

export interface SpatialIncidentReport {
    readonly locationId: string
    readonly originCoord: {
        readonly q: number
        readonly r: number
        readonly s: number
    }
    readonly clockTimeHm: string
    readonly diurnalDaypart: 'DAWN' | 'MORNING' | 'AFTERNOON' | 'DUSK' | 'NIGHT'
    readonly diurnalProfile: {
        readonly daypart: 'DAWN' | 'MORNING' | 'AFTERNOON' | 'DUSK' | 'NIGHT'
        readonly ambientLuminanceBps: number
        readonly opticalRangeScaleBps: number
        readonly diurnalNoiseDeltaCdb: number
    }
    readonly witnesses: ReadonlyArray<{
        readonly actorId: string
        readonly coord: {
            readonly q: number
            readonly r: number
            readonly s: number
        }
        readonly distanceHex: number
        readonly sawEvent: boolean
        readonly heardEvent: boolean
        readonly occlusionReason: string
        readonly transmissionBps: number
        readonly effectiveTransmissionBps: number
        readonly arrivingIntensityCdb: number
        readonly snrMarginCdb: number
    }>
    readonly visibleWitnessIds: readonly string[]
    readonly audibleWitnessIds: readonly string[]
}

export const SpatialEventStageBriefSchema = z
    .object({
        sluglineToken: z
            .string()
            .min(1)
            .max(256)
            .regex(/^[\x20-\x7E]*$/),
        intExt: z.enum(['INT.', 'EXT.']),
        lightingActionLine: z
            .string()
            .min(1)
            .max(512)
            .regex(/^[\x20-\x7E]*$/),
        acousticActionLine: z
            .string()
            .min(1)
            .max(512)
            .regex(/^[\x20-\x7E]*$/),
        blockingBeats: z.array(
            z
                .string()
                .min(1)
                .max(512)
                .regex(/^[\x20-\x7E]*$/),
        ),
        witnessParentheticalHint: z
            .string()
            .min(1)
            .max(256)
            .regex(/^[\x20-\x7E]*$/),
        exitTransitionHint: z
            .string()
            .min(1)
            .max(64)
            .regex(/^[\x20-\x7E]*$/),
    })
    .strict()

export type SpatialEventStageBrief = z.infer<
    typeof SpatialEventStageBriefSchema
>

export interface StageBriefLocationSpec {
    readonly locationId: string
    readonly locationName: string
    readonly isExterior?: boolean
    readonly acousticFloorCdb?: number
}

export type { IncidentBit }
