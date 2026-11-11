import { PortModel } from '../port.model.js'
import type PortBit from '../fce/port.bit.js'
import type State from '../../99.core/state.js'
import {
    QueryStripValidationResult,
    ScrubbedSpatialQuery,
    SynchronousExecutionReceipt,
} from '../fce/port.interface.js'
import {
    BANNED_NARRATIVE_TAGS,
    SpatialQueryDiscriminatorSchema,
} from '../val/port.model.js'

function deepFreeze<T>(obj: T): Readonly<T> {
    if (obj === null || typeof obj !== 'object') {
        return obj
    }
    Object.freeze(obj)
    for (const key of Object.keys(obj as object)) {
        const value = (obj as Record<string, unknown>)[key]
        if (
            value !== null &&
            typeof value === 'object' &&
            !Object.isFrozen(value)
        ) {
            deepFreeze(value)
        }
    }
    return obj as Readonly<T>
}

export function detectBannedNarrativeTags(
    raw: Record<string, unknown>,
): string[] {
    const detected: string[] = []
    for (const tag of BANNED_NARRATIVE_TAGS) {
        if (tag in raw) {
            detected.push(tag)
        }
    }
    return detected
}

export function scrubAndValidateSpatialQuery(
    rawInput: unknown,
): QueryStripValidationResult {
    if (
        rawInput === null ||
        typeof rawInput !== 'object' ||
        Array.isArray(rawInput)
    ) {
        return {
            valid: false,
            errors: ['QUERY_PAYLOAD_MUST_BE_OBJECT'],
            strippedKeyCount: 0,
            strippedKeys: [],
        }
    }

    const rawRecord = JSON.parse(JSON.stringify(rawInput)) as Record<
        string,
        any
    >
    const detectedNarrativeTags = detectBannedNarrativeTags(rawRecord)
    if (detectedNarrativeTags.length > 0) {
        return {
            valid: false,
            errors: [
                `NARRATIVE_TAGS_FORBIDDEN: Ingress rejected due to epistemic firewall breach: [${detectedNarrativeTags.join(', ')}]`,
            ],
            strippedKeyCount: 0,
            strippedKeys: [],
        }
    }

    if (rawRecord.origin && typeof rawRecord.origin === 'object') {
        if (
            rawRecord.origin.s === undefined &&
            typeof rawRecord.origin.q === 'number' &&
            typeof rawRecord.origin.r === 'number'
        ) {
            rawRecord.origin.s = -rawRecord.origin.q - rawRecord.origin.r
        }
    }
    if (rawRecord.target && typeof rawRecord.target === 'object') {
        if (
            rawRecord.target.s === undefined &&
            typeof rawRecord.target.q === 'number' &&
            typeof rawRecord.target.r === 'number'
        ) {
            rawRecord.target.s = -rawRecord.target.q - rawRecord.target.r
        }
    }
    if (rawRecord.destination && typeof rawRecord.destination === 'object') {
        if (
            rawRecord.destination.s === undefined &&
            typeof rawRecord.destination.q === 'number' &&
            typeof rawRecord.destination.r === 'number'
        ) {
            rawRecord.destination.s =
                -rawRecord.destination.q - rawRecord.destination.r
        }
    }
    if (rawRecord.queryType === 'RAYCAST') {
        if (!rawRecord.mode && rawRecord.calculationMode) {
            rawRecord.mode = rawRecord.calculationMode
        }
        delete rawRecord.calculationMode
        delete rawRecord.thresholdBps
    }

    const parsed = SpatialQueryDiscriminatorSchema.safeParse(rawRecord)
    if (!parsed.success) {
        const errors = parsed.error.issues.map((issue) => {
            let msg = issue.message
            if (issue.path.includes('q') && msg.includes('FLOAT_PROHIBITED')) {
                msg = `${msg} COORD_Q_MUST_BE_INTEGER`
            }
            return `${issue.path.join('.') || 'root'}: [${issue.code}] ${msg}`
        })
        return {
            valid: false,
            errors,
            strippedKeyCount: 0,
            strippedKeys: [],
        }
    }

    const scrubbedQuery = deepFreeze(parsed.data) as ScrubbedSpatialQuery
    return {
        valid: true,
        query: scrubbedQuery,
        scrubbedQuery,
        errors: [],
        strippedKeyCount: 0,
        strippedKeys: [],
    }
}

export function sanitizeLooseQueryInput(
    rawInput: Record<string, unknown>,
    allowedKeys: readonly string[],
): { sanitized: Record<string, unknown>; strippedCount: number } {
    const sanitized: Record<string, unknown> = {}
    let strippedCount = 0

    for (const [key, value] of Object.entries(rawInput)) {
        if (allowedKeys.includes(key)) {
            sanitized[key] = value
        } else {
            strippedCount++
        }
    }

    return { sanitized, strippedCount }
}

/**
 * Epistemic Firewall: Recursively sanitizes query payloads by stripping narrative lore tags.
 * Rejects payloads if banned values represent prose contamination.
 */
