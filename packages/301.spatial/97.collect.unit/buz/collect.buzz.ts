import {
    BatchExecutionResult,
    BatchExecutionSummary,
    BatchQueryEnvelope,
    HomogeneousRaycastBatch,
    SpatialBatchAggregator,
} from '../fce/collect.interface.js'
import {
    BatchExecutionResultSchema,
    BatchQueryEnvelopeSchema,
} from '../val/collect.model.js'
import {
    PureSpatialKernel,
    SpatialExecutionContext,
    SynchronousExecutionReceipt,
} from '../../00.spatial.unit/fce/spatial.interface.js'
import { createSpatialKernel } from '../../00.spatial.unit/buz/spatial.buzz.js'
import { PerceptCandidate } from '../../42.receipt.unit/fce/receipt.interface.js'
import { computeSha256Hex } from '../../19.ledger.unit/buz/ledger.buzz.js'

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

export class SpatialBatchCollector implements SpatialBatchAggregator {
    public readonly kernel: PureSpatialKernel

    constructor(kernel?: PureSpatialKernel) {
        this.kernel = kernel ?? createSpatialKernel()
    }

    /**
     * Executes heterogeneous spatial queries synchronously in key-sorted order,
     * producing consolidated receipts and a joint SHA-256 Merkle root.
     */
    public executeBatch(
        envelope: BatchQueryEnvelope,
        context?: SpatialExecutionContext,
    ): BatchExecutionResult {
        const parsedEnvelope = BatchQueryEnvelopeSchema.parse(envelope)
        const startHr = process.hrtime.bigint()

        const queryKeys = Object.keys(parsedEnvelope.queries).sort((a, b) =>
            a < b ? -1 : a > b ? 1 : 0,
        )

        const receipts: Record<string, SynchronousExecutionReceipt> = {}
        let succeededCount = 0
        let failedCount = 0
        const receiptHashes: string[] = []

        for (let i = 0; i < queryKeys.length; i++) {
            const key = queryKeys[i]
            const rawQuery = parsedEnvelope.queries[key]

            const receipt = this.kernel.executeSynchronousQuery(
                rawQuery,
                context,
            )
            receipts[key] = receipt

            if (receipt.ok) {
                succeededCount++
            } else {
                failedCount++
            }

            receiptHashes.push(`${key}:${receipt.auditQuadruple.receiptHash}`)
        }

        const endHr = process.hrtime.bigint()
        const totalDurationMicros = Number((endHr - startHr) / 1000n)
        const totalQueries = queryKeys.length
        const averageDurationMicros =
            totalQueries > 0
                ? Math.trunc(totalDurationMicros / totalQueries)
                : 0

        const batchAuditHash = computeSha256Hex(
            `BATCH::${parsedEnvelope.batchId}::${receiptHashes.join('|')}`,
        )

        const summary: BatchExecutionSummary = {
            totalQueries,
            succeededCount,
            failedCount,
            totalDurationMicros,
            averageDurationMicros,
            batchAuditHash,
        }

        const rawResult: BatchExecutionResult = {
            batchId: parsedEnvelope.batchId,
            receipts,
            summary,
        }

        const validatedResult = BatchExecutionResultSchema.parse(rawResult)
        return deepFreeze(validatedResult) as BatchExecutionResult
    }

    /**
     * Optimized homogeneous raycast batch executor.
     */
    public executeRaycastBatch(
        batch: HomogeneousRaycastBatch,
        context?: SpatialExecutionContext,
    ): BatchExecutionResult<PerceptCandidate> {
        const envelope: BatchQueryEnvelope = {
            batchId: batch.batchId,
            queries: batch.queries,
        }
        return this.executeBatch(
            envelope,
            context,
        ) as BatchExecutionResult<PerceptCandidate>
    }
}

export const createBatchCollector = (
    kernel?: PureSpatialKernel,
): SpatialBatchAggregator => new SpatialBatchCollector(kernel)

import * as ActCol from '../../97.collect.unit/collect.action.js'

import { CollectModel } from '../collect.model.js'
import CollectBit from '../fce/collect.bit.js'
import State from '../../99.core/state.js'
import CaboodleBit from '../fce/caboodle.bit.js'
import S from 'string'

import * as doT from 'dot'

var bit, lst, dat, idx, val, src, dex

export const initCollect = (cpy: CollectModel, bal: CollectBit, ste: State) => {
    return cpy
}

export const updateCollect = (
    cpy: CollectModel,
    bal: CollectBit,
    ste: State,
) => {
    return cpy
}

