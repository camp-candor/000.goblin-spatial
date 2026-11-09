import { describe, it, expect } from 'vitest'
import {
    scrubAndValidateSpatialQuery,
    sanitizeLooseQueryInput,
    detectBannedNarrativeTags,
} from '../14.port.unit/buz/port.buzz.js'
import { BANNED_NARRATIVE_TAGS } from '../14.port.unit/val/port.model.js'

describe('Task 8.1 Scrubbed Query Input Schema Stripper', () => {
    it('accepts valid pure-integer raycast query and returns deep-frozen DTO', () => {
        const raw = {
            queryType: 'RAYCAST',
            origin: { q: 0, r: 0 },
            target: { q: 2, r: -1 },
            thresholdBps: 500,
            calculationMode: 'SUBTRACTIVE_LINEAR',
        }

        const res = scrubAndValidateSpatialQuery(raw)
        expect(res.valid).toBe(true)
        expect(res.query).toBeDefined()
        expect(res.errors.length).toBe(0)

        if (res.valid && res.query && res.query.queryType === 'RAYCAST') {
            expect(Object.isFrozen(res.query)).toBe(true)
            expect(Object.isFrozen(res.query.origin)).toBe(true)
            // Mutation attempt throws TypeError
            expect(() => {
                // @ts-expect-error - testing immutability
                res.query.origin.q = 99
            }).toThrow(TypeError)
        }
    })

    it('rejects queries containing banned narrative tags with epistemic firewall error', () => {
        const contaminatedQueries = [
            {
                queryType: 'RAYCAST',
                origin: { q: 0, r: 0 },
                target: { q: 1, r: 0 },
                character_id: 'char_scrag',
            },
            {
                queryType: 'BOUNDED_PATH',
                origin: { q: 0, r: 0 },
                destination: { q: 2, r: 0 },
                maxBudgetCostUnits: 500,
                dialogue_text: 'Move swiftly through the vent.',
            },
            {
                queryType: 'ACOUSTIC_WAVEFRONT',
                sourceCoord: { q: 0, r: 0 },
                sourceIntensityCdb: 8000,
                ambientNoiseFloorCdb: 2000,
                emotion: 'DESPERATE_CALCULATING',
            },
        ]

        for (const raw of contaminatedQueries) {
            const res = scrubAndValidateSpatialQuery(raw)
            expect(res.valid).toBe(false)
            expect(res.errors[0]).toContain('NARRATIVE_TAGS_FORBIDDEN')
            expect(res.query).toBeUndefined()
        }
    })

    it('rejects un-schemaed arbitrary properties via .strict() validation', () => {
        const payload = {
            queryType: 'RAYCAST',
            origin: { q: 0, r: 0 },
            target: { q: 1, r: 1 },
            hallucinated_camera_tag: 'DRONE_SHOT_WIDE',
        }

        const res = scrubAndValidateSpatialQuery(payload)
        expect(res.valid).toBe(false)
        expect(res.errors.some((e) => e.includes('Unrecognized key(s)'))).toBe(
            true,
        )
    })

    it('rejects floating-point coordinates and decibels with integer validation errors', () => {
        const floatRaycast = {
            queryType: 'RAYCAST',
            origin: { q: 0.5, r: 0 }, // Fractional coordinate forbidden
            target: { q: 1, r: 0 },
        }

        const floatAcoustic = {
            queryType: 'ACOUSTIC_WAVEFRONT',
            sourceCoord: { q: 0, r: 0 },
            sourceIntensityCdb: 8000.75, // Fractional cdB forbidden
            ambientNoiseFloorCdb: 2000,
        }

        const resRay = scrubAndValidateSpatialQuery(floatRaycast)
        expect(resRay.valid).toBe(false)
        expect(
            resRay.errors.some((e) => e.includes('COORD_Q_MUST_BE_INTEGER')),
        ).toBe(true)

        const resAcoustic = scrubAndValidateSpatialQuery(floatAcoustic)
        expect(resAcoustic.valid).toBe(false)
    })

    it('sanitizes loose inputs by stripping non-allowed keys', () => {
        const raw = {
            queryType: 'BOUNDED_PATH',
            origin: { q: 0, r: 0 },
            destination: { q: 3, r: 0 },
            maxBudgetCostUnits: 600,
            narrative_subtext: 'Fleeing from sentry',
            actor_mood: 'PANIC',
        }

        const allowed = [
            'queryType',
            'origin',
            'destination',
            'maxBudgetCostUnits',
        ]
        const { sanitized, strippedCount } = sanitizeLooseQueryInput(
            raw,
            allowed,
        )

        expect(strippedCount).toBe(2)
        expect(sanitized).toEqual({
            queryType: 'BOUNDED_PATH',
            origin: { q: 0, r: 0 },
            destination: { q: 3, r: 0 },
            maxBudgetCostUnits: 600,
        })
        expect(detectBannedNarrativeTags(sanitized).length).toBe(0)
    })

    it('rejects non-object or malformed root payloads', () => {
        expect(scrubAndValidateSpatialQuery(null).valid).toBe(false)
        expect(scrubAndValidateSpatialQuery('STRING_INPUT').valid).toBe(false)
        expect(scrubAndValidateSpatialQuery([1, 2, 3]).valid).toBe(false)
    })
})
