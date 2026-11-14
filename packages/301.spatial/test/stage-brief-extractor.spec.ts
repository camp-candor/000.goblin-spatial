import { describe, it, expect } from 'vitest'
import { createAxialCoord } from '../28.axial.unit/val/axial.model.js'
import {
    buildSpatialEventStageBrief,
    evaluateSpatialIncidentWitnesses,
} from '../23.incident.unit/buz/incident.buzz.js'
import { SpatialEventStageBriefSchema } from '../23.incident.unit/fce/incident.interface.js'

function makeReport(startTime: string) {
    return evaluateSpatialIncidentWitnesses({
        locationId: 'BRASS_WORKSHOP',
        originCoord: createAxialCoord(0, 0),
        actors: [
            { actorId: 'ALICE', coord: createAxialCoord(0, 1) },
            { actorId: 'BOB', coord: createAxialCoord(1, 0) },
        ],
        startDate: '2026-10-31',
        startTime,
    } as never)
}

describe('Spatial Stage Brief Suite', () => {
    it('selects interior slugline for enclosed halls', () => {
        const report = makeReport('14:00')
        const brief = buildSpatialEventStageBrief(report, {
            locationId: 'BRASS_WORKSHOP',
            locationName: 'Brass Workshop',
        })
        expect(brief.intExt).toBe('INT.')
        expect(brief.sluglineToken.startsWith('INT. BRASS WORKSHOP - ')).toBe(
            true,
        )
        expect(brief.sluglineToken).toMatch(/^[\x20-\x7E]*$/)
        expect(brief.exitTransitionHint).toBe('CUT TO:')
    })

    it('selects exterior slugline for open yards', () => {
        const report = makeReport('14:00')
        const brief = buildSpatialEventStageBrief(report, {
            locationId: 'COURTYARD',
            locationName: 'Courtyard',
            isExterior: true,
        })
        expect(brief.intExt).toBe('EXT.')
        expect(brief.sluglineToken.startsWith('EXT. COURTYARD - ')).toBe(true)
    })

    it('renders night gloom distinct from day glare', () => {
        const day = makeReport('14:00')
        const night = evaluateSpatialIncidentWitnesses({
            locationId: 'BRASS_WORKSHOP',
            originCoord: createAxialCoord(0, 0),
            actors: [{ actorId: 'ALICE', coord: createAxialCoord(0, 1) }],
            startDate: '2026-10-31',
            startTime: '21:00',
        } as never)
        const dayBrief = buildSpatialEventStageBrief(day, {
            locationId: 'BRASS_WORKSHOP',
            locationName: 'Brass Workshop',
        })
        const nightBrief = buildSpatialEventStageBrief(night, {
            locationId: 'BRASS_WORKSHOP',
            locationName: 'Brass Workshop',
        })
        expect(dayBrief.lightingActionLine).toContain('glare')
        expect(nightBrief.lightingActionLine).toContain('shadows')
        expect(dayBrief.lightingActionLine).not.toBe(
            nightBrief.lightingActionLine,
        )
        for (const line of [
            dayBrief.lightingActionLine,
            nightBrief.lightingActionLine,
            dayBrief.acousticActionLine,
        ]) {
            expect(line).toMatch(/^[\x20-\x7E]*$/)
        }
    })

    it('emits deterministic blocking beats in sorted order', () => {
        const report = evaluateSpatialIncidentWitnesses({
            locationId: 'BRASS_WORKSHOP',
            originCoord: createAxialCoord(0, 0),
            actors: [
                { actorId: 'ZED', coord: createAxialCoord(1, 0) },
                { actorId: 'ALICE', coord: createAxialCoord(0, 1) },
            ],
            startDate: '2026-10-31',
            startTime: '14:00',
        } as never)
        const brief = buildSpatialEventStageBrief(report, {
            locationId: 'BRASS_WORKSHOP',
            locationName: 'Brass Workshop',
        })
        expect(brief.blockingBeats.length).toBeGreaterThanOrEqual(3)
        expect(brief.blockingBeats[0]).toContain('(0, 0)')
        expect(brief.blockingBeats[1]).toContain('ALICE')
        expect(brief.blockingBeats[1]).toContain('(0, 1)')
        expect(brief.blockingBeats[2]).toContain('ZED')
        expect(brief.witnessParentheticalHint).toBe(
            '(glancing sharply across the room)',
        )
        const blocked = evaluateSpatialIncidentWitnesses({
            locationId: 'BRASS_WORKSHOP',
            originCoord: createAxialCoord(0, 0),
            actors: [{ actorId: 'FAR', coord: createAxialCoord(0, 3) }],
            opaqueCells: [createAxialCoord(0, 1), createAxialCoord(0, 2)],
            startDate: '2026-10-31',
            startTime: '14:00',
        } as never)
        const blockedBrief = buildSpatialEventStageBrief(blocked, {
            locationId: 'BRASS_WORKSHOP',
            locationName: 'Brass Workshop',
        })
        expect(blockedBrief.witnessParentheticalHint).toBe(
            '(listening through the wall)',
        )
    })

    it('rejects malformed brief payloads via strict schema', () => {
        const report = makeReport('14:00')
        const brief = buildSpatialEventStageBrief(report, {
            locationId: 'BRASS_WORKSHOP',
            locationName: 'Brass Workshop',
        })
        expect(() =>
            SpatialEventStageBriefSchema.parse({ ...brief, extra: 1 }),
        ).toThrow()
        expect(() =>
            SpatialEventStageBriefSchema.parse({
                ...brief,
                intExt: 'INT',
            }),
        ).toThrow()
        expect(() =>
            SpatialEventStageBriefSchema.parse({
                ...brief,
                sluglineToken: 'INT. CAF\xE9 - NIGHT',
            }),
        ).toThrow()
    })

    it('produces identical output across repeated builds', () => {
        const first = buildSpatialEventStageBrief(makeReport('14:00'), {
            locationId: 'BRASS_WORKSHOP',
            locationName: 'Brass Workshop',
        })
        const second = buildSpatialEventStageBrief(makeReport('14:00'), {
            locationId: 'BRASS_WORKSHOP',
            locationName: 'Brass Workshop',
        })
        expect(JSON.stringify(first)).toBe(JSON.stringify(second))
    })

    it('enforces EXT/INT sluglines, 23:15 night shift, and safeParse strict rejection', () => {
        const dayBrief = buildSpatialEventStageBrief(makeReport('14:00'), {
            locationId: 'COURTYARD',
            locationName: 'Courtyard',
            isExterior: true,
        })
        expect(dayBrief.sluglineToken.startsWith('EXT.')).toBe(true)
        expect(dayBrief.sluglineToken).toContain('AFTERNOON')
        expect(dayBrief.sluglineToken).toContain('14:00')

        const nightBrief = buildSpatialEventStageBrief(makeReport('23:15'), {
            locationId: 'BRASS_WORKSHOP',
            locationName: 'Brass Workshop',
            isExterior: false,
        })
        expect(nightBrief.sluglineToken.startsWith('INT.')).toBe(true)
        expect(nightBrief.sluglineToken).toContain('NIGHT')
        expect(nightBrief.sluglineToken).toContain('23:15')
        expect(nightBrief.lightingActionLine).not.toBe(
            dayBrief.lightingActionLine,
        )

        const neg = SpatialEventStageBriefSchema.safeParse({
            ...nightBrief,
            unexpectedKey: 'reject-me',
        })
        expect(neg.success).toBe(false)
    })
})
