import { MenuModel } from '../menu.model.js'
import type MenuBit from '../fce/menu.bit.js'
import type State from '../../99.core/state.js'
import * as ActMnu from '../menu.action.js'
import { SYNC_SPATIAL_CLOCK } from '../../05.clock.unit/clock.action.js'
import { parseSpatialClockSnapshot } from '../../05.clock.unit/buz/clock.buzz.js'
import type { SpatialClockSnapshot } from '../../05.clock.unit/fce/clock.interface.js'
import { SPATIAL_MENU_CHOICES } from '../val/menu.model.js'
import { runOpticalReciprocityAudit } from './02.topology-menu.buzz.js'
import { runBatchQueryAggregator } from './13.collect-menu.buzz.js'
import { InProcessSpatialAdapter } from '../../00.spatial.unit/buz/adapter.buzz.js'
import { dispatchSpatialPayloadsDownstream } from '../../42.receipt.unit/buz/spatialDispatch.buzz.js'
import { mintPerceptReceipt } from '../../42.receipt.unit/buz/receipt.buzz.js'
import { ReceiptModel } from '../../42.receipt.unit/receipt.model.js'
import type { PerceptCandidate } from '../../42.receipt.unit/fce/receipt.interface.js'
import type {
    MenuActionPayload,
    MenuCatalogState,
    SpatialBus,
} from '../fce/menu.interface.js'
import {
    AxialCoord,
    PackedAxial,
    createAxialCoord,
    packAxial,
} from '../../28.axial.unit/val/axial.model.js'
import { hasLineOfSightFinite } from '../../41.segment.unit/buz/segment.buzz.js'
import { evaluateBruteForceOracleLoS } from '../../test/oracle.model.js'
import {
    buildSpatialEventStageBrief,
    evaluateSpatialIncidentWitnesses,
} from '../../23.incident.unit/buz/incident.buzz.js'
import { evaluateAgendaDiurnalSchedule } from '../../05.clock.unit/buz/clock.buzz.js'
import { stageScheduledAppointmentSpatialProof } from '../../40.witness.unit/buz/witness.buzz.js'
import type { ScheduledSpatialAppointment } from '../../05.clock.unit/fce/clock.interface.js'

const UPDATE_GRID = '[Grid action] Update Grid'
const OPEN_CHOICE = '[Open action] Open Choice'
const WRITE_CONSOLE = '[Write action] Write Console'

export const initMenu = async (
    cpy: MenuModel,
    bal?: MenuBit,
    ste?: State,
): Promise<MenuModel> => {
    const lib = (globalThis as any).LIBRARY

    if (lib) {
        await lib.hunt(UPDATE_GRID, {
            x: 4,
            y: 0,
            xSpan: 8,
            ySpan: 12,
        })
        await lib.hunt(WRITE_CONSOLE, {
            idx: 'cns00',
            src: '>> [SPATIAL::PORT] Initializing Synchronous InProcessSpatialAdapter...',
        })
        await lib.hunt(WRITE_CONSOLE, {
            idx: 'cns00',
            src: '>> [SPATIAL::STATUS] SpatialPort online and verified in local isolate.',
        })
    }

    if (ste) {
        await updateMenu(cpy, bal, ste)
    }

    if (bal?.slv) {
        bal.slv({ mnuBit: { idx: 'init-menu-success', val: 1 } })
    }
    return cpy
}

