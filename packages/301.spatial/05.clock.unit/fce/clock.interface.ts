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

export type SpatialRecurrenceKind =
    | 'ONCE'
    | 'DAILY'
    | 'WEEKLY_MASK'
    | 'INTERVAL_DAYS'
    | 'LUNAR_PHASE'
    | 'SOLAR_SOLSTICE_EQUINOX'

export type SpatialBlackoutPolicy = 'SKIP' | 'DEFER_NEXT_VALID_DAY'

export type WeekdayToken = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN'

export type LunarPhaseToken =
    'NEW_MOON' | 'FIRST_QUARTER' | 'FULL_MOON' | 'LAST_QUARTER'

export type SolarEventToken =
    'SPRING_EQUINOX' | 'SUMMER_SOLSTICE' | 'AUTUMN_EQUINOX' | 'WINTER_SOLSTICE'

export const SpatialRecurrenceRuleSchema = z
    .object({
        recurrenceKind: z.enum([
            'ONCE',
            'DAILY',
            'WEEKLY_MASK',
            'INTERVAL_DAYS',
            'LUNAR_PHASE',
            'SOLAR_SOLSTICE_EQUINOX',
        ]),
        weeklyMask: z
            .array(z.enum(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']))
            .max(7)
            .optional(),
        intervalDays: z.number().int().min(1).max(365).optional(),
        lunarPhase: z
            .enum(['NEW_MOON', 'FIRST_QUARTER', 'FULL_MOON', 'LAST_QUARTER'])
            .optional(),
        solarEvent: z
            .enum([
                'SPRING_EQUINOX',
                'SUMMER_SOLSTICE',
                'AUTUMN_EQUINOX',
                'WINTER_SOLSTICE',
            ])
            .optional(),
        blackoutDates: z
            .array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
            .max(365)
            .optional(),
        blackoutPolicy: z
            .enum(['SKIP', 'DEFER_NEXT_VALID_DAY'])
            .default('SKIP'),
        untilIsoDate: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .optional(),
        maxOccurrences: z.number().int().min(1).max(1000).optional(),
    })
    .strict()

export type SpatialRecurrenceRule = z.infer<typeof SpatialRecurrenceRuleSchema>

export interface SpatialLunarOpticsProfile {
    readonly lunarPhase: LunarPhaseToken
    readonly lunarIlluminationBps: number
    readonly nightLuminanceBoostBps: number
    readonly nightOpticalRangeBoostBps: number
}

export interface ExpandedSpatialAppointmentWindow {
    readonly beatId: string
    readonly title: string
    readonly isoDate: string
    readonly startTimeHm: string
    readonly beatCategory: string
    readonly locationId?: string
    readonly participantIds?: readonly string[]
    readonly weekday: WeekdayToken
    readonly daypart: DiurnalDaypart
    readonly lunarOptics: SpatialLunarOpticsProfile
    readonly effectiveDiurnalProfile: DiurnalAttenuationProfile
    readonly occurrenceKey: string
    readonly reserveCooldownTicks: number
}

export type SpatialSeriesBlackout =
    string | { isoDate: string; policy?: SpatialBlackoutPolicy }

export interface RecurrenceBlackoutSkip {
    readonly beatId: string
    readonly isoDate: string
    readonly policy: SpatialBlackoutPolicy
}

export interface RecurrenceBlackoutDeferral {
    readonly beatId: string
    readonly fromIsoDate: string
    readonly toIsoDate: string
    readonly policy: SpatialBlackoutPolicy
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
        recurrenceRule: SpatialRecurrenceRuleSchema.optional(),
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
