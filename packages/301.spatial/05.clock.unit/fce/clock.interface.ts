import type ClockBit from './clock.bit.js'

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
