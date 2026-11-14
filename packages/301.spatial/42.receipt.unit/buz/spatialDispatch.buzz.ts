import * as fs from 'node:fs'
import * as path from 'node:path'
import type State from '../../99.core/state.js'
import { parseSpatialClockSnapshot } from '../../05.clock.unit/buz/clock.buzz.js'
import type { SpatialClockSnapshot } from '../../05.clock.unit/fce/clock.interface.js'
import { isValidChronologyStamp } from './receipt.buzz.js'
import type { SpatialChronologyStamp } from '../fce/receipt.interface.js'
import {
    canonicalizeJson,
    computeSha256Hex,
} from '../../19.ledger.unit/buz/ledger.buzz.js'
import type {
    SpatialBatchEventInput,
    SpatialEventProofPacket,
} from '../fce/receipt.interface.js'
import { evaluateSpatialIncidentWitnesses } from '../../23.incident.unit/buz/incident.buzz.js'
import { buildSpatialEventStageBrief } from '../../23.incident.unit/buz/incident.buzz.js'
import { resetSpatialIncidentState } from '../../23.incident.unit/buz/incident.buzz.js'
import { evaluateAgendaDiurnalSchedule } from '../../05.clock.unit/buz/clock.buzz.js'
import type {
    ScheduledSpatialAppointment,
    SpatialSeriesBlackout,
} from '../../05.clock.unit/fce/clock.interface.js'
import { stageScheduledAppointmentSpatialProof } from '../../40.witness.unit/buz/witness.buzz.js'
import { stageRecurringAppointmentSpatialProofs } from '../../40.witness.unit/buz/witness.buzz.js'

const UPDATE_CONSOLE = '[Console action] Update Console'

function emitConsole(ste: State | undefined, line: string): void {
    const cleanLine = String(line || '')
        .replace(/[^\x20-\x7E]/g, '')
        .trim()
    const lib = (globalThis as any).LIBRARY || (global as any).LIBRARY
    if (lib && typeof lib.hunt === 'function') {
        lib.hunt(UPDATE_CONSOLE, { idx: 'cns00', src: cleanLine })
        return
    }
    if (ste && typeof ste.hunt === 'function') {
        ste.hunt(UPDATE_CONSOLE, { idx: 'cns00', src: cleanLine })
    }
}

export interface SpatialDispatchPayload {
    readonly seriesSlug: string
    readonly receiptData: {
        readonly topology_hash: string
        readonly overlay_hash: string
        readonly query_hash: string
        readonly receipt_hash: string
        readonly kernel_version: string
        readonly metrics: Record<string, any>
    }
    readonly targetEngineRoot?: string
}

export interface SpatialChronologyOptions {
    readonly startDate?: string
    readonly startTime?: string
    readonly timezoneLabel?: string
    readonly chronology?: SpatialChronologyStamp
    readonly activeSnapshot?: SpatialClockSnapshot
}

function clampBps(value: number): number {
    if (!Number.isInteger(value)) value = Math.trunc(value)
    if (value < 0) return 0
    if (value > 10000) return 10000
    return value
}

