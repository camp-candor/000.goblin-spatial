import type { ClockModel } from '../clock.model.js'
import type ClockBit from '../fce/clock.bit.js'
import type State from '../../99.core/state.js'
import type {
    DiurnalAttenuationProfile,
    DiurnalDaypart,
    ExpandedSpatialAppointmentWindow,
    LunarPhaseToken,
    RecurrenceBlackoutDeferral,
    RecurrenceBlackoutSkip,
    ScheduledSpatialAppointment,
    AppointmentDiurnalWindow,
    SpatialClockSnapshot,
    SpatialLunarOpticsProfile,
    SpatialSeriesBlackout,
    WeekdayToken,
} from '../fce/clock.interface.js'
import {
    ScheduledSpatialAppointmentSchema,
    SpatialRecurrenceRuleSchema,
} from '../fce/clock.interface.js'

export const SYNODIC_MONTH_SECONDS = 2551443
export const REF_NEW_MOON_SEC = 947182440

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

const WEEKDAY_TOKENS: readonly WeekdayToken[] = Object.freeze([
    'MON',
    'TUE',
    'WED',
    'THU',
    'FRI',
    'SAT',
    'SUN',
])

void WEEKDAY_TOKENS
void SpatialRecurrenceRuleSchema

function parseIsoDateStrict(isoDate: string): {
    year: number
    month: number
    day: number
} {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(isoDate))
    if (!m) {
        throw new Error('INVALID_SPATIAL_DATE: expected YYYY-MM-DD')
    }
    const year = Number(m[1])
    const month = Number(m[2])
    const day = Number(m[3])
    if (month < 1 || month > 12) {
        throw new Error('INVALID_SPATIAL_DATE: month out of range 01..12')
    }
    const dim = daysInMonth(year, month)
    if (day < 1 || day > dim) {
        throw new Error('INVALID_SPATIAL_DATE: day out of range for month')
    }
    return { year, month, day }
}

function isoDateToUtcSec(isoDate: string): number {
    const { year, month, day } = parseIsoDateStrict(isoDate)
    return Math.trunc(Date.UTC(year, month - 1, day) / 1000)
}

function formatUtcSecToIsoDate(utcSec: number): string {
    const d = new Date(utcSec * 1000)
    const y = d.getUTCFullYear()
    const m = d.getUTCMonth() + 1
    const day = d.getUTCDate()
    return (
        String(y).padStart(4, '0') +
        '-' +
        String(m).padStart(2, '0') +
        '-' +
        String(day).padStart(2, '0')
    )
}

function addDaysIso(isoDate: string, deltaDays: number): string {
    const base = isoDateToUtcSec(isoDate)
    return formatUtcSecToIsoDate(base + Math.trunc(deltaDays) * 86400)
}

function diffDaysIso(fromIso: string, toIso: string): number {
    return Math.trunc(
        (isoDateToUtcSec(toIso) - isoDateToUtcSec(fromIso)) / 86400,
    )
}

export function resolveSpatialWeekday(isoDate: string): WeekdayToken {
    const { year, month, day } = parseIsoDateStrict(isoDate)
    const t = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4]
    let y = year
    if (month < 3) y -= 1
    const dow =
        (y +
            Math.floor(y / 4) -
            Math.floor(y / 100) +
            Math.floor(y / 400) +
            t[month - 1] +
            day) %
        7
    switch (dow) {
        case 0:
            return 'SUN'
        case 1:
            return 'MON'
        case 2:
            return 'TUE'
        case 3:
            return 'WED'
        case 4:
            return 'THU'
        case 5:
            return 'FRI'
        case 6:
            return 'SAT'
        default:
            throw new Error('INVALID_SPATIAL_DATE: weekday resolution failed')
    }
}

function phaseForFractionAge(ageSec: number): LunarPhaseToken {
    const eight = ageSec * 8
    const s = SYNODIC_MONTH_SECONDS
    if (eight < s * 1 || eight >= s * 7) return 'NEW_MOON'
    if (eight < s * 3) return 'FIRST_QUARTER'
    if (eight < s * 5) return 'FULL_MOON'
    return 'LAST_QUARTER'
}

