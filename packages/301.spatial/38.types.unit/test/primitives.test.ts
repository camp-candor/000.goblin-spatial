import { describe, it, expect } from 'vitest'
import {
    BasisPointsSchema,
    clampBasisPoints,
    assertBasisPoints,
} from '../fce/primitives.schema.js'
import { CentiDecibelsSchema } from '../fce/acoustic.schema.js'
import {
    Sha256HashSchema,
    CharacterIdSchema,
    LocationIdSchema,
    PossessionIdSchema,
    GrievanceIdSchema,
    MysteryIdSchema,
    PortalIdSchema,
} from '../fce/ident.schema.js'
import {
    scaleBasisPoints,
    scaleBasisPointsBigInt,
    scaleBasisPointsChained,
    divRoundHalfEven,
    divRoundHalfEvenBigInt,
} from '../buz/math.buzz.js'

describe('38.types.unit - Invariant Primitive Schemas', () => {
    describe('BasisPointsSchema', () => {
        it('accepts exact valid integer basis points [0, 10000]', () => {
            expect(BasisPointsSchema.parse(0)).toBe(0)
            expect(BasisPointsSchema.parse(5000)).toBe(5000)
            expect(BasisPointsSchema.parse(10000)).toBe(10000)
        })

        it('rejects floating-point numbers', () => {
            expect(() => BasisPointsSchema.parse(0.5)).toThrowError(
                /\[FLOAT_PROHIBITED\]/,
            )
            expect(() => BasisPointsSchema.parse(9999.99)).toThrowError(
                /\[FLOAT_PROHIBITED\]/,
            )
        })

        it('rejects negative numbers and scalars exceeding 10000', () => {
            expect(() => BasisPointsSchema.parse(-1)).toThrowError(
                /\[OUT_OF_BOUNDS\]/,
            )
            expect(() => BasisPointsSchema.parse(10001)).toThrowError(
                /\[OUT_OF_BOUNDS\]/,
            )
        })

        it('clamps basis points safely while rejecting floats', () => {
            expect(clampBasisPoints(15000)).toBe(10000)
            expect(clampBasisPoints(-500)).toBe(0)
            expect(clampBasisPoints(4200)).toBe(4200)
            expect(() => clampBasisPoints(12.34)).toThrowError(
                /\[FLOAT_PROHIBITED\]/,
            )
        })

        it('asserts basis points with custom label formatting', () => {
            expect(assertBasisPoints(3000, 'Somatic Strain')).toBe(3000)
            expect(() =>
                assertBasisPoints(10005, 'Somatic Strain'),
            ).toThrowError(/Somatic Strain/)
        })
    })

    describe('CentiDecibelsSchema', () => {
        it('accepts non-negative integer centi-decibels', () => {
            expect(CentiDecibelsSchema.parse(0)).toBe(0)
            expect(CentiDecibelsSchema.parse(1200)).toBe(1200)
            expect(CentiDecibelsSchema.parse(12000)).toBe(12000)
        })

        it('rejects negative cdB and floating-point sound values', () => {
            expect(() => CentiDecibelsSchema.parse(-10)).toThrowError(
                /\[OUT_OF_BOUNDS\]/,
            )
            expect(() => CentiDecibelsSchema.parse(45.5)).toThrowError(
                /\[FLOAT_PROHIBITED\]/,
            )
        })
    })

    describe('IdentSlugsSchema', () => {
        it('validates 64-character lowercase SHA-256 strings', () => {
            const validHash = 'a'.repeat(64)
            expect(Sha256HashSchema.parse(validHash)).toBe(validHash)

            expect(() => Sha256HashSchema.parse('a'.repeat(63))).toThrowError(
                /\[INVALID_SHA256\]/,
            )
            expect(() => Sha256HashSchema.parse('A'.repeat(64))).toThrowError(
                /\[INVALID_SHA256\]/,
            )
            expect(() =>
                Sha256HashSchema.parse('xyz'.padEnd(64, '0')),
            ).toThrowError(/\[INVALID_SHA256\]/)
        })

        it('enforces canonical entity identifier regex patterns', () => {
            expect(CharacterIdSchema.parse('char_bog')).toBe('char_bog')
            expect(LocationIdSchema.parse('loc_warm_pipe')).toBe(
                'loc_warm_pipe',
            )
            expect(PossessionIdSchema.parse('item_silver_spoon')).toBe(
                'item_silver_spoon',
            )
            expect(GrievanceIdSchema.parse('grv_spoon_hoarding')).toBe(
                'grv_spoon_hoarding',
            )
            expect(MysteryIdSchema.parse('mystery_vanished_sibling')).toBe(
                'mystery_vanished_sibling',
            )
            expect(PortalIdSchema.parse('prt_crack_north')).toBe(
                'prt_crack_north',
            )

            expect(() => CharacterIdSchema.parse('bog')).toThrowError(
                /\[INVALID_ID\]/,
            )
            expect(() => LocationIdSchema.parse('char_warm_pipe')).toThrowError(
                /\[INVALID_ID\]/,
            )
            expect(() => PossessionIdSchema.parse('ITEM_SPOON')).toThrowError(
                /\[INVALID_ID\]/,
            )
        })
    })

    describe('Banker Rounding Math', () => {
        it('rounds down when remainder is strictly less than 5000', () => {
            // 1000 * 2400 = 2,400,000 / 10,000 = 240, R = 0 -> 240
            expect(scaleBasisPoints(1000, 2400)).toBe(240)
            // 3000 * 1100 = 3,300,000 / 10,000 = 330, R = 0 -> 330
            expect(scaleBasisPoints(3000, 1100)).toBe(330)
            // 1001 * 1000 = 1,001,000 / 10,000 = 100, R = 1,000 (< 5,000) -> 100
            expect(scaleBasisPoints(1001, 1000)).toBe(100)
        })

        it('rounds up when remainder is strictly greater than 5000', () => {
            // 1009 * 1000 = 1,009,000 / 10,000 = 100, R = 9,000 (> 5,000) -> 101
            expect(scaleBasisPoints(1009, 1000)).toBe(101)
            // 7000 * 7501 = 52,507,000 / 10,000 = 5250, R = 7,000 (> 5,000) -> 5251
            expect(scaleBasisPoints(7000, 7501)).toBe(5251)
        })

        it('executes exact Round-Half-Even tie-breaking at remainder = 5000', () => {
            // Tie with even quotient (Q = 2, R = 5000):
            // P = 25,000 -> a = 50, b = 500 -> P / 10,000 = 2, R = 5,000 -> 2 (even stays 2)
            expect(scaleBasisPoints(50, 500)).toBe(2)

            // Tie with odd quotient (Q = 3, R = 5000):
            // P = 35,000 -> a = 70, b = 500 -> P / 10,000 = 3, R = 5,000 -> 4 (odd rounds up to 4)
            expect(scaleBasisPoints(70, 500)).toBe(4)

            // Tie with odd quotient (Q = 1, R = 5000):
            // P = 15,000 -> a = 30, b = 500 -> P / 10,000 = 1, R = 5,000 -> 2 (odd rounds up to 2)
            expect(scaleBasisPoints(30, 500)).toBe(2)
        })

        it('matches BigInt scale parity', () => {
            expect(scaleBasisPointsBigInt(50n, 500n)).toBe(2n)
            expect(scaleBasisPointsBigInt(70n, 500n)).toBe(4n)
            expect(scaleBasisPointsBigInt(1009n, 1000n)).toBe(101n)
        })

        it('enforces strict left-associativity on chained scaling', () => {
            // scaleBasisPointsChained(val, m1, m2) == scaleBasisPoints(scaleBasisPoints(val, m1), m2)
            const res = scaleBasisPointsChained(8000, 5000, 5000)
            const manual1 = scaleBasisPoints(8000, 5000) // 4000
            const manual2 = scaleBasisPoints(manual1, 5000) // 2000
            expect(res).toBe(manual2)
            expect(res).toBe(2000)
        })

        it('tests divRoundHalfEven integer division', () => {
            expect(divRoundHalfEven(5, 2)).toBe(2) // 2.5 -> rounds to even: 2
            expect(divRoundHalfEven(7, 2)).toBe(4) // 3.5 -> rounds to even: 4
            expect(divRoundHalfEven(1, 4)).toBe(0) // 0.25 -> 0
            expect(divRoundHalfEven(3, 4)).toBe(1) // 0.75 -> 1
            expect(() => divRoundHalfEven(10, 0)).toThrowError(/\[DIV_ZERO\]/)
        })

        it('tests divRoundHalfEvenBigInt integer division', () => {
            expect(divRoundHalfEvenBigInt(5n, 2n)).toBe(2n)
            expect(divRoundHalfEvenBigInt(7n, 2n)).toBe(4n)
            expect(() => divRoundHalfEvenBigInt(10n, 0n)).toThrowError(
                /\[DIV_ZERO\]/,
            )
        })
    })
})
