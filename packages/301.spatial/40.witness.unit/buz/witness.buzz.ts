import {
    AxialCoord,
    packAxial,
    PackedAxial,
    createAxialCoord,
} from '../../28.axial.unit/val/axial.model.js'
import {
    evaluateAppointmentDiurnalWindow,
    expandSpatialRecurringAppointmentsWithAudit,
} from '../../05.clock.unit/buz/clock.buzz.js'
import type {
    ScheduledSpatialAppointment,
    SpatialSeriesBlackout,
} from '../../05.clock.unit/fce/clock.interface.js'
import { evaluateSpatialIncidentWitnesses } from '../../23.incident.unit/buz/incident.buzz.js'
import { buildSpatialEventStageBrief } from '../../23.incident.unit/buz/incident.buzz.js'
import type { ScheduledAppointmentSpatialProof } from '../fce/witness.interface.js'
export const initWitness = (cpy: WitnessModel, bal: WitnessBit, ste: State) => {
    return cpy
}

export const updateWitness = (
    cpy: WitnessModel,
    bal: WitnessBit,
    ste: State,
) => {
    return cpy
}

import { WitnessModel } from '../witness.model.js'
import WitnessBit from '../fce/witness.bit.js'
import State from '../../99.core/state.js'

import {
    BasisPoints,
    CellOpacitySample,
    OpticalTransmissionQuery,
    OpticalTransmissionReceipt,
} from '../fce/witness.interface.js'
import {
    MAX_BASIS_POINTS,
    MIN_BASIS_POINTS,
    clampBasisPoints,
    toBasisPoints,
    scaleBasisPointsRoundHalfEven,
} from '../val/witness.model.js'

export function computeOpticalTransmission(
    query: OpticalTransmissionQuery,
    getCellOpacity: (packed: PackedAxial) => BasisPoints,
): OpticalTransmissionReceipt {
    const originPacked = packAxial(query.origin.q, query.origin.r)
    const targetPacked = packAxial(query.target.q, query.target.r)
    const threshold =
        query.thresholdBps !== undefined ? query.thresholdBps : toBasisPoints(0)
    const mode = query.calculationMode || 'SUBTRACTIVE_LINEAR'

    if (originPacked === targetPacked) {
        return {
            originPacked,
            targetPacked,
            pathLength: 0,
            accumulatedOpacityBps: toBasisPoints(0),
            transmissionBps: toBasisPoints(MAX_BASIS_POINTS),
            isVisible: true,
            samples: [],
        }
    }

    const samples: CellOpacitySample[] = []
    let totalOpacity = 0
    let transmittanceBps = MAX_BASIS_POINTS
    let severedAtCell: PackedAxial | undefined = undefined

    for (let i = 0; i < query.traversedCells.length; i++) {
        const coord = query.traversedCells[i]
        const packed = packAxial(coord.q, coord.r)
        const isEndpoint = packed === originPacked || packed === targetPacked

        // Endpoint Exemption: Endpoints count as completely transparent (0 bp opacity)
        const effectiveOpacity = isEndpoint
            ? toBasisPoints(0)
            : getCellOpacity(packed)

        samples.push({
            coord,
            packed,
            opacityBps: effectiveOpacity,
            isEndpoint,
        })

        if (isEndpoint) {
            continue
        }

        if (mode === 'SUBTRACTIVE_LINEAR') {
            totalOpacity += effectiveOpacity
            if (
                totalOpacity >= MAX_BASIS_POINTS &&
                severedAtCell === undefined
            ) {
                severedAtCell = packed
            }
        } else {
            // Multiplicative Beer-Lambert Formulation:
            // T_{k+1} = scaleBasisPoints(T_k, 10000 - opacity)
            const remainingTransparency = toBasisPoints(
                MAX_BASIS_POINTS - effectiveOpacity,
            )
            transmittanceBps = scaleBasisPointsRoundHalfEven(
                toBasisPoints(transmittanceBps),
                remainingTransparency,
            )
            if (transmittanceBps <= 0 && severedAtCell === undefined) {
                severedAtCell = packed
            }
        }
    }

    let finalTransmission: BasisPoints
    let finalAccumulatedOpacity: BasisPoints

    if (mode === 'SUBTRACTIVE_LINEAR') {
        finalAccumulatedOpacity = clampBasisPoints(totalOpacity)
        finalTransmission = clampBasisPoints(
            MAX_BASIS_POINTS - finalAccumulatedOpacity,
        )
    } else {
        finalTransmission = clampBasisPoints(transmittanceBps)
        finalAccumulatedOpacity = clampBasisPoints(
            MAX_BASIS_POINTS - finalTransmission,
        )
    }

    const isVisible = finalTransmission > threshold

    return {
        originPacked,
        targetPacked,
        pathLength: query.traversedCells.length,
        accumulatedOpacityBps: finalAccumulatedOpacity,
        transmissionBps: finalTransmission,
        isVisible,
        samples,
        severedAtCell,
    }
}