export function computeSpatialLunarOptics(
    isoDate: string,
    startTimeHm: string,
): SpatialLunarOpticsProfile {
    const snapshot = parseSpatialClockSnapshot({
        startDate: isoDate,
        startTime: startTimeHm,
    })
    const dateSec = isoDateToUtcSec(snapshot.startDate)
    const age =
        (((dateSec - REF_NEW_MOON_SEC) % SYNODIC_MONTH_SECONDS) +
            SYNODIC_MONTH_SECONDS) %
        SYNODIC_MONTH_SECONDS
    const lunarPhase = phaseForFractionAge(age)
    const lunarIlluminationBps =
        lunarPhase === 'FULL_MOON'
            ? 10000
            : lunarPhase === 'NEW_MOON'
              ? 0
              : 5000
    const nocturnal =
        snapshot.daypart === 'NIGHT' || snapshot.daypart === 'DUSK'
    const nightLuminanceBoostBps = nocturnal
        ? Math.floor((lunarIlluminationBps * 1500) / 10000)
        : 0
    const nightOpticalRangeBoostBps = nocturnal
        ? Math.floor((lunarIlluminationBps * 2000) / 10000)
        : 0
    return Object.freeze({
        lunarPhase,
        lunarIlluminationBps,
        nightLuminanceBoostBps,
        nightOpticalRangeBoostBps,
    })
}

function solarEventForDate(isoDate: string): string | null {
    const { month, day } = parseIsoDateStrict(isoDate)
    const key =
        String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0')
    if (key === '03-20') return 'SPRING_EQUINOX'
    if (key === '06-21') return 'SUMMER_SOLSTICE'
    if (key === '09-22') return 'AUTUMN_EQUINOX'
    if (key === '12-21') return 'WINTER_SOLSTICE'
    return null
}

function isSolarEventMatch(
    isoDate: string,
    filter: string | undefined,
): boolean {
    const evt = solarEventForDate(isoDate)
    if (evt === null) return false
    if (filter === undefined || filter === null || filter === '') return true
    return evt === filter
}

function normalizeBlackoutMap(
    ruleBlackouts: readonly string[] | undefined,
    rulePolicy: string | undefined,
    seriesBlackouts: readonly SpatialSeriesBlackout[] | undefined,
): Map<string, string> {
    const map = new Map<string, string>()
    const put = (iso: string, policy: string): void => {
        parseIsoDateStrict(iso)
        const prev = map.get(iso)
        if (prev === 'DEFER_NEXT_VALID_DAY') return
        if (policy === 'DEFER_NEXT_VALID_DAY') {
            map.set(iso, policy)
            return
        }
        if (prev === undefined) map.set(iso, 'SKIP')
    }
    for (const d of ruleBlackouts ?? []) {
        put(String(d), String(rulePolicy ?? 'SKIP'))
    }
    for (const entry of seriesBlackouts ?? []) {
        if (typeof entry === 'string') {
            put(entry, 'SKIP')
        } else if (entry !== null && typeof entry === 'object') {
            const obj = entry as { isoDate?: unknown; policy?: unknown }
            if (typeof obj.isoDate === 'string') {
                put(
                    obj.isoDate,
                    typeof obj.policy === 'string' ? obj.policy : 'SKIP',
                )
            }
        }
    }
    return map
}