export function buildSpatialChronologyStamp(
    input?: SpatialChronologyOptions,
): SpatialChronologyStamp {
    if (input?.chronology !== undefined) {
        if (!isValidChronologyStamp(input.chronology)) {
            throw new Error(
                '[CHRONOLOGY_SCHEMA_BREACH] provided chronology stamp violates integer daypart contract',
            )
        }
        return Object.freeze({ ...input.chronology })
    }
    const snapshot = input?.activeSnapshot
    if (snapshot !== undefined) {
        const stamp: SpatialChronologyStamp = {
            start_date: snapshot.startDate,
            start_time_hm: snapshot.clockTimeHm,
            daypart: snapshot.daypart,
            ambient_luminance_bps: clampBps(
                snapshot.diurnalProfile.ambientLuminanceBps,
            ),
            optical_range_scale_bps: clampBps(
                snapshot.diurnalProfile.opticalRangeScaleBps,
            ),
            diurnal_noise_delta_cdb:
                snapshot.diurnalProfile.diurnalNoiseDeltaCdb,
            timezone_label: snapshot.timezoneLabel,
        }
        if (!isValidChronologyStamp(stamp)) {
            throw new Error(
                '[CHRONOLOGY_SCHEMA_BREACH] active snapshot yields invalid stamp',
            )
        }
        return Object.freeze(stamp)
    }
    const parsed = parseSpatialClockSnapshot({
        startDate: input?.startDate,
        startTime: input?.startTime,
        timezoneLabel: input?.timezoneLabel,
    })
    const stamp: SpatialChronologyStamp = {
        start_date: parsed.startDate,
        start_time_hm: parsed.clockTimeHm,
        daypart: parsed.daypart,
        ambient_luminance_bps: clampBps(
            parsed.diurnalProfile.ambientLuminanceBps,
        ),
        optical_range_scale_bps: clampBps(
            parsed.diurnalProfile.opticalRangeScaleBps,
        ),
        diurnal_noise_delta_cdb: parsed.diurnalProfile.diurnalNoiseDeltaCdb,
        timezone_label: parsed.timezoneLabel,
    }
    return Object.freeze(stamp)
}

function readChronologyOptions(bal: any): {
    hasChronology: boolean
    stamp?: SpatialChronologyStamp
} {
    const dat = (bal?.dat ?? {}) as Record<string, unknown>
    const directChronology = dat.chronology as unknown
    if (directChronology !== undefined) {
        if (!isValidChronologyStamp(directChronology)) {
            throw new Error(
                '[CHRONOLOGY_SCHEMA_BREACH] dispatch chronology stamp invalid',
            )
        }
        return {
            hasChronology: true,
            stamp: Object.freeze({
                ...(directChronology as object),
            }) as SpatialChronologyStamp,
        }
    }
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
    const activeSnapshot =
        (dat.activeSnapshot as SpatialClockSnapshot | undefined) ??
        (dat.snapshot as SpatialClockSnapshot | undefined) ??
        (globalThis as any).ACTIVE_SPATIAL_CLOCK_SNAPSHOT ??
        (globalThis as any).ACTIVE_CLOCK_SNAPSHOT
    if (
        startDate !== undefined ||
        startTime !== undefined ||
        timezoneLabel !== undefined
    ) {
        return {
            hasChronology: true,
            stamp: buildSpatialChronologyStamp({
                startDate,
                startTime,
                timezoneLabel,
            }),
        }
    }
    if (activeSnapshot !== undefined && activeSnapshot !== null) {
        const snap = activeSnapshot as SpatialClockSnapshot
        if (
            typeof snap.startDate === 'string' &&
            typeof snap.clockTimeHm === 'string' &&
            snap.diurnalProfile !== undefined
        ) {
            return {
                hasChronology: true,
                stamp: buildSpatialChronologyStamp({
                    activeSnapshot: snap,
                }),
            }
        }
    }
    return { hasChronology: false }
}

function applyDiurnalModifiers(
    metrics: Record<string, any>,
    stamp: SpatialChronologyStamp,
): Record<string, any> {
    const out: Record<string, any> = { ...(metrics ?? {}) }
    out.daypart = stamp.daypart
    out.ambient_luminance_bps = clampBps(stamp.ambient_luminance_bps)
    out.optical_range_scale_bps = clampBps(stamp.optical_range_scale_bps)
    out.diurnal_noise_delta_cdb = stamp.diurnal_noise_delta_cdb
    if (
        typeof out.snr_margin_cdb === 'number' &&
        Number.isInteger(out.snr_margin_cdb)
    ) {
        out.effective_snr_margin_cdb =
            out.snr_margin_cdb + stamp.diurnal_noise_delta_cdb
    } else {
        out.effective_snr_margin_cdb = stamp.diurnal_noise_delta_cdb
    }
    if (
        typeof out.transmission_bps === 'number' &&
        Number.isInteger(out.transmission_bps)
    ) {
        out.effective_transmission_bps = Math.trunc(
            (out.transmission_bps * stamp.optical_range_scale_bps) / 10000,
        )
    }
    return out
}