export function sanitizeSpatialQueryPayload(
    rawPayload: unknown,
): QueryStripValidationResult {
    if (rawPayload === null || typeof rawPayload !== 'object') {
        return {
            valid: false,
            strippedKeys: [],
            breachReason:
                '[SCHEMA_BREACH] Raw payload must be a non-null object',
        }
    }

    const strippedKeys: string[] = []
    const cloned = JSON.parse(JSON.stringify(rawPayload))

    function scrubNode(node: Record<string, any>): void {
        for (const key of Object.keys(node)) {
            if (BANNED_NARRATIVE_TAGS.includes(key as any)) {
                delete node[key]
                strippedKeys.push(key)
            } else if (typeof node[key] === 'object' && node[key] !== null) {
                scrubNode(node[key])
                if (Object.keys(node[key]).length === 0) {
                    delete node[key]
                }
            }
        }
    }

    scrubNode(cloned)

    const parsed = SpatialQueryDiscriminatorSchema.safeParse(cloned)
    if (!parsed.success) {
        return {
            valid: false,
            strippedKeys: Object.freeze(strippedKeys),
            breachReason: `[SCHEMA_BREACH] ${parsed.error.errors.map((e) => e.message).join('; ')}`,
        }
    }

    return {
        valid: true,
        scrubbedQuery: Object.freeze(parsed.data) as ScrubbedSpatialQuery,
        strippedKeys: Object.freeze(strippedKeys),
    }
}

/**
 * Deterministic Bounded Work Envelope Guard.
 */
export function checkWorkBudgetGuard(
    cellsExpanded: number,
    workEnvelopeLimit: number,
): { tripped: boolean; failureCode?: 'BUDGET_EXCEEDED' } {
    if (cellsExpanded >= workEnvelopeLimit) {
        return { tripped: true, failureCode: 'BUDGET_EXCEEDED' }
    }
    return { tripped: false }
}

export const initPort = (
    cpy: PortModel,
    bal?: PortBit,
    ste?: State,
): PortModel => {
    cpy.totalQueriesProcessed = 0
    cpy.totalBudgetsTripped = 0
    cpy.lastExecutionMicros = 0

    if (bal?.slv) {
        bal.slv({
            prtBit: { idx: 'init-port', val: 1, src: cpy.kernelVersion },
        })
    }
    return cpy
}

export const sanitizeQuery = (
    cpy: PortModel,
    bal?: PortBit,
    ste?: State,
): PortModel => {
    const result = sanitizeSpatialQueryPayload(bal?.dat?.query)

    if (bal?.slv) {
        bal.slv({
            prtBit: {
                idx: 'sanitize-query',
                val: result.valid ? 1 : 0,
                dat: {
                    scrubbedQuery: result.scrubbedQuery,
                    error: result.breachReason,
                },
            },
        })
    }
    return cpy
}

export const executeQuery = (
    cpy: PortModel,
    bal?: PortBit,
    ste?: State,
): PortModel => {
    const startHr =
        typeof performance !== 'undefined' ? performance.now() : Date.now()
    const rawQuery = bal?.dat?.query

    const sanitizeResult = sanitizeSpatialQueryPayload(rawQuery)
    if (!sanitizeResult.valid || !sanitizeResult.scrubbedQuery) {
        const elapsed = Math.round(
            ((typeof performance !== 'undefined'
                ? performance.now()
                : Date.now()) -
                startHr) *
                1000,
        )
        cpy.lastExecutionMicros = elapsed

        const receipt: SynchronousExecutionReceipt = {
            ok: false,
            queryType: (rawQuery as any)?.queryType ?? 'RAYCAST',
            kernelVersion: cpy.kernelVersion,
            payload: null,
            cellsExpanded: 0,
            failureCode: 'SCHEMA_BREACH',
            executionMicros: elapsed,
        }

        if (bal?.slv) {
            bal.slv({
                prtBit: {
                    idx: 'execute-query-fail',
                    val: 0,
                    dat: { receipt, error: sanitizeResult.breachReason },
                },
            })
        }
        return cpy
    }

    const query = sanitizeResult.scrubbedQuery
    const envelopeLimit = (query as any).workEnvelopeLimit ?? 512

    // Evaluate execution within bounded synchronous envelopes
    let cellsExpanded = 0
    let ok = true
    let failureCode: SynchronousExecutionReceipt['failureCode']

    if (query.queryType === 'BOUNDED_PATH') {
        const dx = Math.abs(query.destination.q - query.origin.q)
        const dy = Math.abs(query.destination.r - query.origin.r)
        cellsExpanded = (dx + dy) * 10

        const budgetTrip = checkWorkBudgetGuard(cellsExpanded, envelopeLimit)
        if (budgetTrip.tripped) {
            ok = false
            failureCode = 'BUDGET_EXCEEDED'
            cpy.totalBudgetsTripped += 1
        }
    }

    cpy.totalQueriesProcessed += 1
    const elapsedMicros = Math.round(
        ((typeof performance !== 'undefined' ? performance.now() : Date.now()) -
            startHr) *
            1000,
    )
    cpy.lastExecutionMicros = elapsedMicros

    const receipt: SynchronousExecutionReceipt = Object.freeze({
        ok,
        queryType: query.queryType,
        kernelVersion: cpy.kernelVersion,
        payload: ok
            ? 'origin' in query
                ? { origin: query.origin }
                : { targetCell: (query as any).targetCell }
            : null,
        cellsExpanded,
        failureCode,
        executionMicros: elapsedMicros,
    })

    if (bal?.slv) {
        bal.slv({
            prtBit: {
                idx: 'execute-query-success',
                val: ok ? 1 : 0,
                dat: { receipt },
            },
        })
    }
    return cpy
}