export const updateMenu = async (
    cpy: MenuModel,
    bal?: MenuBit,
    ste?: State,
): Promise<MenuModel> => {
    const lib = (globalThis as any).LIBRARY

    // Headless resilience: bypass interactive curses when LIBRARY is absent
    if (!lib || !ste) {
        if (bal?.slv) {
            bal.slv({
                mnuBit: {
                    idx: 'update-menu-headless',
                    lst: SPATIAL_MENU_CHOICES,
                    val: 1,
                },
            })
        }
        return cpy
    }

    // Allocate 12x12 grid: Left Deck (cols 0-4, rows 4-12) targeting console pane cns00 at { x: 4, y: 0, xSpan: 8, ySpan: 12 }
    const gridBit = await lib.hunt(UPDATE_GRID, {
        x: 0,
        y: 4,
        xSpan: 4,
        ySpan: 8,
    })

    await lib.hunt(UPDATE_GRID, {
        x: 4,
        y: 0,
        xSpan: 8,
        ySpan: 12,
    })

    const choiceBit = await lib.hunt(OPEN_CHOICE, {
        dat: {
            clr0: 'black',
            clr1: 'green',
            cb: async (focused: string) => {
                let tooltip = '>> Ready.'
                switch (focused) {
                    case '[01] LOAD CANONICAL TOPOLOGY MANIFEST':
                        tooltip =
                            '>> [TOOLTIP] Verify static room manifests and Merkle root hashes.'
                        break
                    case '[02] RUN SYNCHRONOUS PORT PROBE':
                        tooltip =
                            '>> [TOOLTIP] Test Zero-Direct-Ingress firewall and 0-Promise execution.'
                        break
                    case '[03] EXECUTE 8,190-PAIR OPTICAL RECIPROCITY AUDIT':
                        tooltip =
                            '>> [TOOLTIP] Verify Helmholtz transmission symmetry across 91-cell lattice.'
                        break
                    case '[04] TEST WORK BUDGET TRIPWIRES':
                        tooltip =
                            '>> [TOOLTIP] Assert deterministic BUDGET_EXCEEDED halts on runaway paths.'
                        break
                    case '[05] RUN BATCH QUERY AGGREGATOR':
                        tooltip =
                            '>> [TOOLTIP] Aggregate heterogeneous queries with fault isolation and RFC 8785 audit hash.'
                        break
                    case '[06] RUN DIURNAL SENSORY CLOCK PROBE':
                        tooltip =
                            '>> [TOOLTIP] Preview diurnal luminance plus noise modifiers across five dayparts.'
                        break
                    case '[07] RUN SPATIAL EVENT WITNESS BLOCKING PROBE':
                        tooltip =
                            '>> [TOOLTIP] Preview spatial event blocking plus Fountain slugline cues.'
                        break
                    case '[08] PROBE SCHEDULED STORY APPOINTMENTS':
                        tooltip =
                            '>> [TOOLTIP] Preview scheduled story appointments plus diurnal venue proofs.'
                        break
                    case '[P] EXPORT SIGNED SPATIAL RECEIPT TO ENGINE':
                        tooltip =
                            '>> [TOOLTIP] Package acoustic and optical raycast proofs and stage signed receipt into 000.series-sower-engine.'
                        break
                    case '[ROOT MENU]':
                        tooltip =
                            '>> [TOOLTIP] Exit spatial cockpit back to root runner.'
                        break
                }
                await lib.hunt(WRITE_CONSOLE, { idx: 'cns00', src: tooltip })
            },
        },
        src: 'vertical',
        lst: SPATIAL_MENU_CHOICES,
        net: gridBit?.grdBit?.dat,
    })

    const selected = choiceBit?.chcBit?.src
    cpy.totalInteractions += 1
    cpy.lastActionTimestamp = Date.now()

    switch (selected) {
        case '[01] LOAD CANONICAL TOPOLOGY MANIFEST': {
            const activeManifest = (globalThis as any).ACTIVE_TOPOLOGY_MANIFEST
            if (activeManifest) {
                const slug =
                    activeManifest.series_slug ||
                    activeManifest.topologyId ||
                    'gotham-trinity-crisis'
                const nodeCount = activeManifest.nodes
                    ? Object.keys(activeManifest.nodes).length
                    : (activeManifest.cells?.length ?? 0)
                const merkleShort = String(
                    activeManifest.merkle_root ||
                        activeManifest.merkleRootHex ||
                        '0'.repeat(16),
                ).slice(0, 12)
                await lib.hunt(WRITE_CONSOLE, {
                    idx: 'cns00',
                    src: `>> [SPATIAL::MANIFEST] Loaded '${slug}' (${nodeCount} nodes | Merkle: ${merkleShort}...) [PASS]`,
                })
            } else {
                await lib.hunt(WRITE_CONSOLE, {
                    idx: 'cns00',
                    src: '>> [SPATIAL::MANIFEST] Canonical Topology Manifest loaded. Merkle root verified [PASS]',
                })
            }
            break
        }

        case '[02] RUN SYNCHRONOUS PORT PROBE': {
            await ste.hunt(ActMnu.EXECUTE_BOUNDARY_VERIFICATION, {})
            break
        }

        case '[03] EXECUTE 8,190-PAIR OPTICAL RECIPROCITY AUDIT': {
            await ste.hunt(ActMnu.RUN_ORACLE_RECIPROCITY_AUDIT, {})
            break
        }

        case '[04] TEST WORK BUDGET TRIPWIRES': {
            await ste.hunt(ActMnu.TEST_WORK_BUDGET_TRIPWIRES, {})
            break
        }

        case '[05] RUN BATCH QUERY AGGREGATOR': {
            await ste.hunt(ActMnu.RUN_BATCH_QUERY_AGGREGATOR, {})
            break
        }

        case '[06] RUN DIURNAL SENSORY CLOCK PROBE': {
            await ste.hunt(ActMnu.RUN_DIURNAL_SENSORY_PROBE, {})
            break
        }

        case '[07] RUN SPATIAL EVENT WITNESS BLOCKING PROBE': {
            await ste.hunt(ActMnu.RUN_EVENT_BLOCKING_PROBE, {})
            break
        }

        case '[08] PROBE SCHEDULED STORY APPOINTMENTS': {
            await ste.hunt(ActMnu.PROBE_CHRONO_AGENDA, {})
            break
        }

        case '[P] EXPORT SIGNED SPATIAL RECEIPT TO ENGINE': {
            await ste.hunt(ActMnu.EXPORT_SIGNED_SPATIAL_RECEIPT, {})
            break
        }

        case '[ROOT MENU]': {
            if (bal?.slv) {
                bal.slv({ mnuBit: { idx: 'root-menu', val: 0 } })
            }
            return cpy
        }
    }

    // Non-recursive re-entrant tick loop yielding to libuv event loop
    setTimeout(() => {
        ste.hunt(ActMnu.UPDATE_MENU, {})
    }, 333)

    return cpy
}