function generateCandidateDates(
    appointmentIso: string,
    ruleKind: string,
    rule: {
        weeklyMask?: readonly string[]
        intervalDays?: number
        lunarPhase?: string
        solarEvent?: string
    },
    anchorTimeHm: string,
    startIsoDate: string,
    horizonDays: number,
): string[] {
    const out: string[] = []
    if (ruleKind === 'ONCE') {
        const cmpStart = diffDaysIso(startIsoDate, appointmentIso)
        if (cmpStart >= 0 && cmpStart < horizonDays) out.push(appointmentIso)
        return out
    }
    for (let i = 0; i < horizonDays; i++) {
        const cand = addDaysIso(startIsoDate, i)
        if (ruleKind === 'DAILY') {
            out.push(cand)
        } else if (ruleKind === 'WEEKLY_MASK') {
            const mask = rule.weeklyMask ?? []
            if (mask.length === 0) continue
            const wd = resolveSpatialWeekday(cand)
            if ((mask as readonly string[]).includes(wd)) out.push(cand)
        } else if (ruleKind === 'INTERVAL_DAYS') {
            const n = rule.intervalDays ?? 1
            const diff = diffDaysIso(appointmentIso, cand)
            if (diff >= 0 && diff % n === 0) out.push(cand)
        } else if (ruleKind === 'LUNAR_PHASE') {
            const want = rule.lunarPhase
            if (want === undefined) continue
            const optics = computeSpatialLunarOptics(cand, anchorTimeHm)
            if (optics.lunarPhase === want) out.push(cand)
        } else if (ruleKind === 'SOLAR_SOLSTICE_EQUINOX') {
            if (isSolarEventMatch(cand, rule.solarEvent)) out.push(cand)
        }
    }
    return out
}