//return the first item in a collection
export const fetchCollect = (
    cpy: CollectModel,
    bal: CollectBit,
    ste: State,
) => {
    if (bal.val == null) bal.val = 1

    if (bal.bit == null)
        bal.slv({ clcBit: { idx: 'fetch-collect-err', src: 'no-bit' } })
    var type = bal.bit.split(' ').slice(-1).pop().toLowerCase()
    var cabBit: CaboodleBit = cpy.caboodleBitList[cpy.caboodleBits[type]]

    if (bal.val == 1) bit = cabBit.bitList[0]
    else bit = cabBit

    if (bal.slv != null) bal.slv({ clcBit: { idx: 'fetch-collect', dat: bit } })
    return cpy
}

export const readCollect = async (
    cpy: CollectModel,
    bal: CollectBit,
    ste: State,
) => {
    if (bal.bit == null)
        bal.slv({ clcBit: { idx: 'read-collect-err', src: 'no-bit' } })

    var type = bal.bit.split(' ').slice(-1).pop().toLowerCase()
    if (cpy.caboodleBits[type] == null) createCollect(cpy, { idx: type }, ste)

    var cabBit: CaboodleBit = cpy.caboodleBitList[cpy.caboodleBits[type]]

    if (cabBit.bits[bal.idx] == null) {
        bit = await ste.hunt(ActCol.WRITE_COLLECT, {
            idx: bal.idx,
            src: bal.src,
            bit: bal.bit,
        })
    } else {
        dat = cabBit.bitList[cabBit.bits[bal.idx]]
    }

    if (bal.slv != null) bal.slv({ clcBit: { idx: 'read-collect', dat } })
    return cpy
}

export const writeCollect = async (
    cpy: CollectModel,
    bal: CollectBit,
    ste: State,
) => {
    dat = null

    //let us check see if it exists
    var type = bal.bit.split(' ').slice(-1).pop().toLowerCase()

    if (cpy.caboodleBits[type] == null) createCollect(cpy, { idx: type }, ste)

    if (bal.bit == null)
        bal.slv({ rskBit: { idx: 'write-collect-err', src: 'no-bit' } })

    var cabBit: CaboodleBit = cpy.caboodleBitList[cpy.caboodleBits[type]]

    bal.idx

    val = 0

    if (cabBit.bits[bal.idx] == null) {
        bit = await ste.hunt(bal.bit, {
            idx: bal.idx,
            src: bal.src,
            dat: bal.dat,
        })
        var objDat = bit[Object.keys(bit)[0]]
        dat = objDat.dat

        if (dat == null) dat = {}

        dat.dex = cabBit.bitList.length
        cabBit.bitList.push(dat)

        var idx = bal.idx
        if (idx == null) idx = dat.idx

        if (idx == null) throw new Error('write collect has no idx')

        cabBit.bits[idx] = dat.dex
    } else {
        var cabDat = cabBit.bitList[cabBit.bits[bal.idx]]

        bal.dat

        val = 1

        for (var key in bal.dat) {
            if (cabDat == null) cabDat = {}
            cabDat[key] = bal.dat[key]
        }

        cabBit.bitList[cabBit.bits[bal.idx]] = cabDat
        dat = cabDat

        //!!! SUPER IMPORTANT
    }

    if (dat == null && bal.slv != null)
        bal.slv({ rskBit: { idx: 'write-collect-err', src: 'no-dat' } })

    if (bal.slv != null) bal.slv({ clcBit: { idx: 'write-collect', val, dat } })

    return cpy
}

export const createCollect = (
    cpy: CollectModel,
    bal: CollectBit,
    ste: State,
) => {
    var cabBit: CaboodleBit = { idx: bal.idx, dex: 0, bits: {}, bitList: [] }
    cabBit.dex = cpy.caboodleBitList.length

    cpy.caboodleBitList.push(cabBit)
    cpy.caboodleBits[cabBit.idx] = cabBit.dex

    if (bal.slv != null)
        bal.slv({ clcBit: { idx: 'create-collect', dat: cabBit } })

    return cpy
}