export function resolveDefaultEngineRoot(
    startDir: string = process.cwd(),
): string {
    let cursor = path.resolve(startDir)
    for (let depth = 0; depth < 5; depth++) {
        const hasPackages = fs.existsSync(path.join(cursor, 'packages'))
        const hasApps = fs.existsSync(path.join(cursor, 'apps'))
        if (hasPackages && hasApps) {
            return path.resolve(cursor, '..', '000.series-sower-engine')
        }
        const parent = path.dirname(cursor)
        if (parent === cursor) break
        cursor = parent
    }
    return path.resolve(startDir, '..', '000.series-sower-engine')
}

export const dispatchSpatialPayloadsDownstream = async (
    cpy: any,
    bal: any,
    ste?: State,
): Promise<any> => {
    const dat = bal?.dat || {}
    const seriesSlug = bal?.src || dat.seriesSlug || 'gotham-trinity-crisis'
    const receiptData = dat.receiptData || {
        topology_hash: '0'.repeat(64),
        overlay_hash: '0'.repeat(64),
        query_hash: '0'.repeat(64),
        receipt_hash: '0'.repeat(64),
        kernel_version: 'v0.1.4',
        metrics: { max_cells_expanded: 512, cost_units: 142 },
    }

    emitConsole(
        ste,
        `>> [SPATIAL:DISPATCH] Staging spatial proof payload for '${seriesSlug}' into engine...`,
    )

    const targetEngineRoot =
        dat.targetEngineRoot || resolveDefaultEngineRoot(process.cwd())

    try {
        let chronology: SpatialChronologyStamp | undefined
        try {
            const resolved = readChronologyOptions(bal)
            if (resolved.hasChronology) chronology = resolved.stamp
        } catch (chronoErr: any) {
            const msg =
                chronoErr instanceof Error
                    ? chronoErr.message
                    : String(chronoErr)
            emitConsole(
                ste,
                `:: [SPATIAL_DISPATCH_FAULT] Invalid chronology options: ${msg}`,
            )
            if (bal?.slv) {
                bal.slv({
                    rcpBit: {
                        idx: 'spatial-dispatch-error',
                        val: -1,
                        dat: { error: msg },
                    },
                })
            }
            return cpy
        }

        if (!fs.existsSync(targetEngineRoot)) {
            emitConsole(
                ste,
                `>> [SPATIAL:WARN] Target engine root not found at ${targetEngineRoot}`,
            )
            if (bal?.slv) {
                bal.slv({
                    rcpBit: {
                        idx: 'spatial-dispatch-no-engine',
                        val: 0,
                        dat: { error: 'ENGINE_ROOT_ABSENT', targetEngineRoot },
                    },
                })
            }
            return cpy
        }

        const stagingDestination = path.join(
            targetEngineRoot,
            'data',
            'spatial',
            seriesSlug,
            `spatial_proof_${Date.now()}.json`,
        )

        const effectiveMetrics =
            chronology !== undefined
                ? applyDiurnalModifiers(receiptData.metrics ?? {}, chronology)
                : (receiptData.metrics ?? {})

        const quadruple = {
            topology_hash: receiptData.topology_hash,
            overlay_hash: receiptData.overlay_hash,
            query_hash: receiptData.query_hash,
            receipt_hash: receiptData.receipt_hash,
        }

        let proofDigest = quadruple.receipt_hash
        if (chronology !== undefined) {
            proofDigest = computeSha256Hex(
                canonicalizeJson({
                    kernel_version: receiptData.kernel_version,
                    metrics: effectiveMetrics,
                    series_slug: seriesSlug,
                    spatial_audit_quadruple: quadruple,
                    chronology,
                }),
            )
            quadruple.receipt_hash = proofDigest
        }

        const payload: Record<string, unknown> = {
            series_slug: seriesSlug,
            spatial_audit_quadruple: quadruple,
            kernel_version: receiptData.kernel_version,
            metrics: effectiveMetrics,
            dispatched_at: new Date().toISOString(),
        }
        if (chronology !== undefined) {
            payload.chronology = chronology
            payload.proof_digest = proofDigest
        }

        fs.mkdirSync(path.dirname(stagingDestination), { recursive: true })
        fs.writeFileSync(
            stagingDestination,
            JSON.stringify(payload, null, 2),
            'utf-8',
        )

        const relStagingPath = path
            .relative(targetEngineRoot, stagingDestination)
            .replace(/\\/g, '/')
        emitConsole(
            ste,
            `>> [SPATIAL:DISPATCH] [OK] Staged spatial proof payload -> ${relStagingPath}`,
        )

        if (bal?.slv) {
            bal.slv({
                rcpBit: {
                    idx: 'spatial-dispatch-success',
                    val: 1,
                    src: seriesSlug,
                    dat: {
                        dispatched: true,
                        seriesSlug,
                        stagingDestination,
                        timestamp: new Date().toISOString(),
                        ...(chronology !== undefined
                            ? { chronology, proofDigest }
                            : {}),
                    },
                },
            })
        }
    } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err)
        emitConsole(
            ste,
            `:: [SPATIAL_DISPATCH_FAULT] Failed to stage proof: ${errorMsg}`,
        )
        if (bal?.slv) {
            bal.slv({
                rcpBit: {
                    idx: 'spatial-dispatch-error',
                    val: -1,
                    dat: { error: errorMsg },
                },
            })
        }
    }

    return cpy
}