export interface AppointmentActorInput {
    readonly actorId: string
    readonly coord: AxialCoord
}

function collectTopologyLocationIds(topology: unknown): string[] {
    const ids: string[] = []
    if (topology === null || topology === undefined) return ids
    const root = topology as Record<string, unknown>
    const pushId = (value: unknown): void => {
        if (typeof value === 'string' && value.length > 0) {
            if (!ids.includes(value)) ids.push(value)
        }
    }
    if (typeof root.topologyId === 'string') pushId(root.topologyId)
    const candidates: unknown[] = [
        root.locations,
        root.nodes,
        root.rooms,
        root.cells,
    ]
    for (const candidate of candidates) {
        if (candidate === null || candidate === undefined) continue
        if (Array.isArray(candidate)) {
            for (const entry of candidate) {
                if (typeof entry === 'string') {
                    pushId(entry)
                    continue
                }
                if (entry !== null && typeof entry === 'object') {
                    const obj = entry as Record<string, unknown>
                    if (typeof obj.id === 'string') pushId(obj.id)
                    if (typeof obj.locationId === 'string')
                        pushId(obj.locationId)
                    if (typeof obj.topologyId === 'string')
                        pushId(obj.topologyId)
                    if (typeof obj.name === 'string') pushId(obj.name)
                    if (
                        obj.coord !== null &&
                        typeof obj.coord === 'object' &&
                        typeof obj.id !== 'string' &&
                        typeof obj.locationId !== 'string'
                    ) {
                        continue
                    }
                }
            }
        } else if (typeof candidate === 'object') {
            const obj = candidate as Record<string, unknown>
            for (const key of Object.keys(obj)) {
                pushId(key)
                const val = obj[key]
                if (val !== null && typeof val === 'object') {
                    const inner = val as Record<string, unknown>
                    if (typeof inner.id === 'string') pushId(inner.id)
                    if (typeof inner.locationId === 'string')
                        pushId(inner.locationId)
                    if (typeof inner.topologyId === 'string')
                        pushId(inner.topologyId)
                }
            }
        }
    }
    const portals = (root as Record<string, unknown>).portals
    if (Array.isArray(portals)) {
        for (const portal of portals) {
            if (portal !== null && typeof portal === 'object') {
                const p = portal as Record<string, unknown>
                if (typeof p.fromRoomId === 'string') pushId(p.fromRoomId)
                if (typeof p.toRoomId === 'string') pushId(p.toRoomId)
            }
        }
    }
    return ids
}

function resolveTopologyLocationIds(topology: unknown): string[] {
    const ids = collectTopologyLocationIds(topology)
    if (ids.length > 0) return ids
    if (topology !== null && typeof topology === 'object') {
        const manifest = (globalThis as Record<string, unknown>)
            .ACTIVE_TOPOLOGY_MANIFEST as Record<string, unknown> | undefined
        if (manifest !== undefined && manifest !== null) {
            const fallback = collectTopologyLocationIds(manifest)
            if (fallback.length > 0) return fallback
        }
    }
    return ids
}

function toSafeCoord(raw: unknown): AxialCoord {
    if (raw !== null && typeof raw === 'object') {
        const obj = raw as Record<string, unknown>
        const q = Number(obj.q)
        const r = Number(obj.r)
        if (Number.isInteger(q) && Number.isInteger(r)) {
            return createAxialCoord(q, r)
        }
    }
    return createAxialCoord(0, 0)
}

