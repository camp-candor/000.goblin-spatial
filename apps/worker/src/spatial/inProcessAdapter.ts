import type { EdgeExecutionReceipt, EdgeBatchExecutionResult } from './types.js'
import { EdgeAxialCoordSchema } from './types.js'

const GENESIS_HASH_64 = '0'.repeat(64)

const BANNED_NARRATIVE_TAGS = [
    'actorId',
    'characterId',
    'characterName',
    'name',
    'dialogue',
    'speech',
    'trauma',
    'wound',
    'emotion',
    'inventory',
    'item',
    'relationship',
    'grudge',
    'intent',
    'lore',
    'prose',
]

export function deepFreeze<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') return obj
    Object.freeze(obj)
    for (const key of Object.getOwnPropertyNames(obj)) {
        const val = (obj as any)[key]
        if (val !== null && typeof val === 'object' && !Object.isFrozen(val)) {
            deepFreeze(val)
        }
    }
    return obj
}

export function canonicalizeJson(obj: unknown): string {
    if (obj === null) return 'null'
    if (typeof obj === 'number') {
        if (!Number.isFinite(obj)) {
            throw new TypeError(
                '[CANONICALIZE_ERROR] Non-finite IEEE-754 numbers are prohibited',
            )
        }
        return obj.toString()
    }
    if (typeof obj === 'boolean') return obj ? 'true' : 'false'
    if (typeof obj === 'string') return JSON.stringify(obj.normalize('NFC'))
    if (Array.isArray(obj))
        return `[${obj.map((el) => canonicalizeJson(el)).join(',')}]`
    if (typeof obj === 'object') {
        const sortedKeys = Object.keys(obj as Record<string, unknown>).sort()
        const entries = sortedKeys.map(
            (k) =>
                `${JSON.stringify(k.normalize('NFC'))}:${canonicalizeJson((obj as any)[k])}`,
        )
        return `{${entries.join(',')}}`
    }
    throw new TypeError(
        `[CANONICALIZE_ERROR] Unsupported datatype: ${typeof obj}`,
    )
}

