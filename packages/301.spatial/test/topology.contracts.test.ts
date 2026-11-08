import { describe, it, expect, beforeEach } from 'vitest'
import {
    parseAndValidateManifest,
    findRoomById,
    findCellInRoom,
} from '../12.topology.unit/buz/topology.buzz.js'
import {
    createEmptyOverlay,
    setOccluderOverride,
    setPortalOverride,
    setAttenuationDelta,
    isPortalTraversable,
    isOccluderBlocking,
    getEffectiveAttenuation,
} from '../15.overlay.unit/buz/overlay.buzz.js'
import {
    createTopologyDatabase,
    TopologyDatabase,
} from '../07.database.unit/buz/database.buzz.js'

describe('Phase 3 Canonical Ingestion Overlay Data Contracts (Zod)', () => {
    let db: TopologyDatabase

    const validManifestFixture = {
        manifestVersion: '1.0.0',
        rootHash:
            '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
        rooms: [
            {
                roomId: 'loc_staging_01',
                roomName: 'Staging Chamber',
                cellPitchMm: 1200,
                ambientNoiseFloorCdb: 3000,
                maxAdultGoblins: 6,
                cells: [
                    { q: 0, r: 0, costUnits: 100 },
                    { q: 1, r: -1, costUnits: 100 },
                ],
                portals: [
                    {
                        portalId: 'port_01_to_02',
                        fromRoomId: 'loc_staging_01',
                        toRoomId: 'loc_staging_02',
                        fromCoord: { q: 1, r: -1 },
                        toCoord: { q: 0, r: 0 },
                        acousticDampingCdb: 600,
                        traversableDefault: true,
                    },
                ],
                occluders: [
                    {
                        occluderId: 'occ_steam_vent',
                        roomId: 'loc_staging_01',
                        coord: { q: 0, r: 0 },
                        blocksLoSDefault: true,
                        acousticDampingCdb: 1200,
                    },
                ],
            },
            {
                roomId: 'loc_staging_02',
                roomName: 'Corridor Beta',
                cellPitchMm: 1200,
                ambientNoiseFloorCdb: 3500,
                maxAdultGoblins: 3,
                cells: [{ q: 0, r: 0, costUnits: 100 }],
                portals: [],
                occluders: [],
            },
        ],
    }

    beforeEach(() => {
        db = createTopologyDatabase()
    })

    it('parses valid manifest with Zod and verifies semantic relationships', () => {
        const res = parseAndValidateManifest(validManifestFixture)
        expect(res.valid).toBe(true)
        expect(res.errors.length).toBe(0)
        expect(res.manifest).toBeDefined()

        const room1 = findRoomById(res.manifest!, 'loc_staging_01')
        expect(room1).toBeDefined()
        expect(findCellInRoom(room1!, 0, 0)?.costUnits).toBe(100)
    })

    it('rejects un-schemaed keys via .strict() Zod validation at T_0', () => {
        const maliciousPayload = {
            ...validManifestFixture,
            unauthorizedMetadata: 'FORBIDDEN_KEY',
        }
        const res = parseAndValidateManifest(maliciousPayload)
        expect(res.valid).toBe(false)
        expect(
            res.errors.some(
                (e) =>
                    e.includes('unrecognized_keys') ||
                    e.includes('SCHEMA_ERROR'),
            ),
        ).toBe(true)
    })

    it('rejects floating-point cell pitch and coordinates', () => {
        const invalidFloatPayload = {
            ...validManifestFixture,
            rooms: [
                {
                    ...validManifestFixture.rooms[0],
                    cellPitchMm: 1200.5,
                },
            ],
        }
        const res = parseAndValidateManifest(invalidFloatPayload)
        expect(res.valid).toBe(false)
    })

    it('detects dangling portals targeting non-existent rooms', () => {
        const danglingPayload = {
            ...validManifestFixture,
            rooms: [
                {
                    ...validManifestFixture.rooms[0],
                    portals: [
                        {
                            portalId: 'port_dangling',
                            fromRoomId: 'loc_staging_01',
                            toRoomId: 'loc_void_dimension',
                            fromCoord: { q: 0, r: 0 },
                            toCoord: { q: 0, r: 0 },
                            acousticDampingCdb: 0,
                            traversableDefault: true,
                        },
                    ],
                },
            ],
        }
        const res = parseAndValidateManifest(danglingPayload)
        expect(res.valid).toBe(false)
        expect(res.errors.some((e) => e.includes('DANGLING_PORTAL'))).toBe(true)
    })

    it('applies dynamic overlay overrides immutably without mutating manifest', () => {
        const overlay = createEmptyOverlay('ovr_tick_42')
        const portal = validManifestFixture.rooms[0].portals[0]
        const occluder = validManifestFixture.rooms[0].occluders[0]

        expect(isPortalTraversable(portal, overlay)).toBe(true)
        expect(isOccluderBlocking(occluder, overlay)).toBe(true)

        const shutDoorOverlay = setPortalOverride(
            overlay,
            portal.portalId,
            false,
        )
        const ventClearedOverlay = setOccluderOverride(
            shutDoorOverlay,
            occluder.occluderId,
            false,
        )
        const dampenedOverlay = setAttenuationDelta(
            ventClearedOverlay,
            'occ_steam_vent',
            500,
        )

        // Assert base overlay remained untouched
        expect(isPortalTraversable(portal, overlay)).toBe(true)
        // Assert updated overlay states
        expect(isPortalTraversable(portal, dampenedOverlay)).toBe(false)
        expect(isOccluderBlocking(occluder, dampenedOverlay)).toBe(false)
        expect(
            getEffectiveAttenuation('occ_steam_vent', 1200, dampenedOverlay),
        ).toBe(1700)
    })

    it('caches manifest in database and enforces deep-freeze immutability', () => {
        const frozen = db.loadAndCacheManifest(validManifestFixture)
        expect(db.size()).toBe(1)
        expect(db.getActiveManifest()?.rootHash).toBe(
            validManifestFixture.rootHash,
        )

        // Attempting to mutate deep-frozen object throws TypeError in strict mode
        expect(() => {
            // @ts-ignore
            //  - testing runtime mutation rejection
            frozen.manifestVersion = '2.0.0'
        }).toThrow(TypeError)

        expect(() => {
            //  - testing nested runtime mutation rejection
            frozen.rooms[0].roomName = 'Mutated Room Name'
        }).toThrow(TypeError)
    })
})