export const removeCollect = async (
    cpy: CollectModel,
    bal: CollectBit,
    ste: State,
) => {
    var type = bal.bit.split(' ').slice(-1).pop().toLowerCase()

    if (cpy.caboodleBits[type] == null)
        return bal.slv({ rskBit: { idx: 'remove-collect-not-present' } })

    var cabBit: CaboodleBit = cpy.caboodleBitList[cpy.caboodleBits[type]]

    if (cabBit.bits[bal.idx] == null)
        return bal.slv({ rskBit: { idx: 'remove-collect-idx-not-present' } })

    bit = await ste.hunt(bal.bit, { idx: bal.idx, src: bal.src, dat: bal.dat })
    var objDat = bit[Object.keys(bit)[0]]
    dat = objDat.dat

    dex = dat.dex

    for (var i = dex; i < cabBit.bitList.length - 1; i++) {
        var update = cabBit.bitList[i]
        update.dex -= 1
    }

    for (var key in dat) {
        dat[key] = null
    }

    delete cabBit.bits[bal.idx]
    var itm = cabBit.bitList.splice(dex, 1)

    cabBit.dex -= 1

    if (bal.slv != null)
        bal.slv({ clcBit: { idx: 'remove-collect', dat: itm[0] } })

    return cpy
}

export const putCollect = (cpy: CollectModel, bal: CollectBit, ste: State) => {
    cpy.caboodleBits[bal.idx] = bal.val
    cpy.caboodleBitList[bal.val] = bal.dat

    if (bal.slv != null)
        bal.slv({ clcBit: { idx: 'put-collect', dat: bal.dat } })
    return cpy
}

export const getCollect = (cpy: CollectModel, bal: CollectBit, ste: State) => {
    val = cpy.caboodleBits[bal.idx]
    dat = cpy.caboodleBitList[val]

    if (bal.slv != null) bal.slv({ clcBit: { idx: 'get-collect', val, dat } })
    return cpy
}

export const modelCollect = (
    cpy: CollectModel,
    bal: CollectBit,
    ste: State,
) => {
    //debugger

    if (bal.slv != null) bal.slv({ clcBit: { idx: 'model-collect', dat: cpy } })
    return cpy
}

export const deleteCollect = (
    cpy: CollectModel,
    bal: CollectBit,
    ste: State,
) => {
    //debugger
    return cpy
}

export const emptyCollect = (
    cpy: CollectModel,
    bal: CollectBit,
    ste: State,
) => {
    //debugger
    return cpy
}

export const dotCollect = (cpy: CollectModel, bal: CollectBit, ste: State) => {
    var gel = bal.dat
    var out = []

    bal.src.split('\n').forEach((a, b) => {
        if (a.includes('//') == true) return
        var doTCompiled = doT.template(a)
        var outLine = doTCompiled(gel)
        out.push(outLine)
    })

    if (bal.slv != null)
        bal.slv({ clcBit: { idx: 'dot-vurt', lst: out, src: out.join('\n') } })

    return cpy
}

export const formatCollect = (
    cpy: CollectModel,
    bal: CollectBit,
    ste: State,
) => {
    lst = bal.src.split(':')

    var idx = lst[0]

    var out = []

    idx = S(idx).collapseWhitespace().s
    var opt = lst[1].split(',')
    opt.forEach((a, b) => {
        var now = S(a).collapseWhitespace().s
        if (a.length < 1) return
        out.push(now)
    })

    dat = [idx, out]

    bal.slv({ clcBit: { idx: 'format-collect', dat } })
    return cpy
}

export const listCollect = (cpy: CollectModel, bal: CollectBit, ste: State) => {
    if (bal.val == null) bal.val = 1
    var type = bal.bit.split(' ').slice(-1).pop().toLowerCase()
    if (cpy.caboodleBits[type] == null) createCollect(cpy, { idx: type }, ste)

    var cabBit: CaboodleBit = cpy.caboodleBitList[cpy.caboodleBits[type]]

    lst = []

    cabBit.bitList.forEach((a) => {
        if (bal.val == 0) {
            lst.push(a)
        } else if (bal.val == 1) {
            if (a.idx != null) lst.push(a.idx)
            if (a.id != null) lst.push(a.id)
        }
    })

    bal.slv({ clcBit: { idx: 'list-collect', lst } })

    return cpy
}

export const hashCollect = (cpy: CollectModel, bal: CollectBit, ste: State) => {
    if (bal.src == null) bal.src = ''
    lst = bal.src.split('\n')

    dat = {}

    lst.forEach((a) => {
        a = S(a).collapseWhitespace().s
        if (a.length < 3) return

        var hold = a.split(':')

        var dom = hold[0]
        var sub = hold[1]

        var now = sub.split(',')

        now.forEach((b, c) => {
            now[c] = S(b).collapseWhitespace().s
        })

        dat[dom] = now
    })

    bal.slv({ clcBit: { idx: 'hash-collect', dat } })

    return cpy
}