function pad4(value: number): string {
    return String(Math.trunc(value)).padStart(4, '0')
}

function assertSafeBatchDir(outputDir: string): void {
    const raw = String(outputDir || '')
    if (raw.length === 0) {
        throw new Error('UNSAFE_SPATIAL_BATCH_DIR: empty output directory')
    }
    if (raw.includes('\0')) {
        throw new Error('UNSAFE_SPATIAL_BATCH_DIR: null byte rejected')
    }
    const parts = raw.split(/[\\/]/)
    if (parts.includes('..')) {
        throw new Error('UNSAFE_SPATIAL_BATCH_DIR: path traversal rejected')
    }
    const normalized = path.normalize(raw)
    if (normalized.split(path.sep).includes('..')) {
        throw new Error('UNSAFE_SPATIAL_BATCH_DIR: path traversal rejected')
    }
}

export function buildEventProofPacket(
    event: SpatialBatchEventInput,
): SpatialEventProofPacket {
    if (
        event === null ||
        typeof event !== 'object' ||
        !Number.isInteger(
            (event as unknown as Record<string, unknown>).eventSequence,
        ) ||
        !Number.isInteger((event as unknown as Record<string, unknown>).tick)
    ) {
        throw new Error(
            'INVALID_SPATIAL_BATCH_EVENT: sequence plus tick required',
        )
    }
    const seq = (event as SpatialBatchEventInput).eventSequence
    const tick = (event as SpatialBatchEventInput).tick
    if (seq < 0 || tick < 0) {
        throw new Error('INVALID_SPATIAL_BATCH_EVENT: negative sequence')
    }
    const locationId =
        (event as SpatialBatchEventInput).locationId || 'BRASS_WORKSHOP'
    const locationName =
        (event as SpatialBatchEventInput).locationName || locationId
    const originCoord = (event as SpatialBatchEventInput).originCoord
    const actors = (event as SpatialBatchEventInput).actors
    const startDate =
        (event as SpatialBatchEventInput).startDate || '2026-10-31'
    const startTime = (event as SpatialBatchEventInput).startTime || '21:00'
    const timezoneLabel =
        (event as SpatialBatchEventInput).timezoneLabel || 'UTC+00:00'
    const incidentReport = evaluateSpatialIncidentWitnesses({
        locationId,
        originCoord: originCoord as never,
        actors: actors as never,
        startDate,
        startTime,
        opaqueCells: ((event as SpatialBatchEventInput).opaqueCells ??
            []) as never,
        acousticSourceCdb: (event as SpatialBatchEventInput)
            .acousticSourceCdb as never,
        ambientNoiseFloorCdb: (event as SpatialBatchEventInput)
            .ambientNoiseFloorCdb as never,
    })
    const stageBrief = buildSpatialEventStageBrief(incidentReport, {
        locationId,
        locationName,
        isExterior: (event as SpatialBatchEventInput).isExterior,
        acousticFloorCdb: (event as SpatialBatchEventInput).acousticFloorCdb,
    })
    const chronology = buildSpatialChronologyStamp({
        startDate,
        startTime,
        timezoneLabel,
    })
    const payloadWithoutHash = {
        chronology,
        eventSequence: seq,
        incidentReport,
        stageBrief,
        tick,
    }
    const packetSha256 = computeSha256Hex(canonicalizeJson(payloadWithoutHash))
    return Object.freeze({
        chronology,
        eventSequence: seq,
        incidentReport: Object.freeze(
            incidentReport as unknown as Record<string, unknown>,
        ),
        packetSha256,
        stageBrief: Object.freeze(
            stageBrief as unknown as Record<string, unknown>,
        ),
        tick,
    }) as unknown as SpatialEventProofPacket
}

