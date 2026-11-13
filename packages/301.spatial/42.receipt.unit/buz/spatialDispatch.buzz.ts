import * as fs from 'node:fs'
import * as path from 'node:path'
import type State from '../../99.core/state.js'

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

    const currentDir = process.cwd()
    const parentDir = path.resolve(currentDir, '..')
    const targetEngineRoot =
        dat.targetEngineRoot || path.join(parentDir, '000.series-sower-engine')

    try {
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

        fs.mkdirSync(path.dirname(stagingDestination), { recursive: true })
        fs.writeFileSync(
            stagingDestination,
            JSON.stringify(
                {
                    series_slug: seriesSlug,
                    spatial_audit_quadruple: {
                        topology_hash: receiptData.topology_hash,
                        overlay_hash: receiptData.overlay_hash,
                        query_hash: receiptData.query_hash,
                        receipt_hash: receiptData.receipt_hash,
                    },
                    kernel_version: receiptData.kernel_version,
                    metrics: receiptData.metrics,
                    dispatched_at: new Date().toISOString(),
                },
                null,
                2,
            ),
            'utf-8',
        )

        emitConsole(
            ste,
            `>> [SPATIAL:DISPATCH] [OK] Staged spatial proof payload -> ${path.relative(targetEngineRoot, stagingDestination)}`,
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
                    },
                },
            })
        }
    } catch (err: any) {
        const errorMsg = err.message || String(err)
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
