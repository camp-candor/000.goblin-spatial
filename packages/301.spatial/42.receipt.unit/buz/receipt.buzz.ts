import { ReceiptModel } from '../receipt.model.js'
import type ReceiptBit from '../fce/receipt.bit.js'
import type State from '../../99.core/state.js'
import type {
    DisplacementReceipt,
    PathReceipt,
    PerceptCandidate,
    SpatialChronologyStamp,
    SpatialDaypart,
} from '../fce/receipt.interface.js'
import {
    DisplacementReceiptSchema,
    PathReceiptSchema,
    PerceptCandidateSchema,
} from '../val/receipt.model.js'

const SPATIAL_DAYPARTS: readonly SpatialDaypart[] = Object.freeze([
    'DAWN',
    'MORNING',
    'AFTERNOON',
    'DUSK',
    'NIGHT',
])

function isIntegerIn(value: unknown, min: number, max: number): boolean {
    return (
        typeof value === 'number' &&
        Number.isInteger(value) &&
        value >= min &&
        value <= max
    )
}

export function isValidChronologyStamp(
    candidate: unknown,
): candidate is SpatialChronologyStamp {
    if (candidate === null || typeof candidate !== 'object') return false
    const c = candidate as Record<string, unknown>
    if (typeof c.start_date !== 'string') return false
    if (!/^\d{4}-\d{2}-\d{2}$/.test(c.start_date)) return false
    if (typeof c.start_time_hm !== 'string') return false
    if (!/^\d{2}:\d{2}$/.test(c.start_time_hm)) return false
    if (typeof c.daypart !== 'string') return false
    if ((SPATIAL_DAYPARTS as readonly string[]).includes(c.daypart) === false) {
        return false
    }
    if (!isIntegerIn(c.ambient_luminance_bps, 0, 10000)) return false
    if (!isIntegerIn(c.optical_range_scale_bps, 0, 10000)) return false
    if (typeof c.diurnal_noise_delta_cdb !== 'number') return false
    if (!Number.isInteger(c.diurnal_noise_delta_cdb)) return false
    if (typeof c.timezone_label !== 'string') return false
    if (c.timezone_label.length < 1) return false
    return true
}

export function stampReceiptChronology<T extends object>(
    receipt: T,
    chronology?: SpatialChronologyStamp,
): T & { chronology?: SpatialChronologyStamp } {
    if (chronology === undefined) return { ...receipt }
    return deepFreezeReceipt({
        ...receipt,
        chronology: deepFreezeReceipt({ ...chronology }),
    })
}

function splitChronology<T>(candidate: unknown): {
    rest: T
    chronology?: SpatialChronologyStamp
    chronologyError?: string
} {
    if (candidate === null || typeof candidate !== 'object') {
        return { rest: candidate as T }
    }
    const { chronology, ...rest } = candidate as Record<string, unknown>
    if (chronology === undefined) return { rest: rest as unknown as T }
    if (!isValidChronologyStamp(chronology)) {
        return {
            rest: rest as unknown as T,
            chronologyError:
                '[CHRONOLOGY_SCHEMA_BREACH] chronology stamp violates integer daypart contract',
        }
    }
    return {
        rest: rest as unknown as T,
        chronology: deepFreezeReceipt({
            ...(chronology as object),
        }) as SpatialChronologyStamp,
    }
}

/**
 * Deep freezes an object recursively to guarantee plain data immutability.
 */
export function deepFreezeReceipt<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') return obj
    Object.freeze(obj)
    for (const key of Object.getOwnPropertyNames(obj)) {
        const val = (obj as any)[key]
        if (val !== null && typeof val === 'object' && !Object.isFrozen(val)) {
            deepFreezeReceipt(val)
        }
    }
    return obj
}

export const initReceipt = (
    cpy: ReceiptModel,
    bal?: ReceiptBit,
    ste?: State,
): ReceiptModel => {
    cpy.totalPathReceiptsMinted = 0
    cpy.totalPerceptReceiptsMinted = 0
    cpy.totalDisplacementReceiptsMinted = 0
    cpy.lastMintedTimestamp = 0

    if (bal?.slv) {
        bal.slv({ rcpBit: { idx: 'init-receipt-success', val: 1 } })
    }
    return cpy
}

