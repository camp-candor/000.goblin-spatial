import { IncidentModel } from '../incident.model.js'
import IncidentBit from '../fce/incident.bit.js'
import State from '../../99.core/state.js'
import {
    createAxialCoord,
    packAxial,
    unpackAxial,
} from '../../28.axial.unit/val/axial.model.js'
import type { AxialCoord } from '../../28.axial.unit/val/axial.model.js'
import { axialDistance } from '../../28.axial.unit/buz/axial.buzz.js'
import { traceFiniteSupercover } from '../../41.segment.unit/buz/segment.buzz.js'
import { computeOpticalTransmission } from '../../40.witness.unit/buz/witness.buzz.js'
import { toBasisPoints } from '../../40.witness.unit/val/witness.model.js'
import type { BasisPoints } from '../../40.witness.unit/fce/witness.interface.js'
import { parseSpatialClockSnapshot } from '../../05.clock.unit/buz/clock.buzz.js'
import type {
    IncidentWitnessInput,
    SpatialIncidentReport,
    SpatialEventStageBrief,
    StageBriefLocationSpec,
} from '../fce/incident.interface.js'
import {
    IncidentWitnessInputSchema,
    SpatialIncidentReportSchema,
    SpatialEventStageBriefSchema,
} from '../fce/incident.interface.js'
import {
    AIR_LOSS_PER_HEX_CDB,
    DEFAULT_HEARING_THRESHOLD_CDB,
    DEFAULT_SNR_MIN_CDB,
    REFERENCE_SOURCE_CDB,
} from '../../13.sound.unit/val/sound.model.js'

const VISIBILITY_THRESHOLD_BPS = 5000

function toAsciiToken(value: string): string {
    return String(value || '')
        .replace(/[^\x20-\x7E]/g, '')
        .trim()
}

function resolveStartTime(input: IncidentWitnessInput): string {
    if (typeof input.startTime === 'string' && input.startTime.length > 0) {
        return input.startTime
    }
    if (typeof input.startTimeHm === 'string' && input.startTimeHm.length > 0) {
        return input.startTimeHm
    }
    return '21:00'
}

function resolveStartDate(input: IncidentWitnessInput): string {
    if (typeof input.startDate === 'string' && input.startDate.length > 0) {
        return input.startDate
    }
    return '2026-10-31'
}

