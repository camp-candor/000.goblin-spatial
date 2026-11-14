import type { ClockModel } from '../clock.model.js'
import type ClockBit from '../fce/clock.bit.js'
import type State from '../../99.core/state.js'
import type {
    DiurnalAttenuationProfile,
    DiurnalDaypart,
    ScheduledSpatialAppointment,
    AppointmentDiurnalWindow,
    SpatialClockSnapshot,
} from '../fce/clock.interface.js'
import { ScheduledSpatialAppointmentSchema } from '../fce/clock.interface.js'

export const DIURNAL_PROFILE_TABLE: Readonly<
    Record<DiurnalDaypart, DiurnalAttenuationProfile>
> = Object.freeze({
    DAWN: Object.freeze({
        daypart: 'DAWN',
        ambientLuminanceBps: 4500,
        opticalRangeScaleBps: 7000,
        diurnalNoiseDeltaCdb: -150,
    }),
    MORNING: Object.freeze({
        daypart: 'MORNING',
        ambientLuminanceBps: 8500,
        opticalRangeScaleBps: 9500,
        diurnalNoiseDeltaCdb: 100,
    }),
    AFTERNOON: Object.freeze({
        daypart: 'AFTERNOON',
        ambientLuminanceBps: 10000,
        opticalRangeScaleBps: 10000,
        diurnalNoiseDeltaCdb: 200,
    }),
    DUSK: Object.freeze({
        daypart: 'DUSK',
        ambientLuminanceBps: 4000,
        opticalRangeScaleBps: 6500,
        diurnalNoiseDeltaCdb: 50,
    }),
    NIGHT: Object.freeze({
        daypart: 'NIGHT',
        ambientLuminanceBps: 1500,
        opticalRangeScaleBps: 4000,
        diurnalNoiseDeltaCdb: -300,
    }),
})

function clampBps(value: number): number {
    if (!Number.isInteger(value)) {
        value = Math.trunc(value)
    }
    if (value < 0) return 0
    if (value > 10000) return 10000
    return value
}

function pad2(value: number): string {
    const s = String(value)
    return s.length >= 2 ? s : '0' + s
}

function isLeapYear(year: number): boolean {
    if (year % 4 !== 0) return false
    if (year % 100 !== 0) return true
    return year % 400 === 0
}

function daysInMonth(year: number, month: number): number {
    switch (month) {
        case 1:
        case 3:
        case 5:
        case 7:
        case 8:
        case 10:
        case 12:
            return 31
        case 4:
        case 6:
        case 9:
        case 11:
            return 30
        case 2:
            return isLeapYear(year) ? 29 : 28
        default:
            return 0
    }
}

export function deriveSpatialDaypart(hour: number): DiurnalDaypart {
    if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
        throw new Error('INVALID_SPATIAL_TIME: hour out of range 00..23')
    }
    if (hour >= 5 && hour <= 6) return 'DAWN'
    if (hour >= 7 && hour <= 11) return 'MORNING'
    if (hour >= 12 && hour <= 16) return 'AFTERNOON'
    if (hour >= 17 && hour <= 19) return 'DUSK'
    return 'NIGHT'
}

export function computeDiurnalProfile(
    daypart: DiurnalDaypart,
): DiurnalAttenuationProfile {
    const base = DIURNAL_PROFILE_TABLE[daypart]
    if (!base) {
        throw new Error('INVALID_SPATIAL_DAYPART: unknown daypart')
    }
    return Object.freeze({
        daypart: base.daypart,
        ambientLuminanceBps: clampBps(base.ambientLuminanceBps),
        opticalRangeScaleBps: clampBps(base.opticalRangeScaleBps),
        diurnalNoiseDeltaCdb: Number.isInteger(base.diurnalNoiseDeltaCdb)
            ? base.diurnalNoiseDeltaCdb
            : Math.trunc(base.diurnalNoiseDeltaCdb),
    })
}

export interface SpatialClockInput {
    startDate?: string
    startTime?: string
    timezoneLabel?: string
    tickSeconds?: number
}