export async function computeSha256Hex(content: string): Promise<string> {
    const enc = new TextEncoder()
    const data = enc.encode(content)
    const hashBuf = await crypto.subtle.digest('SHA-256', data)
    const byteArr = Array.from(new Uint8Array(hashBuf))
    return byteArr.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function sanitizeQueryPayload(raw: unknown): {
    valid: boolean
    query?: any
    strippedKeys: string[]
    breachReason?: string
} {
    if (raw === null || typeof raw !== 'object') {
        return {
            valid: false,
            strippedKeys: [],
            breachReason: '[SCHEMA_BREACH] Payload must be an object',
        }
    }

    const strippedKeys: string[] = []
    const cloned = JSON.parse(JSON.stringify(raw))

    function scrub(node: Record<string, any>) {
        for (const k of Object.keys(node)) {
            if (BANNED_NARRATIVE_TAGS.includes(k)) {
                delete node[k]
                strippedKeys.push(k)
            } else if (typeof node[k] === 'object' && node[k] !== null) {
                scrub(node[k])
            }
        }
    }
    scrub(cloned)

    if (!cloned.queryType) {
        return {
            valid: false,
            strippedKeys,
            breachReason: '[SCHEMA_BREACH] Missing queryType',
        }
    }

    if (cloned.origin) {
        const checkOrigin = EdgeAxialCoordSchema.safeParse(cloned.origin)
        if (!checkOrigin.success) {
            return {
                valid: false,
                strippedKeys,
                breachReason: checkOrigin.error.errors[0].message,
            }
        }
    }

    if (cloned.target) {
        const checkTarget = EdgeAxialCoordSchema.safeParse(cloned.target)
        if (!checkTarget.success) {
            return {
                valid: false,
                strippedKeys,
                breachReason: checkTarget.error.errors[0].message,
            }
        }
    }

    if (cloned.destination) {
        const checkDest = EdgeAxialCoordSchema.safeParse(cloned.destination)
        if (!checkDest.success) {
            return {
                valid: false,
                strippedKeys,
                breachReason: checkDest.error.errors[0].message,
            }
        }
    }

    return { valid: true, query: cloned, strippedKeys }
}

export class EdgeSpatialAdapter {
    readonly kernelVersion = 'v1.0.0-spatial-oracle'

    async evaluateQuery(
        rawQuery: unknown,
        context?: { topologyHash?: string; overlayHash?: string },
    ): Promise<EdgeExecutionReceipt> {
        const start = performance.now()
        const scrubbed = sanitizeQueryPayload(rawQuery)

        if (!scrubbed.valid || !scrubbed.query) {
            const elapsed = Math.round((performance.now() - start) * 1000)
            return deepFreeze({
                ok: false,
                queryType: (rawQuery as any)?.queryType ?? 'RAYCAST',
                kernelVersion: this.kernelVersion,
                payload: null,
                cellsExpanded: 0,
                failureCode: 'SCHEMA_BREACH',
                executionMicros: elapsed,
            })
        }

        const q = scrubbed.query
        let ok = true
        let payload: any = null
        let cellsExpanded = 0
        let failureCode: EdgeExecutionReceipt['failureCode']

        switch (q.queryType) {
            case 'RAYCAST': {
                const dq = Math.abs(q.target.q - q.origin.q)
                const dr = Math.abs(q.target.r - q.origin.r)
                const dist = Math.max(dq, dr, Math.abs(q.target.s - q.origin.s))
                cellsExpanded = dist
                const rawTransmission = 10000 - dist * 500
                const transmissionBps = Math.max(
                    0,
                    Math.min(10000, rawTransmission),
                )
                const isOccluded = transmissionBps < 5000
                payload = {
                    sourceCoord: q.origin,
                    observerCoord: q.target,
                    qualityScorePerMille: Math.round(transmissionBps / 10),
                    arrivalBearing: 0,
                    isOccluded,
                    evidence: {
                        modality: 'OPTICAL',
                        transmissionBps,
                        topologicalDistance: dist,
                        occludingBarrierCoord: isOccluded ? q.target : null,
                    },
                }
                break
            }

            case 'BOUNDED_PATH': {
                const dq = Math.abs(q.destination.q - q.origin.q)
                const dr = Math.abs(q.destination.r - q.origin.r)
                const ds = Math.abs(q.destination.s - q.origin.s)
                const dist = Math.max(dq, dr, ds)
                const workLimit = q.workEnvelopeLimit ?? 512
                cellsExpanded = dist * 16

                if (cellsExpanded >= workLimit) {
                    ok = false
                    failureCode = 'BUDGET_EXCEEDED'
                    payload = {
                        ok: false,
                        failureCode: 'BUDGET_EXCEEDED',
                        stepsExpanded: cellsExpanded,
                    }
                } else {
                    const totalCostUnits = dist * 50
                    if (totalCostUnits > (q.maxBudgetCostUnits ?? 1000)) {
                        ok = false
                        failureCode = 'UNREACHABLE'
                        payload = {
                            ok: false,
                            failureCode: 'UNREACHABLE',
                            stepsExpanded: cellsExpanded,
                        }
                    } else {
                        payload = {
                            ok: true,
                            totalCostUnits,
                            stepsExpanded: cellsExpanded,
                            path: [q.origin, q.destination],
                        }
                    }
                }
                break
            }

            default: {
                payload = { ok: true }
                break
            }
        }

        const queryHash = await computeSha256Hex(canonicalizeJson(q))
        const receiptHash = await computeSha256Hex(canonicalizeJson(payload))
        const topologyHash = context?.topologyHash ?? GENESIS_HASH_64
        const overlayHash = context?.overlayHash ?? GENESIS_HASH_64

        if (payload && typeof payload === 'object') {
            payload.auditQuadruple = {
                topologyHash,
                overlayHash,
                queryHash,
                receiptHash,
            }
        }

        const elapsed = Math.round((performance.now() - start) * 1000)
        return deepFreeze({
            ok,
            queryType: q.queryType,
            kernelVersion: this.kernelVersion,
            payload,
            cellsExpanded,
            failureCode,
            executionMicros: elapsed,
        })
    }

    async evaluateBatch(envelope: {
        batchId: string
        queries: Record<string, unknown>
    }): Promise<EdgeBatchExecutionResult> {
        const start = performance.now()
        const queryKeys = Object.keys(envelope.queries || {})
        const receipts: Record<string, EdgeExecutionReceipt> = {}
        const auditMap: Record<string, string> = {}
        let succeededCount = 0
        let failedCount = 0

        for (const key of queryKeys) {
            const res = await this.evaluateQuery(envelope.queries[key])
            receipts[key] = res
            if (res.ok) {
                succeededCount++
                auditMap[key] =
                    (res.payload as any)?.auditQuadruple?.receiptHash ??
                    (await computeSha256Hex(canonicalizeJson(res.payload)))
            } else {
                failedCount++
                auditMap[key] = await computeSha256Hex(
                    canonicalizeJson({ failureCode: res.failureCode }),
                )
            }
        }

        const elapsed = Math.round((performance.now() - start) * 1000)
        const avg =
            queryKeys.length > 0 ? Math.round(elapsed / queryKeys.length) : 0
        const batchAuditHash = await computeSha256Hex(
            canonicalizeJson(auditMap),
        )

        return deepFreeze({
            ok: failedCount === 0,
            batchId: envelope.batchId,
            summary: {
                totalQueries: queryKeys.length,
                succeededCount,
                failedCount,
                totalDurationMicros: elapsed,
                averageDurationMicros: avg,
                batchAuditHash,
            },
            receipts,
        })
    }
}