export function evaluateSpatialIncidentWitnesses(
    rawInput: IncidentWitnessInput,
): SpatialIncidentReport {
    const parsed = IncidentWitnessInputSchema.parse(rawInput)
    const snapshot = parseSpatialClockSnapshot({
        startDate: resolveStartDate(parsed as IncidentWitnessInput),
        startTime: resolveStartTime(parsed as IncidentWitnessInput),
    })
    const profile = snapshot.diurnalProfile
    const locationId =
        toAsciiToken(String((parsed as IncidentWitnessInput).locationId)) ||
        'UNKNOWN'
    const originCoord = (parsed as IncidentWitnessInput)
        .originCoord as AxialCoord
    const actors = [...(parsed as IncidentWitnessInput).actors].sort((a, b) =>
        a.actorId.localeCompare(b.actorId),
    )
    const opaqueList = ((parsed as IncidentWitnessInput).opaqueCells ??
        []) as AxialCoord[]
    const opaqueSet = new Set<number>()
    for (const cell of opaqueList) {
        opaqueSet.add(packAxial(cell.q, cell.r))
    }
    const sourceCdb =
        (parsed as IncidentWitnessInput).acousticSourceCdb ??
        (REFERENCE_SOURCE_CDB as number)
    const baseFloorCdb =
        (parsed as IncidentWitnessInput).ambientNoiseFloorCdb ?? 2700
    const effectiveFloorCdb = baseFloorCdb + profile.diurnalNoiseDeltaCdb
    const hearingThreshold = DEFAULT_HEARING_THRESHOLD_CDB as number
    const snrMin = DEFAULT_SNR_MIN_CDB as number

    const witnesses = actors.map((actor) => {
        const target = createAxialCoord(actor.coord.q, actor.coord.r)
        const origin = createAxialCoord(originCoord.q, originCoord.r)
        const distanceHex = axialDistance(origin, target)
        const trace = traceFiniteSupercover(origin, target)
        const traversed: AxialCoord[] = trace.features.map((f) => f.cell)
        const receipt = computeOpticalTransmission(
            {
                origin,
                target,
                traversedCells: traversed,
            },
            (packed) => {
                if (opaqueSet.has(packed as number)) {
                    return toBasisPoints(10000)
                }
                return toBasisPoints(0)
            },
        )
        const transmissionBps = receipt.transmissionBps as number
        const effectiveTransmissionBps = Math.floor(
            (transmissionBps * profile.opticalRangeScaleBps) / 10000,
        )
        const rawBlocked = transmissionBps < VISIBILITY_THRESHOLD_BPS
        const diurnalBlocked =
            !rawBlocked && effectiveTransmissionBps < VISIBILITY_THRESHOLD_BPS
        const sawEvent = !rawBlocked && !diurnalBlocked
        let occlusionReason = 'CLEAR_LINE_OF_SIGHT'
        if (rawBlocked) {
            occlusionReason = 'OCCLUDED_WALL'
        } else if (diurnalBlocked) {
            occlusionReason = 'DIURNAL_VISIBILITY_DROP'
        }
        const arrivingIntensityCdb = Math.max(
            0,
            sourceCdb - distanceHex * (AIR_LOSS_PER_HEX_CDB as number),
        )
        const snrMarginCdb = arrivingIntensityCdb - effectiveFloorCdb
        const heardEvent =
            arrivingIntensityCdb >= hearingThreshold && snrMarginCdb >= snrMin
        return {
            actorId: actor.actorId,
            coord: { q: target.q, r: target.r, s: target.s },
            distanceHex,
            sawEvent,
            heardEvent,
            occlusionReason,
            transmissionBps,
            effectiveTransmissionBps,
            arrivingIntensityCdb,
            snrMarginCdb,
        }
    })

    const visibleWitnessIds = witnesses
        .filter((w) => w.sawEvent)
        .map((w) => w.actorId)
    const audibleWitnessIds = witnesses
        .filter((w) => w.heardEvent)
        .map((w) => w.actorId)

    const report: SpatialIncidentReport = {
        locationId,
        originCoord: {
            q: originCoord.q,
            r: originCoord.r,
            s: originCoord.s,
        },
        clockTimeHm: snapshot.clockTimeHm,
        diurnalDaypart: snapshot.daypart,
        diurnalProfile: {
            daypart: profile.daypart,
            ambientLuminanceBps: profile.ambientLuminanceBps,
            opticalRangeScaleBps: profile.opticalRangeScaleBps,
            diurnalNoiseDeltaCdb: profile.diurnalNoiseDeltaCdb,
        },
        witnesses,
        visibleWitnessIds,
        audibleWitnessIds,
    }
    SpatialIncidentReportSchema.parse({
        locationId: report.locationId,
        originCoord: report.originCoord,
        clockTimeHm: report.clockTimeHm,
        diurnalDaypart: report.diurnalDaypart,
        diurnalProfile: report.diurnalProfile,
        witnesses: [...report.witnesses],
        visibleWitnessIds: [...report.visibleWitnessIds],
        audibleWitnessIds: [...report.audibleWitnessIds],
    })
    return Object.freeze({
        ...report,
        originCoord: Object.freeze({ ...report.originCoord }),
        diurnalProfile: Object.freeze({ ...report.diurnalProfile }),
        witnesses: Object.freeze(
            report.witnesses.map((w) =>
                Object.freeze({ ...w, coord: Object.freeze({ ...w.coord }) }),
            ),
        ),
        visibleWitnessIds: Object.freeze([...report.visibleWitnessIds]),
        audibleWitnessIds: Object.freeze([...report.audibleWitnessIds]),
    }) as SpatialIncidentReport
}

export function resetSpatialIncidentState(model?: {
    lastIncidentReport?: unknown
    incidentReceiptCount?: number
}): { cleared: boolean } {
    if (model !== undefined && model !== null && typeof model === 'object') {
        try {
            ;(model as Record<string, unknown>).lastIncidentReport = null
            ;(model as Record<string, unknown>).incidentReceiptCount = 0
        } catch {
            // ignore frozen models
        }
    }
    return { cleared: true }
}

export const initIncident = (
    cpy: IncidentModel,
    bal?: IncidentBit,
    _ste?: State,
): IncidentModel => {
    if (bal?.slv) {
        bal.slv({ incBit: { idx: 'init-incident-ok', val: 1 } })
    }
    return cpy
}

export const updateIncident = (
    cpy: IncidentModel,
    bal?: IncidentBit,
    _ste?: State,
): IncidentModel => {
    const dat = (bal?.dat ?? {}) as Record<string, unknown>
    if (dat.witnessInput !== undefined || dat.incidentInput !== undefined) {
        try {
            const raw = (dat.witnessInput ??
                dat.incidentInput) as IncidentWitnessInput
            const report = evaluateSpatialIncidentWitnesses(raw)
            cpy.lastIncidentReport = report as never
            cpy.incidentReceiptCount = (cpy.incidentReceiptCount ?? 0) + 1
            if (bal?.slv) {
                bal.slv({
                    incBit: {
                        idx: 'evaluate-incident-witnesses-ok',
                        val: 1,
                        dat: { report },
                    },
                })
            }
            return cpy
        } catch (err) {
            if (bal?.slv) {
                bal.slv({
                    incBit: {
                        idx: 'evaluate-incident-witnesses-fail',
                        val: 0,
                        dat: {
                            error:
                                err instanceof Error
                                    ? err.message
                                    : String(err),
                        },
                    },
                })
            }
            return cpy
        }
    }
    if (bal?.slv) {
        bal.slv({ incBit: { idx: 'update-incident-ok', val: 1 } })
    }
    return cpy
}

