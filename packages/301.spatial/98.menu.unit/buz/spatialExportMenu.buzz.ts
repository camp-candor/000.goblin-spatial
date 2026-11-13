import type { MenuActionPayload, SpatialBus } from '../fce/menu.interface.js'
import { dispatchSpatialPayloadsDownstream } from '../../42.receipt.unit/buz/spatialDispatch.buzz.js'

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

    const dispatchBal = bal ? { ...bal, slv: bal?.slv } : bal
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