export interface SpatialEventBatchSummary {
    readonly packetCount: number
    readonly indexSha256: string
    readonly packetFiles: readonly string[]
    readonly outputDir: string
}

export function exportSpatialEventProofBatch(
    events: readonly SpatialBatchEventInput[],
    options: { outputDir: string },
    ste?: State,
): SpatialEventBatchSummary {
    if (!options || typeof options.outputDir !== 'string') {
        throw new Error('UNSAFE_SPATIAL_BATCH_DIR: outputDir required')
    }
    assertSafeBatchDir(options.outputDir)
    const sorted = [...(events ?? [])].sort((a, b) => {
        if (a.eventSequence !== b.eventSequence) {
            return a.eventSequence - b.eventSequence
        }
        return a.tick - b.tick
    })
    const packets = sorted.map((e) => buildEventProofPacket(e))
    fs.mkdirSync(options.outputDir, { recursive: true })
    const packetFiles: string[] = []
    const digests: string[] = []
    for (const packet of packets) {
        const fileName = `spatial_event_${pad4(packet.eventSequence)}_t${pad4(packet.tick)}.json`
        const filePath = path.join(options.outputDir, fileName)
        const content =
            JSON.stringify(packet, null, 2).replace(/\r/g, '') + '\n'
        fs.writeFileSync(filePath, content, 'utf-8')
        packetFiles.push(fileName)
        digests.push(packet.packetSha256)
    }
    packetFiles.sort((a, b) => a.localeCompare(b))
    digests.sort((a, b) => a.localeCompare(b))
    const indexSha256 = computeSha256Hex(
        canonicalizeJson({ digests, packets: packetFiles }),
    )
    const indexPayload = {
        indexSha256,
        packetCount: packets.length,
        packetFiles,
        packetSha256s: digests,
    }
    const indexContent =
        JSON.stringify(indexPayload, null, 2).replace(/\r/g, '') + '\n'
    fs.writeFileSync(
        path.join(options.outputDir, 'spatial_event_index.json'),
        indexContent,
        'utf-8',
    )
    emitConsole(
        ste,
        `>> [DISPATCH:EVENT_BATCH] Exported ${packets.length} proofs to ${options.outputDir}`,
    )
    return Object.freeze({
        indexSha256,
        outputDir: options.outputDir,
        packetCount: packets.length,
        packetFiles: Object.freeze([...packetFiles]),
    })
}

