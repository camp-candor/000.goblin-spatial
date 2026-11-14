import type ClockBit from './clock.bit.js'
import { z } from 'zod'

export type DiurnalDaypart = 'DAWN' | 'MORNING' | 'AFTERNOON' | 'DUSK' | 'NIGHT'

export interface DiurnalAttenuationProfile {
    readonly daypart: DiurnalDaypart
    readonly ambientLuminanceBps: number
    readonly opticalRangeScaleBps: number
    readonly diurnalNoiseDeltaCdb: number
}

export interface SpatialClockSnapshot {
    readonly startDate: string
    readonly startTime: string
    readonly clockTimeHm: string
    readonly isoDate: string
    readonly hour: number
    readonly minute: number
    readonly second: number
    readonly daypart: DiurnalDaypart
    readonly timezoneLabel: string
    readonly tickSeconds: number
    readonly diurnalProfile: DiurnalAttenuationProfile
}

export default interface Clock {
    activeSnapshot: SpatialClockSnapshot | null
    activeDiurnalProfile: DiurnalAttenuationProfile | null
}

export const ScheduledSpatialAppointmentSchema = z
    .object({
        beatId: z.string().min(1).max(128),
        title: z.string().min(1).max(256),
        isoDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        startTimeHm: z.string().regex(/^\d{2}:\d{2}$/),
        beatCategory: z.string().min(1).max(64),
        locationId: z.string().min(1).max(128).optional(),
        participantIds: z.array(z.string().min(1).max(128)).max(256).optional(),
        reserveCooldownTicks: z.number().int().min(0).max(1000),
    })
    .strict()

export type ScheduledSpatialAppointment = z.infer<
    typeof ScheduledSpatialAppointmentSchema
>

export interface AppointmentDiurnalWindow {
    readonly beatId: string
    readonly title: string
    readonly isoDate: string
    readonly startTimeHm: string
    readonly beatCategory: string
    readonly locationId?: string
    readonly daypart: DiurnalDaypart
    readonly diurnalProfile: DiurnalAttenuationProfile
    readonly reserveCooldownTicks: number
}