function parseDateParts(startDate: string): {
    year: number
    month: number
    day: number
} {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(startDate)
    if (!m) {
        throw new Error('INVALID_SPATIAL_DATE: expected YYYY-MM-DD')
    }
    const year = Number(m[1])
    const month = Number(m[2])
    const day = Number(m[3])
    if (
        !Number.isInteger(year) ||
        !Number.isInteger(month) ||
        !Number.isInteger(day)
    ) {
        throw new Error('INVALID_SPATIAL_DATE: non-integer date part')
    }
    if (month < 1 || month > 12) {
        throw new Error('INVALID_SPATIAL_DATE: month out of range 01..12')
    }
    const dim = daysInMonth(year, month)
    if (day < 1 || day > dim) {
        throw new Error('INVALID_SPATIAL_DATE: day out of range for month')
    }
    return { year, month, day }
}

function parseTimeParts(startTime: string): {
    hour: number
    minute: number
    second: number
} {
    const m = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(startTime)
    if (!m) {
        throw new Error('INVALID_SPATIAL_TIME: expected HH:MM or HH:MM:SS')
    }
    const hour = Number(m[1])
    const minute = Number(m[2])
    const second = m[3] !== undefined ? Number(m[3]) : 0
    if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
        throw new Error('INVALID_SPATIAL_TIME: hour out of range 00..23')
    }
    if (!Number.isInteger(minute) || minute < 0 || minute > 59) {
        throw new Error('INVALID_SPATIAL_TIME: minute out of range 00..59')
    }
    if (!Number.isInteger(second) || second < 0 || second > 59) {
        throw new Error('INVALID_SPATIAL_TIME: second out of range 00..59')
    }
    return { hour, minute, second }
}

export function parseSpatialClockSnapshot(
    input?: SpatialClockInput,
): SpatialClockSnapshot {
    const startDate = input?.startDate ?? '2026-10-31'
    const rawTime = input?.startTime ?? '21:00:00'
    const timezoneLabel = input?.timezoneLabel ?? 'UTC+00:00'
    const tickSeconds = input?.tickSeconds === undefined ? 0 : input.tickSeconds
    if (!Number.isInteger(tickSeconds) || tickSeconds < 0) {
        throw new Error(
            'INVALID_SPATIAL_TIME: tickSeconds must be integer >= 0',
        )
    }

    parseDateParts(startDate)
    const { hour, minute, second } = parseTimeParts(rawTime)

    const daypart = deriveSpatialDaypart(hour)
    const diurnalProfile = computeDiurnalProfile(daypart)
    const clockTimeHm = pad2(hour) + ':' + pad2(minute)
    const canonicalTime = pad2(hour) + ':' + pad2(minute) + ':' + pad2(second)
    const isoDate = startDate + 'T' + canonicalTime

    return Object.freeze({
        startDate,
        startTime: canonicalTime,
        clockTimeHm,
        isoDate,
        hour,
        minute,
        second,
        daypart,
        timezoneLabel,
        tickSeconds,
        diurnalProfile,
    })
}

export function evaluateAppointmentDiurnalWindow(
    appointment: ScheduledSpatialAppointment,
): AppointmentDiurnalWindow {
    const parsed = ScheduledSpatialAppointmentSchema.safeParse(appointment)
    if (!parsed.success) {
        const issues = parsed.error.issues
        const hasDateIssue = issues.some((i) =>
            String((i.path ?? []).join('.')).includes('isoDate'),
        )
        const hasTimeIssue = issues.some((i) =>
            String((i.path ?? []).join('.')).includes('startTimeHm'),
        )
        if (hasTimeIssue) {
            throw new Error(
                'INVALID_SPATIAL_TIME: scheduled appointment time rejected',
            )
        }
        if (hasDateIssue) {
            throw new Error(
                'INVALID_SPATIAL_DATE: scheduled appointment date rejected',
            )
        }
        throw new Error(
            'INVALID_SPATIAL_APPOINTMENT: scheduled appointment rejected',
        )
    }
    const valid = parsed.data
    const snapshot = parseSpatialClockSnapshot({
        startDate: valid.isoDate,
        startTime: valid.startTimeHm,
    })
    const window: AppointmentDiurnalWindow = {
        beatId: valid.beatId,
        title: valid.title,
        isoDate: valid.isoDate,
        startTimeHm: valid.startTimeHm,
        beatCategory: valid.beatCategory,
        ...(valid.locationId !== undefined
            ? { locationId: valid.locationId }
            : {}),
        daypart: snapshot.daypart,
        diurnalProfile: {
            daypart: snapshot.diurnalProfile.daypart,
            ambientLuminanceBps: snapshot.diurnalProfile.ambientLuminanceBps,
            opticalRangeScaleBps: snapshot.diurnalProfile.opticalRangeScaleBps,
            diurnalNoiseDeltaCdb: snapshot.diurnalProfile.diurnalNoiseDeltaCdb,
        },
        reserveCooldownTicks: valid.reserveCooldownTicks,
    }
    return Object.freeze({
        ...window,
        diurnalProfile: Object.freeze({ ...window.diurnalProfile }),
    }) as AppointmentDiurnalWindow
}