export function expandSpatialRecurringAppointments(
    appointments: readonly ScheduledSpatialAppointment[],
    startIsoDate: string,
    horizonDays: number,
    seriesBlackouts: readonly SpatialSeriesBlackout[] = [],
): ExpandedSpatialAppointmentWindow[] {
    parseIsoDateStrict(startIsoDate)
    if (!Number.isInteger(horizonDays) || horizonDays < 0) {
        throw new Error('INVALID_SPATIAL_HORIZON: horizonDays integer >= 0')
    }
    if (horizonDays === 0)
        return Object.freeze([]) as ExpandedSpatialAppointmentWindow[]
    const windowEndExclusive = addDaysIso(startIsoDate, horizonDays)
    const collected: ExpandedSpatialAppointmentWindow[] = []
    for (const raw of appointments ?? []) {
        const parsed = ScheduledSpatialAppointmentSchema.safeParse(raw)
        if (!parsed.success) {
            const issues = parsed.error.issues
            const hasDate = issues.some((x) =>
                String((x.path ?? []).join('.')).includes('isoDate'),
            )
            if (hasDate) {
                throw new Error(
                    'INVALID_SPATIAL_DATE: recurring appointment date rejected',
                )
            }
            throw new Error(
                'INVALID_SPATIAL_APPOINTMENT: recurring appointment rejected',
            )
        }
        const appt = parsed.data
        const rule = (appt.recurrenceRule ?? {
            recurrenceKind: 'ONCE',
            blackoutPolicy: 'SKIP',
        }) as {
            recurrenceKind: string
            weeklyMask?: readonly string[]
            intervalDays?: number
            lunarPhase?: string
            solarEvent?: string
            blackoutDates?: readonly string[]
            blackoutPolicy?: string
            untilIsoDate?: string
            maxOccurrences?: number
        }
        const kind = rule.recurrenceKind ?? 'ONCE'
        let candidates = generateCandidateDates(
            appt.isoDate,
            kind,
            rule,
            appt.startTimeHm,
            startIsoDate,
            horizonDays,
        )
        if (rule.untilIsoDate !== undefined) {
            parseIsoDateStrict(rule.untilIsoDate)
            candidates = candidates.filter(
                (c) => diffDaysIso(c, rule.untilIsoDate as string) >= 0,
            )
        }
        const blackoutMap = normalizeBlackoutMap(
            rule.blackoutDates,
            rule.blackoutPolicy,
            seriesBlackouts,
        )
        const emitted: string[] = []
        const emittedSet = new Set<string>()
        const maxOcc = rule.maxOccurrences
        for (const cand of candidates) {
            if (maxOcc !== undefined && emitted.length >= maxOcc) break
            const policy = blackoutMap.get(cand)
            if (policy === undefined) {
                if (!emittedSet.has(cand)) {
                    emitted.push(cand)
                    emittedSet.add(cand)
                }
            } else if (policy === 'SKIP') {
                continue
            } else {
                let deferred = addDaysIso(cand, 1)
                let guard = 0
                while (blackoutMap.has(deferred) && guard < 366) {
                    deferred = addDaysIso(deferred, 1)
                    guard += 1
                }
                if (diffDaysIso(startIsoDate, deferred) < 0) continue
                if (diffDaysIso(deferred, windowEndExclusive) <= 0) continue
                if (
                    rule.untilIsoDate !== undefined &&
                    diffDaysIso(deferred, rule.untilIsoDate) < 0
                ) {
                    continue
                }
                if (!emittedSet.has(deferred)) {
                    emitted.push(deferred)
                    emittedSet.add(deferred)
                }
            }
            if (maxOcc !== undefined && emitted.length >= maxOcc) break
        }
        emitted.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
        const capped = maxOcc !== undefined ? emitted.slice(0, maxOcc) : emitted
        for (const iso of capped) {
            const snap = parseSpatialClockSnapshot({
                startDate: iso,
                startTime: appt.startTimeHm,
            })
            const weekday = resolveSpatialWeekday(iso)
            const lunarOptics = computeSpatialLunarOptics(iso, appt.startTimeHm)
            const base = snap.diurnalProfile
            const effective: DiurnalAttenuationProfile = Object.freeze({
                daypart: base.daypart,
                ambientLuminanceBps: Math.min(
                    10000,
                    Math.max(
                        0,
                        base.ambientLuminanceBps +
                            lunarOptics.nightLuminanceBoostBps,
                    ),
                ),
                opticalRangeScaleBps: Math.min(
                    10000,
                    Math.max(
                        0,
                        base.opticalRangeScaleBps +
                            lunarOptics.nightOpticalRangeBoostBps,
                    ),
                ),
                diurnalNoiseDeltaCdb: base.diurnalNoiseDeltaCdb,
            })
            const win: ExpandedSpatialAppointmentWindow = Object.freeze({
                beatId: appt.beatId,
                title: appt.title,
                isoDate: iso,
                startTimeHm: appt.startTimeHm,
                beatCategory: appt.beatCategory,
                ...(appt.locationId !== undefined
                    ? { locationId: appt.locationId }
                    : {}),
                ...(((appt as { participantIds?: readonly string[] })
                    .participantIds ?? undefined) !== undefined
                    ? {
                          participantIds: Object.freeze([
                              ...((
                                  appt as { participantIds?: readonly string[] }
                              ).participantIds as readonly string[]),
                          ]),
                      }
                    : {}),
                weekday,
                daypart: snap.daypart,
                lunarOptics: Object.freeze({ ...lunarOptics }),
                effectiveDiurnalProfile: effective,
                occurrenceKey: appt.beatId + '@' + iso,
                reserveCooldownTicks: appt.reserveCooldownTicks,
            })
            collected.push(win)
        }
    }
    collected.sort((a, b) => {
        if (a.isoDate !== b.isoDate) return a.isoDate < b.isoDate ? -1 : 1
        if (a.startTimeHm !== b.startTimeHm) {
            return a.startTimeHm < b.startTimeHm ? -1 : 1
        }
        if (a.beatId !== b.beatId) return a.beatId < b.beatId ? -1 : 1
        return 0
    })
    return Object.freeze(collected) as ExpandedSpatialAppointmentWindow[]
}

export interface RecurrenceExpansionAudit {
    readonly windows: readonly ExpandedSpatialAppointmentWindow[]
    readonly skips: readonly RecurrenceBlackoutSkip[]
    readonly deferrals: readonly RecurrenceBlackoutDeferral[]
}

