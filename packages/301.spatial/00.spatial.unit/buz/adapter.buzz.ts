import type {
    SpatialPort,
    SpatialExecutionContext,
    SynchronousExecutionReceipt,
    ScrubbedSpatialQuery,
} from '../../14.port.unit/fce/port.interface.js'
import type { PureSpatialKernel } from '../fce/spatial.interface.js'
import { SpatialKernelInvoker } from './spatial.buzz.js'
import { sanitizeSpatialQueryPayload } from '../../14.port.unit/buz/port.buzz.js'
import {
    canonicalizeJson,
    computeSha256Hex,
} from '../../19.ledger.unit/buz/ledger.buzz.js'
import { deepFreezeReceipt } from '../../42.receipt.unit/buz/receipt.buzz.js'
import { GENESIS_HASH_64 } from '../../19.ledger.unit/val/ledger.model.js'
import { packAxialCell } from '../../38.types.unit/fce/manifest.schema.js'

export class InProcessSpatialAdapter implements SpatialPort {
    readonly kernelVersion: string
    private readonly kernel: PureSpatialKernel

    constructor(kernel?: PureSpatialKernel) {
        this.kernel = kernel ?? new SpatialKernelInvoker()
        this.kernelVersion = this.kernel.kernelVersion
    }

    invokeSynchronous<T = unknown>(
        rawQuery: unknown,
        context?: SpatialExecutionContext,
    ): SynchronousExecutionReceipt<T> {
        const startHr =
            typeof performance !== 'undefined' ? performance.now() : Date.now()

        // 1. Epistemic Firewall: sanitize raw query and purge narrative properties
        const sanitizeResult = sanitizeSpatialQueryPayload(rawQuery)
        if (!sanitizeResult.valid || !sanitizeResult.scrubbedQuery) {
            const elapsedMicros = Math.round(
                ((typeof performance !== 'undefined'
                    ? performance.now()
                    : Date.now()) -
                    startHr) *
                    1000,
            )
            return deepFreezeReceipt({
                ok: false,
                queryType: (rawQuery as any)?.queryType ?? 'RAYCAST',
                kernelVersion: this.kernelVersion,
                payload: null as unknown as T,
                result: null as unknown as T,
                cellsExpanded: 0,
                failureCode: 'SCHEMA_BREACH',
                executionMicros: elapsedMicros,
                durationMicros: elapsedMicros,
                error: sanitizeResult.breachReason ?? 'SCHEMA_BREACH',
            })
        }

        const query: ScrubbedSpatialQuery = sanitizeResult.scrubbedQuery
        let ok = false
        let payloadData: unknown = null
        let cellsExpanded = 0
        let failureCode: SynchronousExecutionReceipt['failureCode']

        // 2. Dispatch query directly to synchronous mathematical kernel
        switch (query.queryType) {
            case 'RAYCAST': {
                const res = this.kernel.executeRaycast(query)
                ok = res.ok
                cellsExpanded = res.topologicalDistance
                payloadData = {
                    sourceCoord: query.origin,
                    observerCoord: query.target,
                    qualityScorePerMille: Math.round(res.transmissionBps / 10),
                    arrivalBearing: 0,
                    isOccluded: res.isOccluded,
                    evidence: {
                        modality: 'OPTICAL',
                        transmissionBps: res.transmissionBps,
                        topologicalDistance: res.topologicalDistance,
                        occludingBarrierCoord: res.occludingCoord,
                    },
                }
                break
            }

            case 'BOUNDED_PATH': {
                const res = this.kernel.executeBoundedPath(query)
                ok = res.ok
                cellsExpanded = res.cellsExpanded
                failureCode = res.failureCode
                payloadData = res.ok
                    ? {
                          ok: true,
                          originPacked: packAxialCell(
                              query.origin.q,
                              query.origin.r,
                          ),
                          destinationPacked: packAxialCell(
                              query.destination.q,
                              query.destination.r,
                          ),
                          path: res.path,
                          totalCostUnits: res.totalCostUnits,
                          stepsExpanded: res.cellsExpanded,
                      }
                    : {
                          ok: false,
                          originPacked: packAxialCell(
                              query.origin.q,
                              query.origin.r,
                          ),
                          destinationPacked: packAxialCell(
                              query.destination.q,
                              query.destination.r,
                          ),
                          failureCode: res.failureCode,
                          stepsExpanded: res.cellsExpanded,
                      }
                break
            }

            case 'REACHABILITY': {
                const res = this.kernel.executeReachability(query)
                ok = true
                cellsExpanded = res.length
                payloadData = { reachableCells: res }
                break
            }

            case 'DISPLACEMENT': {
                const res = this.kernel.executeDisplacement(query)
                ok = res.ok
                failureCode = res.failureCode
                payloadData = {
                    ok: res.ok,
                    targetCellPacked: res.targetCellPacked,
                    resolvedCellPacked: res.resolvedCellPacked,
                    relocationCostUnits: res.relocationCostUnits,
                    wasEvicted: res.wasEvicted,
                }
                break
            }
        }

        // 3. Calculate deterministic RFC 8785 hashes and quadruple
        const queryHash = computeSha256Hex(canonicalizeJson(query))
        const receiptHash = computeSha256Hex(canonicalizeJson(payloadData))
        const topologyHash = context?.topologyHash ?? GENESIS_HASH_64
        const overlayHash = context?.overlayHash ?? GENESIS_HASH_64

        const auditQuadruple = Object.freeze({
            topologyHash,
            overlayHash,
            queryHash,
            receiptHash,
        })

        // 4. Bind audit quadruple to sealed payload
        if (payloadData && typeof payloadData === 'object') {
            ;(payloadData as any).auditQuadruple = auditQuadruple
        }

        const elapsedMicros = Math.round(
            ((typeof performance !== 'undefined'
                ? performance.now()
                : Date.now()) -
                startHr) *
                1000,
        )

        const receipt: SynchronousExecutionReceipt<T> = {
            ok,
            queryType: query.queryType,
            kernelVersion: this.kernelVersion,
            payload: payloadData as T,
            result: payloadData as T,
            cellsExpanded,
            failureCode,
            executionMicros: elapsedMicros,
            durationMicros: elapsedMicros,
            auditQuadruple,
            error: ok ? undefined : (failureCode ?? undefined),
        }

        return deepFreezeReceipt(receipt)
    }
}

export function createInProcessSpatialPort(
    kernel?: PureSpatialKernel,
): SpatialPort {
    return new InProcessSpatialAdapter(kernel)
}