export function evaluateAgendaDiurnalSchedule(
    appointments: readonly ScheduledSpatialAppointment[],
): ScheduledSpatialAppointment[] {
    const copy = [...(appointments ?? [])]
    copy.sort((a, b) => {
        if (a.isoDate !== b.isoDate) {
            return a.isoDate < b.isoDate ? -1 : 1
        }
        if (a.startTimeHm !== b.startTimeHm) {
            return a.startTimeHm < b.startTimeHm ? -1 : 1
        }
        if (a.beatId !== b.beatId) {
            return a.beatId < b.beatId ? -1 : 1
        }
        return 0
    })
    return Object.freeze(copy) as unknown as ScheduledSpatialAppointment[]
}

export function sortScheduledAppointments(
    appointments: readonly ScheduledSpatialAppointment[],
): ScheduledSpatialAppointment[] {
    return evaluateAgendaDiurnalSchedule(appointments)
}

function resolveInputFromBale(bal?: ClockBit): SpatialClockInput {
    const dat = (bal?.dat ?? {}) as Record<string, unknown>
    const startDate =
        (dat.startDate as string | undefined) ??
        (dat.start_date as string | undefined)
    const startTime =
        (dat.startTime as string | undefined) ??
        (dat.start_time as string | undefined) ??
        (dat.start_time_hm as string | undefined)
    const timezoneLabel =
        (dat.timezoneLabel as string | undefined) ??
        (dat.timezone_label as string | undefined)
    const tickSeconds =
        (dat.tickSeconds as number | undefined) ??
        (dat.tick_seconds as number | undefined)
    const out: SpatialClockInput = {}
    if (startDate !== undefined) out.startDate = String(startDate)
    if (startTime !== undefined) out.startTime = String(startTime)
    if (timezoneLabel !== undefined) out.timezoneLabel = String(timezoneLabel)
    if (tickSeconds !== undefined) out.tickSeconds = Number(tickSeconds)
    if (typeof bal?.src === 'string' && out.startTime === undefined) {
        if (/^\d{2}:\d{2}(:\d{2})?$/.test(bal.src)) {
            out.startTime = bal.src
        }
    }
    return out
}

export const initClock = (
    cpy: ClockModel,
    bal?: ClockBit,
    _ste?: State,
): ClockModel => {
    const input = resolveInputFromBale(bal)
    const hasInput =
        input.startDate !== undefined ||
        input.startTime !== undefined ||
        input.timezoneLabel !== undefined ||
        input.tickSeconds !== undefined
    const snapshot = parseSpatialClockSnapshot(
        hasInput ? input : { startDate: '2026-10-31', startTime: '21:00:00' },
    )
    cpy.activeSnapshot = snapshot
    cpy.activeDiurnalProfile = snapshot.diurnalProfile
    if (bal?.slv) {
        bal.slv({
            clkBit: {
                idx: 'init-clock-ok',
                val: 1,
                dat: {
                    snapshot,
                    profile: snapshot.diurnalProfile,
                    note: '>> [CLOCK:DIURNAL] clock initialized',
                },
            },
        })
    }
    return cpy
}

