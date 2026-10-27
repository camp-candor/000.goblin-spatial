import { z } from 'zod'

/**
 * Centi-Decibels: Integer logarithmic sound pressure and structural attenuation.
 * 1 dB = 100 cdB; 60 dB = 6,000 cdB; 120 dB = 12,000 cdB.
 */
export const CentiDecibelsSchema = z
    .number()
    .int({ message: '[FLOAT_PROHIBITED] Acoustic cdB must be an integer' })
    .min(0, { message: '[OUT_OF_BOUNDS] Acoustic cdB cannot be negative' })

export type CentiDecibels = z.infer<typeof CentiDecibelsSchema>

/**
 * Acoustic Transmission Barrier Occluder Schema.
 * Evaluates structural acoustic loss additively across discrete topology edges.
 */
export const AcousticBarrierSchema = z
    .object({
        source_location_id: z
            .string()
            .regex(/^loc_[a-z0-9_]+$/, 'Invalid source location ID'),
        target_location_id: z
            .string()
            .regex(/^loc_[a-z0-9_]+$/, 'Invalid target location ID'),
        damping_cdb: CentiDecibelsSchema,
        snr_minimum_cdb: CentiDecibelsSchema.default(600), // Default 6.00 dB SNR threshold
    })
    .strict()

export type AcousticBarrier = z.infer<typeof AcousticBarrierSchema>