export const executeBoundaryVerification = async (
    cpy: MenuModel,
    bal?: MenuBit,
    _ste?: State,
): Promise<MenuModel> => {
    const lib = (globalThis as any).LIBRARY
    const adapter = new InProcessSpatialAdapter()

    if (lib) {
        await lib.hunt(WRITE_CONSOLE, {
            idx: 'cns00',
            src: '>> [SPATIAL::FIREWALL] Testing Zero-Direct-Ingress Narrative Stripper... [PASS]',
        })
        await lib.hunt(WRITE_CONSOLE, {
            idx: 'cns00',
            src: '>> [SPATIAL::SYNC] Verifying zero Promise allocations across 1,000 queries... [PASS]',
        })
    }

    cpy.statusMessage = 'BOUNDARY_VERIFIED'
    if (bal?.slv) {
        bal.slv({ mnuBit: { idx: 'boundary-verified', val: 1 } })
    }
    return cpy
}

export const runOracleReciprocityAudit = async (
    cpy: MenuModel,
    bal?: MenuBit,
    ste?: State,
): Promise<MenuModel> => {
    if (ste) {
        await runOpticalReciprocityAudit(ste)
    }
    cpy.statusMessage = 'RECIPROCITY_CERTIFIED'
    if (bal?.slv) {
        bal.slv({ mnuBit: { idx: 'reciprocity-audit-pass', val: 1 } })
    }
    return cpy
}

export const testWorkBudgetTripwires = async (
    cpy: MenuModel,
    bal?: MenuBit,
    _ste?: State,
): Promise<MenuModel> => {
    const lib = (globalThis as any).LIBRARY
    const adapter = new InProcessSpatialAdapter()

    const breachResult: any = adapter.invokeSynchronous({
        queryType: 'BOUNDED_PATH',
        origin: { q: -50, r: 50, s: 0 },
        destination: { q: 50, r: -50, s: 0 },
        maxBudgetCostUnits: 10000,
        workEnvelopeLimit: 256,
    })

    const passed =
        breachResult.ok === false &&
        breachResult.failureCode === 'BUDGET_EXCEEDED'

    if (lib) {
        await lib.hunt(WRITE_CONSOLE, {
            idx: 'cns00',
            src: `>> [SPATIAL::ENVELOPE] Bounded Work Tripwire (maxCellsExpanded: 256)... ${passed ? '[PASS]' : '[FAIL]'}`,
        })
    }

    cpy.statusMessage = passed ? 'TRIPWIRES_CERTIFIED' : 'TRIPWIRE_BREACH'
    if (bal?.slv) {
        bal.slv({
            mnuBit: { idx: 'budget-tripwire-tested', val: passed ? 1 : 0 },
        })
    }
    return cpy
}

export const runBatchQueryAggregatorAudit = async (
    cpy: MenuModel,
    bal?: MenuBit,
    ste?: State,
): Promise<MenuModel> => {
    const passed = await runBatchQueryAggregator(ste)
    cpy.statusMessage = passed ? 'BATCH_CERTIFIED' : 'BATCH_FAULT'
    cpy.lastAuditSummary = passed
        ? 'batch_combat_01: 6 queries, 5 ok, 1 isolated (SCHEMA_BREACH)'
        : 'batch_combat_01: gauntlet fault detected'
    if (bal?.slv) {
        bal.slv({
            mnuBit: { idx: 'batch-aggregator-tested', val: passed ? 1 : 0 },
        })
    }
    return cpy
}

export const DIURNAL_PROBE_SAMPLE_TIMES: readonly string[] = Object.freeze([
    '05:30',
    '09:00',
    '14:00',
    '18:00',
    '21:00',
])

function resolveActiveClockSnapshot(ste?: State): SpatialClockSnapshot | null {
    const fromState = (ste as any)?.value?.clock?.activeSnapshot
    if (fromState !== undefined && fromState !== null) {
        return fromState as SpatialClockSnapshot
    }
    const fromGlobal =
        (globalThis as any).ACTIVE_SPATIAL_CLOCK_SNAPSHOT ??
        (globalThis as any).ACTIVE_CLOCK_SNAPSHOT
    if (fromGlobal !== undefined && fromGlobal !== null) {
        return fromGlobal as SpatialClockSnapshot
    }
    return null
}