export function verifySpatialBatchReplayDeterminism(
    events: readonly SpatialBatchEventInput[],
    outputDir: string,
    ste?: State,
): {
    deterministic: boolean
    packetCount: number
    indexSha256: string
    mismatchedPackets: string[]
} {
    assertSafeBatchDir(outputDir)
    const first = exportSpatialEventProofBatch(events, { outputDir }, ste)
    const firstFiles = new Map<string, string>()
    for (const name of fs
        .readdirSync(outputDir)
        .sort((a, b) => a.localeCompare(b))) {
        if (
            name.startsWith('spatial_event_') ||
            name === 'spatial_event_index.json'
        ) {
            firstFiles.set(
                name,
                fs.readFileSync(path.join(outputDir, name), 'utf-8'),
            )
        }
    }
    const digestA = first.indexSha256
    fs.rmSync(outputDir, { recursive: true, force: true })
    resetSpatialIncidentState()
    const second = exportSpatialEventProofBatch(events, { outputDir }, ste)
    const digestB = second.indexSha256
    const mismatchedPackets: string[] = []
    for (const [name, bytesA] of firstFiles) {
        const fileB = path.join(outputDir, name)
        if (!fs.existsSync(fileB)) {
            mismatchedPackets.push(name)
            continue
        }
        const bytesB = fs.readFileSync(fileB, 'utf-8')
        if (bytesA !== bytesB) {
            mismatchedPackets.push(name)
        }
    }
    for (const name of fs
        .readdirSync(outputDir)
        .sort((a, b) => a.localeCompare(b))) {
        if (
            (name.startsWith('spatial_event_') ||
                name === 'spatial_event_index.json') &&
            !firstFiles.has(name)
        ) {
            mismatchedPackets.push(name)
        }
    }
    mismatchedPackets.sort((a, b) => a.localeCompare(b))
    const deterministic = mismatchedPackets.length === 0 && digestA === digestB
    if (deterministic) {
        emitConsole(ste, '>> [SPATIAL:REPLAY_OK] Replay parity certified')
    } else {
        emitConsole(ste, ':: [SPATIAL:REPLAY_FAIL] Replay divergence detected')
    }
    return {
        deterministic,
        indexSha256: digestB,
        mismatchedPackets,
        packetCount: second.packetCount,
    }
}

export interface ScheduledAgendaSpatialProofSummary {
    readonly proofCount: number
    readonly proofBatchSha256: string
    readonly proofFile: string
    readonly outputDir: string
}