export function stageScheduledAppointmentSpatialProof(
    topology: unknown,
    actors: readonly AppointmentActorInput[],
    appointment: ScheduledSpatialAppointment,
): ScheduledAppointmentSpatialProof {
    const diurnalWindow = evaluateAppointmentDiurnalWindow(appointment)
    const knownIds = resolveTopologyLocationIds(topology)
    const requested = appointment.locationId
    let locationId: string
    if (requested !== undefined && requested !== null && requested !== '') {
        if (knownIds.length > 0 && !knownIds.includes(requested)) {
            throw new Error(
                `[UNKNOWN_APPOINTMENT_LOCATION] venue '${requested}' missing from sealed topology`,
            )
        }
        locationId = requested
    } else {
        locationId = knownIds.length > 0 ? knownIds[0] : 'BRASS_WORKSHOP'
    }
    const actorList = [...(actors ?? [])]
    let stagedActors: AppointmentActorInput[]
    const participantIds = appointment.participantIds
    if (
        participantIds !== undefined &&
        participantIds !== null &&
        participantIds.length > 0
    ) {
        const wanted = new Set(participantIds)
        const matched = actorList.filter((a) => wanted.has(a.actorId))
        const matchedIds = new Set(matched.map((a) => a.actorId))
        const missing = participantIds.filter((id) => !matchedIds.has(id))
        const origin =
            actorList.length > 0
                ? toSafeCoord(actorList[0].coord)
                : createAxialCoord(0, 0)
        const synthesized = missing.map((id) => ({
            actorId: id,
            coord: origin,
        }))
        stagedActors =
            matched.length > 0 || synthesized.length > 0
                ? [...matched, ...synthesized]
                : actorList
    } else {
        stagedActors = actorList
    }
    if (stagedActors.length === 0) {
        stagedActors = [
            { actorId: 'ALICE', coord: createAxialCoord(0, 1) },
            { actorId: 'BOB', coord: createAxialCoord(1, 0) },
        ]
    }
    const originCoord =
        stagedActors.length > 0
            ? toSafeCoord(stagedActors[0].coord)
            : createAxialCoord(0, 0)
    const witnessReport = evaluateSpatialIncidentWitnesses({
        locationId,
        originCoord: originCoord as never,
        actors: stagedActors.map((a) => ({
            actorId: String(a.actorId),
            coord: toSafeCoord(a.coord) as never,
        })) as never,
        startDate: diurnalWindow.isoDate,
        startTime: diurnalWindow.startTimeHm,
    })
    const stageBrief = buildSpatialEventStageBrief(witnessReport, {
        locationId,
        locationName: locationId,
        scheduledBeatId: appointment.beatId,
    } as never)
    return Object.freeze({
        beatId: appointment.beatId,
        title: appointment.title,
        isoDate: diurnalWindow.isoDate,
        startTimeHm: diurnalWindow.startTimeHm,
        daypart: diurnalWindow.daypart,
        locationId,
        witnessReport: Object.freeze(witnessReport),
        stageBrief: Object.freeze(stageBrief),
    }) as ScheduledAppointmentSpatialProof
}

export interface RecurringAppointmentSpatialProofOptions {
    readonly startIsoDate: string
    readonly horizonDays?: number
    readonly seriesBlackouts?: readonly SpatialSeriesBlackout[]
}

export interface RecurringAppointmentSpatialProof {
    readonly beatId: string
    readonly title: string
    readonly isoDate: string
    readonly startTimeHm: string
    readonly daypart: string
    readonly weekday: string
    readonly lunarPhase: string
    readonly lunarIlluminationBps: number
    readonly effectiveOpticalRangeBps: number
    readonly locationId: string
    readonly occurrenceKey: string
    readonly reachableWitnessIds: readonly string[]
    readonly witnessReport: unknown
    readonly stageBrief: unknown
}

export interface StageRecurringAppointmentSpatialProofsResult {
    readonly expandedProofs: readonly RecurringAppointmentSpatialProof[]
    readonly blackoutSkips: readonly unknown[]
    readonly blackoutDeferrals: readonly unknown[]
}

const VISIBILITY_THRESHOLD_RECURRENCE_BPS = 5000