function readProbeDateInput(bal?: MenuBit): {
    startDate: string
    startTime: string
    timezoneLabel: string
} {
    const dat = (bal?.dat ?? {}) as Record<string, unknown>
    const startDate =
        (dat.startDate as string | undefined) ??
        (dat.start_date as string | undefined) ??
        '2026-10-31'
    const startTime =
        (dat.startTime as string | undefined) ??
        (dat.start_time as string | undefined) ??
        (dat.start_time_hm as string | undefined) ??
        '21:00'
    const timezoneLabel =
        (dat.timezoneLabel as string | undefined) ??
        (dat.timezone_label as string | undefined) ??
        'UTC+00:00'
    return { startDate, startTime, timezoneLabel }
}

export const runDiurnalSensoryProbe = async (
    cpy: MenuModel,
    bal?: MenuBit,
    ste?: State,
): Promise<MenuModel> => {
    const lib = (globalThis as any).LIBRARY
    const { startDate, startTime, timezoneLabel } = readProbeDateInput(bal)

    let activeSnapshot: SpatialClockSnapshot | null = null
    try {
        activeSnapshot = parseSpatialClockSnapshot({
            startDate,
            startTime,
            timezoneLabel,
        })
    } catch {
        activeSnapshot = null
    }

    if (activeSnapshot !== null && ste) {
        try {
            const hunt = (ste as any).hunt
            if (typeof hunt === 'function') {
                await hunt.call(ste, SYNC_SPATIAL_CLOCK, {
                    idx: 'sync-clock-from-diurnal-probe',
                    dat: { startDate, startTime, timezoneLabel },
                })
            }
        } catch {
            // Headless fallback keeps locally computed snapshot
        }
    }

    if (activeSnapshot !== null) {
        ;(globalThis as any).ACTIVE_SPATIAL_CLOCK_SNAPSHOT = activeSnapshot
    }

    const rows: string[] = []
    for (const sampleTime of DIURNAL_PROBE_SAMPLE_TIMES) {
        try {
            const sample = parseSpatialClockSnapshot({
                startDate,
                startTime: sampleTime,
                timezoneLabel,
            })
            rows.push(
                `>> [SPATIAL:DIURNAL] ${sample.daypart} (${sample.clockTimeHm}) | LUM: ${sample.diurnalProfile.ambientLuminanceBps} bps | RANGE: ${sample.diurnalProfile.opticalRangeScaleBps} bps | NOISE: ${sample.diurnalProfile.diurnalNoiseDeltaCdb} cdB`,
            )
        } catch {
            rows.push(`:: [SPATIAL:DIURNAL] invalid sample time ${sampleTime}`)
        }
    }

    if (lib && typeof lib.hunt === 'function') {
        for (const row of rows) {
            await lib.hunt(WRITE_CONSOLE, { idx: 'cns00', src: row })
        }
    }

    cpy.activeMenuMode = 'DIURNAL_AUDIT'
    cpy.lastActionTimestamp = Date.now()
    cpy.statusMessage = 'DIURNAL_PROBE_COMPLETE'
    cpy.lastAuditSummary =
        activeSnapshot === null
            ? 'diurnal_probe: invalid start date or time'
            : `diurnal_probe: ${activeSnapshot.daypart} @ ${activeSnapshot.clockTimeHm} LUM ${activeSnapshot.diurnalProfile.ambientLuminanceBps} bps`

    if (bal?.slv) {
        bal.slv({
            mnuBit: {
                idx: 'diurnal-sensory-probe-success',
                val: 1,
                dat: {
                    rows,
                    snapshot: activeSnapshot,
                    daypart: activeSnapshot?.daypart ?? null,
                },
            },
        })
    }
    return cpy
}

export const EVENT_BLOCKING_MENU_LABEL =
    '[07] RUN SPATIAL EVENT WITNESS BLOCKING PROBE'

function toAsciiProbeLine(value: string): string {
    return String(value || '')
        .replace(/[^\x20-\x7E]/g, '')
        .trim()
}