export function exportScheduledAgendaSpatialProofs(
    topology: unknown,
    actors: ReadonlyArray<{ actorId: string; coord: unknown }>,
    appointments: readonly ScheduledSpatialAppointment[],
    outputDir: string,
    ste?: State,
): ScheduledAgendaSpatialProofSummary {
    assertSafeBatchDir(outputDir)
    const sorted = evaluateAgendaDiurnalSchedule(appointments ?? [])
    const proofs = sorted.map((appointment) => {
        const staged = stageScheduledAppointmentSpatialProof(
            topology,
            actors as never,
            appointment,
        )
        const proofSha256 = computeSha256Hex(
            canonicalizeJson({
                beatId: staged.beatId,
                daypart: staged.daypart,
                isoDate: staged.isoDate,
                locationId: staged.locationId,
                stageBrief: staged.stageBrief,
                startTimeHm: staged.startTimeHm,
                witnessReport: staged.witnessReport,
            }),
        )
        return Object.freeze({
            beatId: staged.beatId,
            daypart: staged.daypart,
            diurnalProfile:
                staged.witnessReport.diurnalProfile !== undefined
                    ? { ...staged.witnessReport.diurnalProfile }
                    : undefined,
            isoDate: staged.isoDate,
            locationId: staged.locationId,
            proofSha256,
            stageBrief: staged.stageBrief,
            startTimeHm: staged.startTimeHm,
            title: staged.title,
            witnessReport: staged.witnessReport,
        })
    })
    const digests = proofs.map(
        (p) => (p as { proofSha256: string }).proofSha256,
    )
    const proofBatchSha256 = computeSha256Hex(canonicalizeJson({ digests }))
    const payload = {
        proofBatchSha256,
        proofCount: proofs.length,
        proofs,
    }
    fs.mkdirSync(outputDir, { recursive: true })
    const proofFile = path.join(outputDir, 'agenda-spatial-proofs.json')
    const content = JSON.stringify(payload, null, 2).replace(/\r/g, '') + '\n'
    fs.writeFileSync(proofFile, content, 'utf-8')
    emitConsole(
        ste,
        `>> [SPATIAL:AGENDA_PROOF] count=${proofs.length} sha256=${proofBatchSha256.slice(0, 12)}`,
    )
    return Object.freeze({
        outputDir,
        proofBatchSha256,
        proofCount: proofs.length,
        proofFile,
    })
}

export function verifySpatialAgendaReplayEquivalence(
    topology: unknown,
    actors: ReadonlyArray<{ actorId: string; coord: unknown }>,
    appointments: readonly ScheduledSpatialAppointment[],
    outputDir: string,
    ste?: State,
): {
    deterministic: boolean
    proofCount: number
    proofBatchSha256: string
    mismatches: number
} {
    assertSafeBatchDir(outputDir)
    resetSpatialIncidentState()
    const first = exportScheduledAgendaSpatialProofs(
        topology,
        actors,
        appointments,
        outputDir,
        ste,
    )
    const proofFile = path.join(outputDir, 'agenda-spatial-proofs.json')
    const bytesA = fs.existsSync(proofFile)
        ? fs.readFileSync(proofFile, 'utf-8')
        : ''
    const digestA = first.proofBatchSha256
    if (fs.existsSync(proofFile)) {
        fs.rmSync(proofFile, { force: true })
    }
    resetSpatialIncidentState()
    const second = exportScheduledAgendaSpatialProofs(
        topology,
        actors,
        appointments,
        outputDir,
        ste,
    )
    const bytesB = fs.existsSync(proofFile)
        ? fs.readFileSync(proofFile, 'utf-8')
        : ''
    const digestB = second.proofBatchSha256
    const mismatches = bytesA === bytesB && digestA === digestB ? 0 : 1
    const deterministic = mismatches === 0
    if (deterministic) {
        emitConsole(
            ste,
            `>> [SPATIAL:AGENDA_REPLAY] Beats=${second.proofCount} SHA256=${digestB.slice(0, 12)} Mismatches=0`,
        )
    } else {
        emitConsole(
            ste,
            `>> [SPATIAL:AGENDA_REPLAY] Beats=${second.proofCount} SHA256=${digestB.slice(0, 12)} Mismatches=${mismatches}`,
        )
    }
    return Object.freeze({
        deterministic,
        mismatches,
        proofBatchSha256: digestB,
        proofCount: second.proofCount,
    })
}

export interface RecurringAgendaSpatialReceiptOptions {
    readonly appointments: readonly ScheduledSpatialAppointment[]
    readonly topology: unknown
    readonly actors: ReadonlyArray<{ actorId: string; coord: unknown }>
    readonly startIsoDate: string
    readonly horizonDays?: number
    readonly seriesBlackouts?: readonly SpatialSeriesBlackout[]
    readonly outputDir?: string
}