export function expandSpatialRecurringAppointmentsWithAudit(
    appointments: readonly ScheduledSpatialAppointment[],
    startIsoDate: string,
    horizonDays: number,
    seriesBlackouts: readonly SpatialSeriesBlackout[] = [],
): RecurrenceExpansionAudit {
    const windows = expandSpatialRecurringAppointments(
        appointments,
        startIsoDate,
        horizonDays,
        seriesBlackouts,
    )
    const skips: RecurrenceBlackoutSkip[] = []
    const deferrals: RecurrenceBlackoutDeferral[] = []
    const windowEndExclusive = addDaysIso(startIsoDate, horizonDays)
    const emittedByBeat = new Map<string, Set<string>>()
    for (const w of windows) {
        let set = emittedByBeat.get(w.beatId)
        if (set === undefined) {
            set = new Set<string>()
            emittedByBeat.set(w.beatId, set)
        }
        set.add(w.isoDate)
    }
    for (const raw of appointments ?? []) {
        const parsed = ScheduledSpatialAppointmentSchema.safeParse(raw)
        if (!parsed.success) continue
        const appt = parsed.data
        const rule = (appt.recurrenceRule ?? {
            recurrenceKind: 'ONCE',
            blackoutPolicy: 'SKIP',
        }) as {
            recurrenceKind: string
            weeklyMask?: readonly string[]
            intervalDays?: number
            lunarPhase?: string
            solarEvent?: string
            blackoutDates?: readonly string[]
            blackoutPolicy?: string
            untilIsoDate?: string
            maxOccurrences?: number
        }
        let candidates = generateCandidateDates(
            appt.isoDate,
            rule.recurrenceKind ?? 'ONCE',
            rule,
            appt.startTimeHm,
            startIsoDate,
            horizonDays,
        )
        if (rule.untilIsoDate !== undefined) {
            candidates = candidates.filter(
                (c) => diffDaysIso(c, rule.untilIsoDate as string) >= 0,
            )
        }
        const blackoutMap = normalizeBlackoutMap(
            rule.blackoutDates,
            rule.blackoutPolicy,
            seriesBlackouts,
        )
        const emittedSet = emittedByBeat.get(appt.beatId) ?? new Set<string>()
        for (const cand of candidates) {
            const policy = blackoutMap.get(cand)
            if (policy === undefined) continue
            if (policy === 'SKIP') {
                if (!emittedSet.has(cand)) {
                    skips.push(
                        Object.freeze({
                            beatId: appt.beatId,
                            isoDate: cand,
                            policy: 'SKIP' as const,
                        }),
                    )
                }
            } else {
                let deferred = addDaysIso(cand, 1)
                let guard = 0
                while (blackoutMap.has(deferred) && guard < 366) {
                    deferred = addDaysIso(deferred, 1)
                    guard += 1
                }
                if (
                    diffDaysIso(startIsoDate, deferred) < 0 ||
                    diffDaysIso(deferred, windowEndExclusive) <= 0 ||
                    (rule.untilIsoDate !== undefined &&
                        diffDaysIso(deferred, rule.untilIsoDate) < 0)
                ) {
                    skips.push(
                        Object.freeze({
                            beatId: appt.beatId,
                            isoDate: cand,
                            policy: 'DEFER_NEXT_VALID_DAY' as const,
                        }),
                    )
                    continue
                }
                deferrals.push(
                    Object.freeze({
                        beatId: appt.beatId,
                        fromIsoDate: cand,
                        toIsoDate: deferred,
                        policy: 'DEFER_NEXT_VALID_DAY' as const,
                    }),
                )
            }
        }
    }
    skips.sort((a, b) => {
        if (a.isoDate !== b.isoDate) return a.isoDate < b.isoDate ? -1 : 1
        return a.beatId < b.beatId ? -1 : 1
    })
    deferrals.sort((a, b) => {
        if (a.fromIsoDate !== b.fromIsoDate) {
            return a.fromIsoDate < b.fromIsoDate ? -1 : 1
        }
        return a.beatId < b.beatId ? -1 : 1
    })
    return Object.freeze({
        windows,
        skips: Object.freeze(skips),
        deferrals: Object.freeze(deferrals),
    })
}