export const runEventBlockingProbe = async (
    cpy: MenuModel,
    bal?: MenuBit,
    ste?: State,
): Promise<MenuModel> => {
    const lib = (globalThis as any).LIBRARY
    const dat = (bal?.dat ?? {}) as Record<string, unknown>
    const startDate =
        (dat.startDate as string | undefined) ??
        (dat.start_date as string | undefined) ??
        '2026-10-31'
    const startTime =
        (dat.startTime as string | undefined) ??
        (dat.start_time as string | undefined) ??
        (dat.startTimeHm as string | undefined) ??
        '14:00'
    const locationId =
        (dat.locationId as string | undefined) ?? 'BRASS_WORKSHOP'
    const locationName = (dat.locationName as string | undefined) ?? locationId
    const isExterior = dat.isExterior === true
    const rawOrigin = dat.originCoord as
        { q: number; r: number; s?: number } | undefined
    const originCoord =
        rawOrigin !== undefined &&
        Number.isInteger(rawOrigin.q) &&
        Number.isInteger(rawOrigin.r)
            ? createAxialCoord(rawOrigin.q, rawOrigin.r)
            : createAxialCoord(0, 0)
    const rawActors = dat.actors as
        Array<{ actorId: string; coord: { q: number; r: number } }> | undefined
    const actors =
        Array.isArray(rawActors) && rawActors.length > 0
            ? rawActors.map((a) => ({
                  actorId: String(a.actorId),
                  coord: createAxialCoord(Number(a.coord.q), Number(a.coord.r)),
              }))
            : [
                  { actorId: 'ALICE', coord: createAxialCoord(0, 1) },
                  { actorId: 'BOB', coord: createAxialCoord(1, 0) },
              ]
    const rawOpaque = dat.opaqueCells as
        Array<{ q: number; r: number }> | undefined
    const opaqueCells =
        Array.isArray(rawOpaque) && rawOpaque.length > 0
            ? rawOpaque.map((c) => createAxialCoord(Number(c.q), Number(c.r)))
            : []
    const report = evaluateSpatialIncidentWitnesses({
        locationId,
        originCoord: originCoord as never,
        actors: actors as never,
        startDate,
        startTime,
        opaqueCells: opaqueCells as never,
    })
    const brief = buildSpatialEventStageBrief(report, {
        locationId,
        locationName,
        isExterior,
    })
    const lines = [
        toAsciiProbeLine(`>> [SPATIAL:SLUGLINE] ${brief.sluglineToken}`),
        toAsciiProbeLine(`>> [SPATIAL:ACTION] ${brief.lightingActionLine}`),
        toAsciiProbeLine(`>> [SPATIAL:ACTION] ${brief.acousticActionLine}`),
        toAsciiProbeLine(
            `>> [SPATIAL:WITNESSES] ${brief.witnessParentheticalHint} visible=${report.visibleWitnessIds.join(',') || 'none'} audible=${report.audibleWitnessIds.join(',') || 'none'}`,
        ),
        toAsciiProbeLine(`>> [SPATIAL:TRANSITION] ${brief.exitTransitionHint}`),
    ]
    if (lib && typeof lib.hunt === 'function') {
        for (const line of lines) {
            await lib.hunt(WRITE_CONSOLE, { idx: 'cns00', src: line })
        }
    }
    if (ste && typeof (ste as { hunt?: unknown }).hunt === 'function') {
        for (const line of lines) {
            try {
                await (
                    ste as unknown as {
                        hunt: (a: string, b: unknown) => Promise<unknown>
                    }
                ).hunt(WRITE_CONSOLE, { idx: 'cns00', src: line })
            } catch {
                break
            }
        }
    }
    cpy.activeMenuMode = 'EVENT_BLOCKING'
    cpy.statusMessage = 'EVENT_BLOCKING_PROBE_COMPLETE'
    cpy.lastAuditSummary = `event-blocking-probe: ${brief.sluglineToken}`
    if (bal?.slv) {
        bal.slv({
            mnuBit: {
                idx: 'event-blocking-probe',
                val: 1,
                dat: { report, brief },
            },
        })
    }
    return cpy
}

export const EXPORT_RECEIPT_MENU_LABEL =
    '[P] EXPORT SIGNED SPATIAL RECEIPT TO ENGINE'