export const mintPathReceipt = (
    cpy: ReceiptModel,
    bal?: ReceiptBit,
    ste?: State,
): ReceiptModel => {
    const split = splitChronology(bal?.dat?.pathReceipt)
    if (split.chronologyError) {
        if (bal?.slv) {
            bal.slv({
                rcpBit: {
                    idx: 'mint-path-receipt-fail',
                    val: 0,
                    dat: { error: split.chronologyError },
                },
            })
        }
        return cpy
    }
    const parsed = PathReceiptSchema.safeParse(split.rest)

    if (!parsed.success) {
        if (bal?.slv) {
            bal.slv({
                rcpBit: {
                    idx: 'mint-path-receipt-fail',
                    val: 0,
                    dat: {
                        error: `[PATH_RECEIPT_SCHEMA_BREACH] ${parsed.error.errors.map((e) => e.message).join('; ')}`,
                    },
                },
            })
        }
        return cpy
    }

    const sealedReceipt = deepFreezeReceipt(
        stampReceiptChronology(parsed.data as PathReceipt, split.chronology),
    )
    cpy.totalPathReceiptsMinted += 1
    cpy.lastMintedTimestamp = Date.now()

    if (bal?.slv) {
        bal.slv({
            rcpBit: {
                idx: 'mint-path-receipt-success',
                val: 1,
                dat: { pathReceipt: sealedReceipt },
            },
        })
    }
    return cpy
}

export const mintPerceptReceipt = (
    cpy: ReceiptModel,
    bal?: ReceiptBit,
    ste?: State,
): ReceiptModel => {
    const split = splitChronology(bal?.dat?.perceptCandidate)
    if (split.chronologyError) {
        if (bal?.slv) {
            bal.slv({
                rcpBit: {
                    idx: 'mint-percept-receipt-fail',
                    val: 0,
                    dat: { error: split.chronologyError },
                },
            })
        }
        return cpy
    }
    const parsed = PerceptCandidateSchema.safeParse(split.rest)

    if (!parsed.success) {
        if (bal?.slv) {
            bal.slv({
                rcpBit: {
                    idx: 'mint-percept-receipt-fail',
                    val: 0,
                    dat: {
                        error: `[PERCEPT_RECEIPT_SCHEMA_BREACH] ${parsed.error.errors.map((e) => e.message).join('; ')}`,
                    },
                },
            })
        }
        return cpy
    }

    const sealedCandidate = deepFreezeReceipt(
        stampReceiptChronology(
            parsed.data as PerceptCandidate,
            split.chronology,
        ),
    )
    cpy.totalPerceptReceiptsMinted += 1
    cpy.lastMintedTimestamp = Date.now()

    if (bal?.slv) {
        bal.slv({
            rcpBit: {
                idx: 'mint-percept-receipt-success',
                val: 1,
                dat: { perceptCandidate: sealedCandidate },
            },
        })
    }
    return cpy
}

export const mintDisplacementReceipt = (
    cpy: ReceiptModel,
    bal?: ReceiptBit,
    ste?: State,
): ReceiptModel => {
    const split = splitChronology(bal?.dat?.displacementReceipt)
    if (split.chronologyError) {
        if (bal?.slv) {
            bal.slv({
                rcpBit: {
                    idx: 'mint-displacement-receipt-fail',
                    val: 0,
                    dat: { error: split.chronologyError },
                },
            })
        }
        return cpy
    }
    const parsed = DisplacementReceiptSchema.safeParse(split.rest)

    if (!parsed.success) {
        if (bal?.slv) {
            bal.slv({
                rcpBit: {
                    idx: 'mint-displacement-receipt-fail',
                    val: 0,
                    dat: {
                        error: `[DISPLACEMENT_RECEIPT_SCHEMA_BREACH] ${parsed.error.errors.map((e) => e.message).join('; ')}`,
                    },
                },
            })
        }
        return cpy
    }

    const sealedDisplacement = deepFreezeReceipt(
        stampReceiptChronology(
            parsed.data as DisplacementReceipt,
            split.chronology,
        ),
    )
    cpy.totalDisplacementReceiptsMinted += 1
    cpy.lastMintedTimestamp = Date.now()

    if (bal?.slv) {
        bal.slv({
            rcpBit: {
                idx: 'mint-displacement-receipt-success',
                val: 1,
                dat: { displacementReceipt: sealedDisplacement },
            },
        })
    }
    return cpy
}
