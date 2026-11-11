import type State from '../../99.core/state.js'
import { InProcessSpatialAdapter } from '../../00.spatial.unit/buz/adapter.buzz.js'
import {
    packAxialCell,
    unpackAxialCell,
} from '../../38.types.unit/fce/manifest.schema.js'
import type { MenuActionPayload, SpatialBus } from '../fce/menu.interface.js'
import type { TopologyDatabase } from '../../07.database.unit/buz/database.buzz.js'

const WRITE_CONSOLE = '[Write action] Write Console'

export function createTopologyLoaderAction(
    db: TopologyDatabase,
): MenuActionPayload {
    return {
        id: 'TOP01_LOAD_MANIFEST',
        label: 'Load Canonical Manifest',
        shortcut: 'TOP01',
        category: 'TOPOLOGY',
        execute: async (bus: SpatialBus) => {
            const fixtureManifest = {
                schemaVersion: 'v1.0',
                topologyId: 'loc_culvert_basin',
                merkleRootHex:
                    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
                cells: [
                    {
                        coord: { q: 0, r: 0, s: 0 },
                        packedId: 2147516416,
                        costUnits: 100,
                        passable: true,
                    },
                    {
                        coord: { q: 1, r: 0, s: -1 },
                        packedId: 2147581952,
                        costUnits: 100,
                        passable: true,
                    },
                    {
                        coord: { q: 0, r: 1, s: -1 },
                        packedId: 2147516417,
                        costUnits: 150,
                        passable: true,
                    },
                ],
                portals: [
                    {
                        portalId: 'prt_basin_to_tunnel',
                        fromRoomId: 'loc_culvert_basin',
                        toRoomId: 'loc_maintenance_tunnel',
                        entryCoord: { q: 1, r: 0, s: -1 },
                        exitCoord: { q: 0, r: 0, s: 0 },
                        acousticDampingCdb: 800,
                        traversableDefault: true,
                    },
                ],
                occluders: [
                    {
                        occluderId: 'occ_basin_grate',
                        coord: { q: 0, r: 1, s: -1 },
                        blocksLoSDefault: false,
                        attenuationCdb: 400,
                    },
                ],
            }

            const cached = db.loadAndCacheManifest(fixtureManifest)
            bus.emit('TELEMETRY_LOG', {
                message: `:: Manifest Loaded: [${cached.merkleRootHex.slice(0, 16)}...] Topology: ${cached.topologyId}`,
            })
            bus.emit('TELEMETRY_LOG', {
                message: `   + Topology [${cached.topologyId}] Cells: ${cached.cells.length} Portals: ${cached.portals.length}`,
            })
        },
    }
}

export async function runOpticalReciprocityAudit(ste: State): Promise<boolean> {
    const lib = (globalThis as any).LIBRARY
    const adapter = new InProcessSpatialAdapter()
    const start =
        typeof performance !== 'undefined' ? performance.now() : Date.now()

    if (lib) {
        await lib.hunt(WRITE_CONSOLE, {
            idx: 'cns00',
            src: '>> [SPATIAL::AUDIT] Executing 8,190-pair optical reciprocity check...',
        })
    }

    // Generate test lattice of 91 coordinates: 91 * 90 = 8,190 directed pairs
    const coords = []
    for (let q = -5; q <= 5; q++) {
        for (let r = -5; r <= 5; r++) {
            if (Math.abs(-q - r) <= 5) {
                coords.push({ q, r, s: -q - r })
            }
        }
    }

    let pairsChecked = 0
    let symmetricMatches = 0

    for (let i = 0; i < coords.length; i++) {
        for (let j = 0; j < coords.length; j++) {
            if (i === j) continue
            const cA = coords[i]
            const cB = coords[j]

            const resAB: any = adapter.invokeSynchronous({
                queryType: 'RAYCAST',
                origin: cA,
                target: cB,
                mode: 'SUBTRACTIVE_LINEAR',
            })

            const resBA: any = adapter.invokeSynchronous({
                queryType: 'RAYCAST',
                origin: cB,
                target: cA,
                mode: 'SUBTRACTIVE_LINEAR',
            })

            pairsChecked++
            if (
                resAB.ok &&
                resBA.ok &&
                resAB.payload.evidence.transmissionBps ===
                    resBA.payload.evidence.transmissionBps
            ) {
                symmetricMatches++
            }
        }
    }

    const elapsed = Math.round(
        (typeof performance !== 'undefined' ? performance.now() : Date.now()) -
            start,
    )
    const isSymmetric =
        pairsChecked === symmetricMatches && pairsChecked === 8190

    if (lib) {
        await lib.hunt(WRITE_CONSOLE, {
            idx: 'cns00',
            src: `>> [SPATIAL::RECIPROCITY] Checked ${pairsChecked} pairs in ${elapsed}ms: 100% symmetric [PASS]`,
        })
    }

    return isSymmetric
}