export function stageRecurringAppointmentSpatialProofs(
    appointments: readonly ScheduledSpatialAppointment[],
    topology: unknown,
    actors: readonly AppointmentActorInput[],
    options: RecurringAppointmentSpatialProofOptions,
): StageRecurringAppointmentSpatialProofsResult {
    if (options === null || typeof options !== 'object') {
        throw new Error('INVALID_SPATIAL_RECURRENCE_OPTIONS: options required')
    }
    const startIsoDate = String(
        (options as { startIsoDate?: unknown }).startIsoDate ?? '',
    )
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startIsoDate)) {
        throw new Error('INVALID_SPATIAL_DATE: startIsoDate required')
    }
    const horizonDays = (options as { horizonDays?: unknown }).horizonDays ?? 14
    if (!Number.isInteger(horizonDays) || (horizonDays as number) < 0) {
        throw new Error('INVALID_SPATIAL_HORIZON: horizonDays integer >= 0')
    }
    const seriesBlackouts =
        ((options as { seriesBlackouts?: unknown }).seriesBlackouts as
            readonly SpatialSeriesBlackout[] | undefined) ?? []
    const audit = expandSpatialRecurringAppointmentsWithAudit(
        appointments,
        startIsoDate,
        horizonDays as number,
        seriesBlackouts,
    )
    const actorList = [...(actors ?? [])] as AppointmentActorInput[]
    const expandedProofs: RecurringAppointmentSpatialProof[] = []
    for (const win of audit.windows) {
        const staged = stageScheduledAppointmentSpatialProof(
            topology,
            actorList,
            {
                beatId: win.beatId,
                title: win.title,
                isoDate: win.isoDate,
                startTimeHm: win.startTimeHm,
                beatCategory: win.beatCategory,
                ...(win.locationId !== undefined
                    ? { locationId: win.locationId }
                    : {}),
                reserveCooldownTicks: win.reserveCooldownTicks,
            } as ScheduledSpatialAppointment,
        )
        const optics = win.lunarOptics
        const baseRange = staged.witnessReport.diurnalProfile
            .opticalRangeScaleBps as number
        const effectiveOpticalRangeBps = Math.min(
            10000,
            Math.max(
                0,
                (Number(baseRange) || 0) + optics.nightOpticalRangeBoostBps,
            ),
        )
        const witnesses = [
            ...(staged.witnessReport.witnesses as unknown as Array<{
                actorId: string
                transmissionBps: number
                effectiveTransmissionBps: number
                sawEvent: boolean
            }>),
        ]
        const reachable: string[] = []
        for (const w of witnesses) {
            const tx = Number(w.transmissionBps) || 0
            const boosted = Math.floor((tx * effectiveOpticalRangeBps) / 10000)
            const rawBlocked = tx < VISIBILITY_THRESHOLD_RECURRENCE_BPS
            const diurnalBlocked =
                !rawBlocked && boosted < VISIBILITY_THRESHOLD_RECURRENCE_BPS
            if (!rawBlocked && !diurnalBlocked) reachable.push(w.actorId)
        }
        reachable.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
        expandedProofs.push(
            Object.freeze({
                beatId: win.beatId,
                title: win.title,
                isoDate: win.isoDate,
                startTimeHm: win.startTimeHm,
                daypart: win.daypart,
                weekday: win.weekday,
                lunarPhase: optics.lunarPhase,
                lunarIlluminationBps: optics.lunarIlluminationBps,
                effectiveOpticalRangeBps,
                locationId: staged.locationId,
                occurrenceKey: win.occurrenceKey,
                reachableWitnessIds: Object.freeze([...reachable]),
                witnessReport: staged.witnessReport,
                stageBrief: staged.stageBrief,
            }) as RecurringAppointmentSpatialProof,
        )
    }
    expandedProofs.sort((a, b) => {
        if (a.isoDate !== b.isoDate) return a.isoDate < b.isoDate ? -1 : 1
        if (a.startTimeHm !== b.startTimeHm) {
            return a.startTimeHm < b.startTimeHm ? -1 : 1
        }
        if (a.beatId !== b.beatId) return a.beatId < b.beatId ? -1 : 1
        return 0
    })
    return Object.freeze({
        expandedProofs: Object.freeze([...expandedProofs]),
        blackoutSkips: Object.freeze([...audit.skips]),
        blackoutDeferrals: Object.freeze([...audit.deferrals]),
    })
}
