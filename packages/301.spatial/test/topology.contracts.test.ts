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
        schemaVersion: 'v1.0',
        topologyId: 'loc_staging_01',
        merkleRootHex:
            '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
        cells: [
            {
                coord: { q: 0, r: 0, s: 0 },
                packedId: 2147516416,
                costUnits: 100,
                passable: true,
            },
            {
                coord: { q: 1, r: -1, s: 0 },
                packedId: 2147581951,
                costUnits: 100,
                passable: true,
            },
        ],
        portals: [
            {
                portalId: 'prt_01_to_02',
                fromRoomId: 'loc_staging_01',
                toRoomId: 'loc_staging_02',
                entryCoord: { q: 1, r: -1, s: 0 },
                exitCoord: { q: 0, r: 0, s: 0 },
                acousticDampingCdb: 600,
                traversableDefault: true,
            },
        ],
        occluders: [
            {
                occluderId: 'occ_steam_vent',
                coord: { q: 0, r: 0, s: 0 },
                blocksLoSDefault: true,
                attenuationCdb: 1200,
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

    it('rejects floating-point cell coordinate', () => {
        const invalidFloatPayload = {
            ...validManifestFixture,
            cells: [
                {
                    coord: { q: 0.5, r: -0.5, s: 0 },
                    packedId: 0,
                    costUnits: 100,
                    passable: true,
                },
            ],
        }
        const res = parseAndValidateManifest(invalidFloatPayload)
        expect(res.valid).toBe(false)
    })

    it('applies dynamic overlay overrides immutably without mutating manifest', () => {
        const overlay = createEmptyOverlay('ovr_tick_42')
        const portal = validManifestFixture.portals[0]
        const occluder = validManifestFixture.occluders[0]

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
        expect(db.getActiveManifest()?.merkleRootHex).toBe(
            validManifestFixture.merkleRootHex,
        )

        // Attempting to mutate deep-frozen object throws TypeError in strict mode
        expect(() => {
            // @ts-ignore
            frozen.schemaVersion = 'v2.0'
        }).toThrow(TypeError)
    })
})