export function unpackIncidentCell(packed: number): AxialCoord {
    return unpackAxial(packed as never)
}

function sanitizeLocationName(raw: string): string {
    const ascii = String(raw || '')
        .replace(/[^\x20-\x7E]/g, '')
        .toUpperCase()
        .replace(/[^A-Z0-9 ]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    if (ascii.length === 0) return 'UNKNOWN LOCATION'
    return ascii.slice(0, 64)
}

function toAsciiLine(value: string): string {
    return String(value || '')
        .replace(/[^\x20-\x7E]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
}

export function buildSpatialEventStageBrief(
    report: SpatialIncidentReport,
    locSpec: StageBriefLocationSpec,
): SpatialEventStageBrief {
    SpatialIncidentReportSchema.parse({
        locationId: report.locationId,
        originCoord: report.originCoord,
        clockTimeHm: report.clockTimeHm,
        diurnalDaypart: report.diurnalDaypart,
        diurnalProfile: report.diurnalProfile,
        witnesses: [...report.witnesses],
        visibleWitnessIds: [...report.visibleWitnessIds],
        audibleWitnessIds: [...report.audibleWitnessIds],
    })
    if (
        locSpec === null ||
        typeof locSpec !== 'object' ||
        typeof locSpec.locationId !== 'string' ||
        typeof locSpec.locationName !== 'string'
    ) {
        throw new Error(
            'INVALID_STAGE_LOCATION: locationId plus locationName required',
        )
    }
    const intExt = locSpec.isExterior === true ? 'EXT.' : 'INT.'
    const cleanName = sanitizeLocationName(locSpec.locationName)
    const sluglineToken = toAsciiLine(
        `${intExt} ${cleanName} - ${report.diurnalDaypart} (${report.clockTimeHm})`,
    )
    const luminance = report.diurnalProfile.ambientLuminanceBps
    let lightingActionLine = ''
    if (luminance <= 2500) {
        lightingActionLine = toAsciiLine(
            `Lantern shadows crawl across cold stone; gloom holds at ${luminance} bps.`,
        )
    } else if (luminance >= 8000) {
        lightingActionLine = toAsciiLine(
            `Sharp daylight glare floods the hall; bright shafts cut at ${luminance} bps.`,
        )
    } else {
        lightingActionLine = toAsciiLine(
            `Muted ${report.diurnalDaypart} light filters through high windows at ${luminance} bps.`,
        )
    }
    const floorBase = locSpec.acousticFloorCdb ?? 3000
    const totalNoise = floorBase + report.diurnalProfile.diurnalNoiseDeltaCdb
    const acousticActionLine =
        totalNoise >= 3000
            ? toAsciiLine(
                  `A low reverberant hum fills the chamber (${totalNoise} cdB).`,
              )
            : toAsciiLine(
                  `A hushed stillness settles over stone (${totalNoise} cdB).`,
              )
    const blockingBeats: string[] = []
    blockingBeats.push(
        toAsciiLine(
            `BEAT: EVENT ORIGIN at (${report.originCoord.q}, ${report.originCoord.r}) severity logged.`,
        ),
    )
    const sorted = [...report.witnesses].sort((a, b) =>
        a.actorId.localeCompare(b.actorId),
    )
    for (const w of sorted) {
        const seen = w.sawEvent
            ? 'SEES event clearly'
            : `SIGHT BLOCKED (${w.occlusionReason})`
        const heard = w.heardEvent ? 'HEARS event' : 'OUT OF EARSHOT'
        blockingBeats.push(
            toAsciiLine(
                `BEAT: ${w.actorId} holds at (${w.coord.q}, ${w.coord.r}) - ${seen}; ${heard}.`,
            ),
        )
    }
    const anySeen = sorted.some((w) => w.sawEvent)
    const witnessParentheticalHint = anySeen
        ? '(glancing sharply across the room)'
        : '(listening through the wall)'
    const exitTransitionHint = 'CUT TO:'
    const brief = {
        sluglineToken,
        intExt,
        lightingActionLine,
        acousticActionLine,
        blockingBeats,
        witnessParentheticalHint,
        exitTransitionHint,
    }
    return SpatialEventStageBriefSchema.parse(brief) as SpatialEventStageBrief
}

void createAxialCoord
void toAsciiToken
void toBasisPoints
