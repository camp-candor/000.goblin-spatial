import { MenuActionPayload, SpatialBus } from '../fce/menu.interface.js'
import {
    AxialCoordSchema,
    packAxialCell,
    unpackAxialCell,
    mergeOverlaySnapshot,
} from '../../38.types.unit/index.js'

const ORIGIN_PACKED = 2147516416

const CORNER_EXTREMA: Array<[number, number]> = [
    [-32768, -32768],
    [-32768, 32767],
    [32767, -32768],
    [32767, 32767],
]

const FLOAT_TRAPS: Array<{ q: number; r: number; s: number }> = [
    { q: 1.5, r: -1.5, s: 0 },
    { q: 0, r: 0.25, s: -0.25 },
    { q: 2, r: -1, s: -1.0001 },
]

function verifyCubicInvariant(): void {
    AxialCoordSchema.parse({ q: 10, r: -4, s: -6 })
    let rejected = false
    try {
        AxialCoordSchema.parse({ q: 1, r: 1, s: 0 })
    } catch (err: unknown) {
        rejected = String((err as Error).message).includes(
            'CUBIC_INVARIANT_BREACH',
        )
    }
    if (!rejected) {
        throw new Error('[TYPES:AXIAL] Cubic breach permitted: q + r + s !== 0')
    }
}

function verifyPackingBijection(): void {
    const originPacked = packAxialCell(0, 0)
    if (originPacked !== ORIGIN_PACKED) {
        throw new Error(
            `[TYPES:PACKING] Origin packed mismatch: ${originPacked}`,
        )
    }
    const negOnePacked = packAxialCell(-1, 32767)
    if (originPacked <= negOnePacked) {
        throw new Error(
            '[TYPES:PACKING] Signed shift bug: pack(0,0) <= pack(-1, 32767)',
        )
    }
    for (const [q, r] of CORNER_EXTREMA) {
        const packed = packAxialCell(q, r)
        const cell = unpackAxialCell(packed)
        if (cell.q !== q || cell.r !== r || cell.q + cell.r + cell.s !== 0) {
            throw new Error(
                `[TYPES:PACKING] Corner round-trip failed at (${q}, ${r})`,
            )
        }
    }
}

function verifyFloatRejection(): void {
    for (const input of FLOAT_TRAPS) {
        let rejected = false
        try {
            AxialCoordSchema.parse(input)
        } catch (err: unknown) {
            rejected = String((err as Error).message).includes(
                'FLOAT_PROHIBITED',
            )
        }
        if (!rejected) {
            throw new Error(
                `[TYPES:FLOATS] Floating-point permitted: ${JSON.stringify(input)}`,
            )
        }
    }
}

function verifyOverlayMerger(): void {
    const baseManifest = {
        topologyId: 'loc_test_vault',
        schemaVersion: 'v1.0',
        merkleRootHex: 'a'.repeat(64),
        cells: [
            {
                coord: { q: 0, r: 0, s: 0 },
                packedId: ORIGIN_PACKED,
                costUnits: 100,
                passable: true,
            },
        ],
        portals: [
            {
                portalId: 'portal_blast_door',
                fromRoomId: 'loc_test_vault',
                toRoomId: 'loc_corridor',
                entryCoord: { q: 0, r: 0, s: 0 },
                exitCoord: { q: 1, r: -1, s: 0 },
                acousticDampingCdb: 1000,
                traversableDefault: false,
            },
        ],
        occluders: [
            {
                occluderId: 'occ_view_port',
                coord: { q: 0, r: 0, s: 0 },
                blocksLoSDefault: true,
                attenuationCdb: 800,
            },
        ],
    }
    const overlay = {
        overlayId: 'ovl_emergency_breach',
        parentTopologyHash: 'a'.repeat(64),
        occluderOverrides: { occ_view_port: false },
        portalOverrides: { portal_blast_door: true },
        attenuationDeltasCdb: { occ_view_port: -300 },
    }
    const snapshot = mergeOverlaySnapshot(baseManifest, overlay)
    if (snapshot.portals[0].traversable !== true) {
        throw new Error('[TYPES:OVERLAY] Portal override not applied')
    }
    if (
        snapshot.occluders[0].blocksLoS !== false ||
        snapshot.occluders[0].attenuationCdb !== 500
    ) {
        throw new Error('[TYPES:OVERLAY] Occluder delta not applied correctly')
    }
    if (baseManifest.portals[0].traversableDefault !== false) {
        throw new Error(
            '[TYPES:OVERLAY] Mutation detected on source manifest portals',
        )
    }
    if (!Object.isFrozen(snapshot)) {
        throw new Error('[TYPES:OVERLAY] Returned snapshot is not deep-frozen')
    }
}

export function createTypesAuditAction(): MenuActionPayload {
    return {
        id: 'TYP01_AUDIT_GEOMETRIC_TYPES',
        label: 'Audit Geometric Type Contracts',
        shortcut: 'TYP01',
        category: 'DIAGNOSTIC',
        execute: async (bus: SpatialBus) => {
            const log = (message: string): void => {
                bus.emit('TELEMETRY_LOG', { message })
            }
            log(
                '>> [SPATIAL:TYPES] Running Phase 1 Pure Geometric Types verification...',
            )
            let failed = false
            const stages: Array<[string, () => void]> = [
                [
                    '>> [TYPES:AXIAL] Checking cubic invariant (q + r + s === 0)... [OK]',
                    verifyCubicInvariant,
                ],
                [
                    '>> [TYPES:PACKING] Testing 32-bit PackedAxial bijection across 4 corners... [OK]',
                    verifyPackingBijection,
                ],
                [
                    '>> [TYPES:FLOATS] Asserting negative-control float rejection... [OK]',
                    verifyFloatRejection,
                ],
                [
                    '>> [TYPES:OVERLAY] Testing pure immutable overlay merger... [OK]',
                    verifyOverlayMerger,
                ],
            ]
            for (const [okLine, verify] of stages) {
                try {
                    verify()
                    log(okLine)
                } catch (err: unknown) {
                    failed = true
                    log(okLine.replace('... [OK]', '... [FAIL]'))
                    log(`:: [TYPES:FAULT] ${(err as Error).message}`)
                }
            }
            if (failed) {
                log(
                    '>> [TYPES:STATUS] Phase 1 verification FAILED. See [TYPES:FAULT] lines above.',
                )
                return
            }
            log(
                '>> [TYPES:STATUS] All 38.types.unit schemas certified green at T_0 = $0.00.',
            )
        },
    }
}