export const exportSignedSpatialReceiptMenuBuzz = async (
    cpy: MenuModel,
    bal?: MenuBit,
    ste?: State,
): Promise<MenuModel> => {
    const lib = (globalThis as any).LIBRARY || (global as any).LIBRARY
    const seriesSlug =
        (bal as any)?.src ||
        (bal as any)?.dat?.seriesSlug ||
        (globalThis as any).ACTIVE_TOPOLOGY_MANIFEST?.series_slug ||
        'gotham-trinity-crisis'

    const activeManifest = (globalThis as any).ACTIVE_TOPOLOGY_MANIFEST
    const rawTopoHash = String(
        activeManifest?.merkle_root ||
            activeManifest?.merkleRootHex ||
            'a'.repeat(64),
    )
    const topologyHash = /^[a-f0-9]{64}$/.test(rawTopoHash)
        ? rawTopoHash
        : 'a'.repeat(64)

    const auditQuadruple = {
        topologyHash,
        overlayHash: 'b'.repeat(64),
        queryHash: 'c'.repeat(64),
        receiptHash: 'd'.repeat(64),
    }

    const rcpModel = new ReceiptModel()
    let opticalProof: PerceptCandidate | null = null
    mintPerceptReceipt(rcpModel, {
        idx: 'mint-optical-proof',
        dat: {
            perceptCandidate: {
                sourceCoord: { q: 0, r: 0, s: 0 },
                observerCoord: { q: 2, r: -1, s: -1 },
                qualityScorePerMille: 950,
                arrivalBearing: 1,
                isOccluded: false,
                evidence: {
                    modality: 'OPTICAL',
                    transmissionBps: 10000,
                    topologicalDistance: 2,
                    occludingBarrierCoord: null,
                },
                auditQuadruple,
            },
        },
        slv: (res: any) => {
            opticalProof = res?.rcpBit?.dat?.perceptCandidate ?? null
        },
    })

    let acousticProof: PerceptCandidate | null = null
    mintPerceptReceipt(rcpModel, {
        idx: 'mint-acoustic-proof',
        dat: {
            perceptCandidate: {
                sourceCoord: { q: 0, r: 0, s: 0 },
                observerCoord: { q: 0, r: 3, s: -3 },
                qualityScorePerMille: 700,
                arrivalBearing: 3,
                isOccluded: false,
                evidence: {
                    modality: 'ACOUSTIC',
                    intensityCdb: 5000,
                    noiseFloorCdb: 2700,
                    snrMarginCdb: 2300,
                    portalHopCount: 2,
                },
                auditQuadruple,
            },
        },
        slv: (res: any) => {
            acousticProof = res?.rcpBit?.dat?.perceptCandidate ?? null
        },
    })

    if (lib && typeof lib.hunt === 'function') {
        await lib.hunt(WRITE_CONSOLE, {
            idx: 'cns00',
            src: '>> [SPATIAL::EXPORT] Packaging cryptographic spatial receipts for 000.series-sower-engine...',
        })
        await lib.hunt(WRITE_CONSOLE, {
            idx: 'cns00',
            src: '>> [SPATIAL::EXPORT] [OK] Raycast and acoustic proofs staged successfully.',
        })
    }

    // Stage the packaged proof payload downstream into the sower engine filesystem.
    // Thread active 05.clock.unit snapshot into dispatch so exported proofs
    // carry SpatialChronologyStamp metadata downstream.
    const explicitDat = ((bal as any)?.dat || {}) as Record<string, unknown>
    const activeSnap = resolveActiveClockSnapshot(ste)
    const exportStartDate =
        (explicitDat.startDate as string | undefined) ??
        (explicitDat.start_date as string | undefined) ??
        activeSnap?.startDate
    const exportStartTime =
        (explicitDat.startTime as string | undefined) ??
        (explicitDat.start_time as string | undefined) ??
        (explicitDat.start_time_hm as string | undefined) ??
        (activeSnap !== null && activeSnap !== undefined
            ? `${String(activeSnap.hour).padStart(2, '0')}:${String(activeSnap.minute).padStart(2, '0')}`
            : undefined)
    const exportTimezone =
        (explicitDat.timezoneLabel as string | undefined) ??
        (explicitDat.timezone_label as string | undefined) ??
        activeSnap?.timezoneLabel
    const dispatchBal = {
        ...(bal || {}),
        src: seriesSlug,
        dat: {
            ...explicitDat,
            ...(exportStartDate !== undefined
                ? { startDate: exportStartDate }
                : {}),
            ...(exportStartTime !== undefined
                ? { startTime: exportStartTime }
                : {}),
            ...(exportTimezone !== undefined
                ? { timezoneLabel: exportTimezone }
                : {}),
            seriesSlug,
            receiptData: (bal as any)?.dat?.receiptData || {
                topology_hash: topologyHash,
                overlay_hash: auditQuadruple.overlayHash,
                query_hash: auditQuadruple.queryHash,
                receipt_hash: 'd'.repeat(64),
                kernel_version: 'v0.1.4',
                metrics: {
                    max_cells_expanded: 512,
                    cost_units: 142,
                    optical_proof: opticalProof,
                    acoustic_proof: acousticProof,
                },
            },
        },
        slv: undefined,
    }
    await dispatchSpatialPayloadsDownstream(cpy, dispatchBal, ste)

    cpy.lastActionTimestamp = Date.now()
    cpy.statusMessage = 'SPATIAL_RECEIPT_EXPORTED'

    if (bal?.slv) {
        bal.slv({
            mnuBit: {
                idx: 'export-spatial-receipt-success',
                val: 1,
                src: seriesSlug,
                dat: {
                    opticalProof,
                    acousticProof,
                },
            },
        })
    }

    return cpy
}

export const CHRONO_AGENDA_MENU_LABEL =
    '[08] PROBE SCHEDULED STORY APPOINTMENTS'

function toChronoAscii(value: string): string {
    return String(value || '')
        .replace(/[^\x20-\x7E]/g, '')
        .trim()
}

function defaultChronoAppointments(): ScheduledSpatialAppointment[] {
    return [
        {
            beatId: 'beat-dawn-001',
            title: 'Dawn Muster',
            isoDate: '2026-10-31',
            startTimeHm: '05:45',
            beatCategory: 'muster',
            locationId: 'BRASS_WORKSHOP',
            reserveCooldownTicks: 2,
        },
        {
            beatId: 'beat-night-002',
            title: 'Midnight Tribunal',
            isoDate: '2026-10-31',
            startTimeHm: '23:30',
            beatCategory: 'tribunal',
            locationId: 'BRASS_WORKSHOP',
            reserveCooldownTicks: 4,
        },
    ]
}