export interface RecurringAgendaSpatialReceiptSummary {
    readonly proofCount: number
    readonly recurrenceExpansionDigest: string
    readonly proofFile: string
    readonly outputDir: string
    readonly expandedProofs: readonly unknown[]
    readonly blackoutSkips: readonly unknown[]
    readonly blackoutDeferrals: readonly unknown[]
}

export function exportRecurringAgendaSpatialReceipt(
    options: RecurringAgendaSpatialReceiptOptions,
    ste?: State,
): RecurringAgendaSpatialReceiptSummary {
    if (options === null || typeof options !== 'object') {
        throw new Error('INVALID_SPATIAL_RECEIPT_OPTIONS: options required')
    }
    const appointments = (options as { appointments?: unknown }).appointments
    if (!Array.isArray(appointments)) {
        throw new Error(
            'INVALID_SPATIAL_RECEIPT_OPTIONS: appointments array required',
        )
    }
    const topology = (options as { topology?: unknown }).topology ?? {
        topologyId: 'BRASS_WORKSHOP',
        nodes: { BRASS_WORKSHOP: { id: 'BRASS_WORKSHOP' } },
    }
    const actors =
        ((options as { actors?: unknown }).actors as ReadonlyArray<{
            actorId: string
            coord: unknown
        }>) ?? []
    const startIsoDate = String(
        (options as { startIsoDate?: unknown }).startIsoDate ?? '',
    )
    const horizonDays = (options as { horizonDays?: unknown }).horizonDays ?? 14
    const seriesBlackouts =
        ((options as { seriesBlackouts?: unknown }).seriesBlackouts as
            readonly SpatialSeriesBlackout[] | undefined) ?? []
    const outputDir =
        ((options as { outputDir?: unknown }).outputDir as
            string | undefined) ?? process.cwd()
    const staged = stageRecurringAppointmentSpatialProofs(
        appointments as readonly ScheduledSpatialAppointment[],
        topology,
        actors as never,
        {
            startIsoDate,
            horizonDays: horizonDays as number,
            seriesBlackouts,
        },
    )
    const sorted = [...staged.expandedProofs].sort((a, b) => {
        const x = a as { isoDate: string; startTimeHm: string; beatId: string }
        const y = b as { isoDate: string; startTimeHm: string; beatId: string }
        if (x.isoDate !== y.isoDate) return x.isoDate < y.isoDate ? -1 : 1
        if (x.startTimeHm !== y.startTimeHm) {
            return x.startTimeHm < y.startTimeHm ? -1 : 1
        }
        if (x.beatId !== y.beatId) return x.beatId < y.beatId ? -1 : 1
        return 0
    })
    const recurrenceExpansionDigest = computeSha256Hex(canonicalizeJson(sorted))
    assertSafeBatchDir(outputDir)
    fs.mkdirSync(outputDir, { recursive: true })
    const proofFile = path.join(outputDir, 'agenda-spatial-proofs.json')
    const payload = {
        blackoutDeferrals: [...staged.blackoutDeferrals],
        blackoutSkips: [...staged.blackoutSkips],
        expandedProofs: sorted,
        proofCount: sorted.length,
        recurrenceExpansionDigest,
    }
    const content = JSON.stringify(payload, null, 2).replace(/\r/g, '') + '\n'
    fs.writeFileSync(proofFile, content, 'utf-8')
    emitConsole(
        ste,
        `>> [SPATIAL:RECURRENCE_PROOF] occurrences=${sorted.length} skipped=${staged.blackoutSkips.length} deferred=${staged.blackoutDeferrals.length} digest=${recurrenceExpansionDigest.slice(0, 12)}`,
    )
    return Object.freeze({
        blackoutDeferrals: Object.freeze([...staged.blackoutDeferrals]),
        blackoutSkips: Object.freeze([...staged.blackoutSkips]),
        expandedProofs: Object.freeze([...sorted]),
        outputDir,
        proofCount: sorted.length,
        proofFile,
        recurrenceExpansionDigest,
    })
}