export const updateClock = (
    cpy: ClockModel,
    bal?: ClockBit,
    _ste?: State,
): ClockModel => {
    const dat = (bal?.dat ?? {}) as Record<string, unknown>
    if (
        dat.startDate !== undefined ||
        dat.startTime !== undefined ||
        dat.start_date !== undefined ||
        dat.start_time !== undefined
    ) {
        return syncSpatialClock(cpy, bal, _ste)
    }
    if (cpy.activeSnapshot === null) {
        return initClock(cpy, bal, _ste)
    }
    const tickRaw = dat.tickSeconds ?? dat.tick_seconds ?? 0
    const tick = Number(tickRaw)
    if (tick !== 0) {
        if (!Number.isInteger(tick) || tick < 0) {
            throw new Error(
                'INVALID_SPATIAL_TIME: tickSeconds must be integer >= 0',
            )
        }
        const prev = cpy.activeSnapshot
        const totalSeconds =
            prev.hour * 3600 + prev.minute * 60 + prev.second + tick
        const wrapped = ((totalSeconds % 86400) + 86400) % 86400
        const hour = Math.floor(wrapped / 3600)
        const minute = Math.floor((wrapped - hour * 3600) / 60)
        const second = wrapped - hour * 3600 - minute * 60
        const daypart = deriveSpatialDaypart(hour)
        const diurnalProfile = computeDiurnalProfile(daypart)
        const clockTimeHm = pad2(hour) + ':' + pad2(minute)
        const canonicalTime =
            pad2(hour) + ':' + pad2(minute) + ':' + pad2(second)
        const snapshot: SpatialClockSnapshot = Object.freeze({
            startDate: prev.startDate,
            startTime: canonicalTime,
            clockTimeHm,
            isoDate: prev.startDate + 'T' + canonicalTime,
            hour,
            minute,
            second,
            daypart,
            timezoneLabel: prev.timezoneLabel,
            tickSeconds: tick,
            diurnalProfile,
        })
        cpy.activeSnapshot = snapshot
        cpy.activeDiurnalProfile = diurnalProfile
    }
    if (bal?.slv) {
        bal.slv({
            clkBit: {
                idx: 'update-clock-ok',
                val: 1,
                dat: {
                    snapshot: cpy.activeSnapshot,
                    profile: cpy.activeDiurnalProfile,
                    note: '>> [CLOCK:DIURNAL] clock updated',
                },
            },
        })
    }
    return cpy
}

export const syncSpatialClock = (
    cpy: ClockModel,
    bal?: ClockBit,
    _ste?: State,
): ClockModel => {
    const dat = (bal?.dat ?? {}) as Record<string, unknown>
    const hasExplicit =
        dat.startDate !== undefined ||
        dat.startTime !== undefined ||
        dat.start_date !== undefined ||
        dat.start_time !== undefined ||
        dat.start_time_hm !== undefined ||
        dat.timezoneLabel !== undefined ||
        dat.timezone_label !== undefined ||
        dat.tickSeconds !== undefined
    const snapshot = hasExplicit
        ? parseSpatialClockSnapshot(resolveInputFromBale(bal))
        : (cpy.activeSnapshot ??
          parseSpatialClockSnapshot({
              startDate: '2026-10-31',
              startTime: '21:00:00',
          }))
    cpy.activeSnapshot = snapshot
    cpy.activeDiurnalProfile = snapshot.diurnalProfile
    if (bal?.slv) {
        bal.slv({
            clkBit: {
                idx: 'sync-spatial-clock-ok',
                val: 1,
                dat: {
                    snapshot,
                    profile: snapshot.diurnalProfile,
                    note: '>> [CLOCK:DIURNAL] spatial clock synced',
                },
            },
        })
    }
    return cpy
}

export const deriveDiurnalProfile = (
    cpy: ClockModel,
    bal?: ClockBit,
    _ste?: State,
): ClockModel => {
    const dat = (bal?.dat ?? {}) as Record<string, unknown>
    let daypart: DiurnalDaypart
    if (typeof dat.daypart === 'string') {
        const candidate = String(dat.daypart).toUpperCase()
        if (
            candidate === 'DAWN' ||
            candidate === 'MORNING' ||
            candidate === 'AFTERNOON' ||
            candidate === 'DUSK' ||
            candidate === 'NIGHT'
        ) {
            daypart = candidate as DiurnalDaypart
        } else {
            throw new Error('INVALID_SPATIAL_DAYPART: unknown daypart')
        }
    } else if (typeof dat.hour === 'number') {
        daypart = deriveSpatialDaypart(Number(dat.hour))
    } else if (cpy.activeSnapshot !== null) {
        daypart = cpy.activeSnapshot.daypart
    } else {
        daypart = deriveSpatialDaypart(21)
    }
    const profile = computeDiurnalProfile(daypart)
    cpy.activeDiurnalProfile = profile
    if (bal?.slv) {
        bal.slv({
            clkBit: {
                idx: 'derive-diurnal-profile-ok',
                val: 1,
                dat: {
                    profile,
                    daypart,
                    note: '>> [CLOCK:DIURNAL] profile derived',
                },
            },
        })
    }
    return cpy
}