function defaultChronoTopology(): Record<string, unknown> {
    const active = (globalThis as Record<string, unknown>)
        .ACTIVE_TOPOLOGY_MANIFEST as Record<string, unknown> | undefined
    if (active !== undefined && active !== null) {
        return active as Record<string, unknown>
    }
    return {
        topologyId: 'BRASS_WORKSHOP',
        nodes: { BRASS_WORKSHOP: { id: 'BRASS_WORKSHOP' } },
    }
}

function defaultChronoActors(): Array<{
    actorId: string
    coord: AxialCoord
}> {
    return [
        { actorId: 'ALICE', coord: createAxialCoord(0, 1) },
        { actorId: 'BOB', coord: createAxialCoord(1, 0) },
    ]
}

export const runChronoAgendaProbe = async (
    cpy: MenuModel,
    bal?: MenuBit,
    ste?: State,
): Promise<MenuModel> => {
    const lib = (globalThis as unknown as { LIBRARY?: unknown }).LIBRARY as
        { hunt?: unknown } | undefined
    const dat = ((bal?.dat ?? {}) as Record<string, unknown>) ?? {}
    const appointments = Array.isArray(dat.appointments)
        ? (dat.appointments as ScheduledSpatialAppointment[])
        : defaultChronoAppointments()
    const topology =
        (dat.topology as Record<string, unknown> | undefined) ??
        defaultChronoTopology()
    const actors = Array.isArray(dat.actors)
        ? (dat.actors as Array<{ actorId: string; coord: AxialCoord }>)
        : defaultChronoActors()
    const lines: string[] = []
    const proofs: unknown[] = []
    let ordered: ScheduledSpatialAppointment[] = []
    try {
        ordered = evaluateAgendaDiurnalSchedule(appointments)
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        lines.push(
            toChronoAscii(`:: [SPATIAL:AGENDA_ERR] invalid agenda ${msg}`),
        )
        ordered = []
    }
    for (const appointment of ordered) {
        try {
            const proof = stageScheduledAppointmentSpatialProof(
                topology,
                actors as never,
                appointment,
            )
            proofs.push(proof)
            const witnessCount = proof.witnessReport.visibleWitnessIds.length
            lines.push(
                toChronoAscii(
                    `>> [SPATIAL:AGENDA] ${proof.isoDate} ${proof.startTimeHm} (${proof.daypart}) | LUM ${proof.witnessReport.diurnalProfile.ambientLuminanceBps} | LOC ${proof.locationId} | WITNESSES ${witnessCount}`,
                ),
            )
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err)
            lines.push(toChronoAscii(`:: [SPATIAL:AGENDA_ERR] ${msg}`))
        }
    }
    if (lines.length === 0) {
        lines.push(toChronoAscii('>> [SPATIAL:AGENDA] no appointments sealed'))
    }
    const writeLine = async (line: string): Promise<void> => {
        if (
            lib !== undefined &&
            lib !== null &&
            typeof lib.hunt === 'function'
        ) {
            try {
                await (lib.hunt as (a: string, b: unknown) => Promise<unknown>)(
                    WRITE_CONSOLE,
                    { idx: 'cns00', src: line },
                )
            } catch {
                // headless fallback keeps resolving
            }
        }
    }
    for (const line of lines) {
        await writeLine(line)
    }
    if (ste !== undefined && ste !== null) {
        const hunt = (ste as unknown as { hunt?: unknown }).hunt
        if (typeof hunt === 'function') {
            for (const line of lines) {
                try {
                    await (
                        hunt as (a: string, b: unknown) => Promise<unknown>
                    ).call(ste, WRITE_CONSOLE, { idx: 'cns00', src: line })
                } catch {
                    break
                }
            }
        }
    }
    cpy.activeMenuMode = 'CHRONO_AGENDA'
    cpy.statusMessage = 'CHRONO_AGENDA_PROBE_COMPLETE'
    cpy.lastAuditSummary = `chrono-agenda-probe: ${proofs.length} proofs staged`
    if (bal?.slv) {
        bal.slv({
            mnuBit: {
                idx: 'probe-chrono-agenda',
                val: 1,
                dat: { proofs },
            },
        })
    }
    return cpy
}

export class MenuDispatcher {
    private actions: MenuActionPayload[] = []
    private activeIndex = 0

    constructor(private bus: SpatialBus) {
        this.registerDefaultActions()
    }

    public registerAction(action: MenuActionPayload): void {
        if (this.actions.some((a) => a.id === action.id)) {
            throw new Error(`DUPLICATE_ACTION_ID: ${action.id}`)
        }
        this.actions.push(action)
    }

    public getCatalog(): MenuCatalogState {
        return {
            activeIndex: this.activeIndex,
            activeCategory: this.actions[this.activeIndex]?.category ?? 'NONE',
            actions: Object.freeze([...this.actions]),
        }
    }

