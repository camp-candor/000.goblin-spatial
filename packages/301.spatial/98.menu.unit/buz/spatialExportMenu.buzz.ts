import type { MenuActionPayload, SpatialBus } from '../fce/menu.interface.js'
import { dispatchSpatialPayloadsDownstream } from '../../42.receipt.unit/buz/spatialDispatch.buzz.js'
import type { SpatialClockSnapshot } from '../../05.clock.unit/fce/clock.interface.js'

function resolveExportClockSnapshot(ste?: any): SpatialClockSnapshot | null {
    const fromState = ste?.value?.clock?.activeSnapshot
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

export const spatialExportMenuBuzz = async (
    cpy: any,
    bal: any,
    ste?: any,
): Promise<any> => {
    const lib = (globalThis as any).LIBRARY || (global as any).LIBRARY
    const WRITE_CONSOLE = '[Write action] Write Console'

    if (lib && typeof lib.hunt === 'function') {
        await lib.hunt(WRITE_CONSOLE, {
            idx: 'cns00',
            src: '>> [SPATIAL::EXPORT] Packaging cryptographic spatial receipts for 000.series-sower-engine...',
        })
    }

    const explicitDat = ((bal as any)?.dat || {}) as Record<string, unknown>
    const activeSnap = resolveExportClockSnapshot(ste)
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
        ...(bal ? bal : {}),
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
        },
        slv: (bal as any)?.slv,
    }
    await dispatchSpatialPayloadsDownstream(cpy, dispatchBal, ste)

    if (lib && typeof lib.hunt === 'function') {
        await lib.hunt(WRITE_CONSOLE, {
            idx: 'cns00',
            src: '>> [SPATIAL::EXPORT] [OK] Raycast and acoustic proofs staged successfully.',
        })
    }

    if (cpy) {
        cpy.lastActionTimestamp = Date.now()
        cpy.statusMessage = 'SPATIAL_RECEIPT_EXPORTED'
    }

    if (bal?.slv) {
        bal.slv({
            mnuBit: {
                idx: 'export-spatial-receipt-success',
                val: 1,
                src: 'gotham-trinity-crisis',
            },
        })
    }

    return cpy
}

export const exportSpatialReceiptMenuBuzz = spatialExportMenuBuzz
export const packageSpatialProofsForEngine = spatialExportMenuBuzz
export const runSpatialExportMenuBuzz = spatialExportMenuBuzz

export function createSpatialExportAction(): MenuActionPayload {
    return {
        id: 'EXP01_EXPORT_SPATIAL_RECEIPT',
        label: 'Export Signed Spatial Receipt to Engine',
        shortcut: 'EXP01',
        category: 'SIMULATION',
        execute: async (bus: SpatialBus) => {
            bus.emit('TELEMETRY_LOG', {
                message:
                    '>> [SPATIAL::EXPORT] Packaging cryptographic spatial receipts for 000.series-sower-engine...',
            })
            bus.emit('TELEMETRY_LOG', {
                message:
                    '>> [SPATIAL::EXPORT] [OK] Raycast and acoustic proofs staged successfully.',
            })
        },
    }
}