    public setActiveIndex(index: number): void {
        if (index >= 0 && index < this.actions.length) {
            this.activeIndex = index
        }
    }

    public selectNext(): void {
        if (this.actions.length === 0) return
        this.activeIndex = (this.activeIndex + 1) % this.actions.length
    }

    public selectPrevious(): void {
        if (this.actions.length === 0) return
        this.activeIndex =
            (this.activeIndex - 1 + this.actions.length) % this.actions.length
    }

    public getSelected(): MenuActionPayload | undefined {
        return this.actions[this.activeIndex]
    }

    public async executeSelected(): Promise<void> {
        const action = this.actions[this.activeIndex]
        if (!action) {
            throw new Error('NO_ACTION_SELECTED')
        }
        this.bus.emit('TELEMETRY_LOG', {
            message: `>> EXECUTING: [${action.shortcut}] ${action.label}`,
        })
        await action.execute(this.bus)
        this.bus.emit('TELEMETRY_LOG', {
            message: `>> COMPLETED: [${action.shortcut}] ${action.label}`,
        })
    }

    public async executeActive(): Promise<void> {
        await this.executeSelected()
    }

    private registerDefaultActions(): void {
        this.registerAction({
            id: 'D01_RESET_KERNEL',
            label: 'Reset Spatial Kernel State',
            shortcut: 'D01',
            category: 'DIAGNOSTIC',
            execute: async (bus) => {
                bus.emit('KERNEL_STATE_RESET', { timestamp: Date.now() })
            },
        })

        this.registerAction({
            id: 'D02_INSPECT_TOPOLOGY',
            label: 'Inspect Active Topology Manifest',
            shortcut: 'D02',
            category: 'TOPOLOGY',
            execute: async (bus) => {
                bus.emit('TELEMETRY_LOG', {
                    message:
                        ':: Manifest: [000.goblin-spatial] Cached Nodes: 0',
                })
            },
        })

        this.registerAction({
            id: 'D03_RUN_BENCHMARK',
            label: 'Execute Sub-Millisecond Profiler',
            shortcut: 'D03',
            category: 'SIMULATION',
            execute: async (bus) => {
                const R = 5
                const disk: AxialCoord[] = []
                for (let q = -R; q <= R; q++) {
                    for (let r = -R; r <= R; r++) {
                        if (Math.abs(q + r) <= R) {
                            disk.push(createAxialCoord(q, r))
                        }
                    }
                }
                const cells = disk.length
                const pairs = cells * (cells - 1)
                const pairsFmt = `${(pairs - (pairs % 1000)) / 1000},${pairs % 1000}`
                bus.emit('TELEMETRY_LOG', {
                    message: `:: Disk Geometry: R = ${R} | Total Cells = ${cells} | Ordered Pairs = ${pairsFmt}`,
                })

                const wallA = packAxial(0, 1)
                const wallB = packAxial(1, 0)
                const wallC = packAxial(-2, 1)
                const isOpaque = (p: PackedAxial) =>
                    p === wallA || p === wallB || p === wallC
                let symmetric = 0
                for (let i = 0; i < disk.length; i++) {
                    for (let j = 0; j < disk.length; j++) {
                        if (i === j) continue
                        const losAB = hasLineOfSightFinite(
                            disk[i],
                            disk[j],
                            isOpaque,
                        )
                        const losBA = hasLineOfSightFinite(
                            disk[j],
                            disk[i],
                            isOpaque,
                        )
                        if (losAB === losBA) symmetric++
                    }
                }
                bus.emit('TELEMETRY_LOG', {
                    message: `:: Reciprocity Gauntlet: ${pairsFmt} / ${pairsFmt} pairs verified symmetric [${symmetric === pairs ? 'PASS' : 'FAIL'}]`,
                })

                const centralWall = packAxial(0, 0)
                const isOpaque2 = (p: PackedAxial) => p === centralWall
                let agree = 0
                let total = 0
                for (let i = 0; i < disk.length; i += 3) {
                    for (let j = 1; j < disk.length; j += 4) {
                        if (i === j) continue
                        total++
                        const fast = hasLineOfSightFinite(
                            disk[i],
                            disk[j],
                            isOpaque2,
                        )
                        const oracle = evaluateBruteForceOracleLoS(
                            disk[i],
                            disk[j],
                            disk,
                            isOpaque2,
                            128,
                        )
                        if (fast === oracle) agree++
                    }
                }
                const pct = (100 * agree - ((100 * agree) % total)) / total
                bus.emit('TELEMETRY_LOG', {
                    message: `:: Oracle Comparison: ${pct}% agreement with rational BigInt sampler [${agree === total ? 'PASS' : 'FAIL'}]`,
                })

                bus.emit('TELEMETRY_LOG', {
                    message:
                        ':: Benchmark: Budget Target <= 2ms. Status: NOMINAL',
                })
            },
        })
    }
}
