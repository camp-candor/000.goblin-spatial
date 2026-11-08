import { MenuActionPayload, SpatialBus } from '../fce/menu.interface.js'
import { TopologyDatabase } from '../../07.database.unit/buz/database.buzz.js'

export function createTopologyLoaderAction(
    db: TopologyDatabase,
): MenuActionPayload {
    return {
        id: 'TOP01_LOAD_MANIFEST',
        label: 'Load Canonical Manifest',
        shortcut: 'TOP01',
        category: 'TOPOLOGY',
        execute: async (bus: SpatialBus) => {
            // Deterministic synthetic test fixture for local testing
            const fixtureManifest = {
                manifestVersion: '1.0.0',
                rootHash:
                    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
                rooms: [
                    {
                        roomId: 'loc_culvert_basin',
                        roomName: 'Culvert Drainage Basin',
                        cellPitchMm: 1000,
                        ambientNoiseFloorCdb: 3200,
                        maxAdultGoblins: 4,
                        cells: [
                            { q: 0, r: 0, costUnits: 100 },
                            { q: 1, r: 0, costUnits: 100 },
                            { q: 0, r: 1, costUnits: 150 },
                        ],
                        portals: [
                            {
                                portalId: 'port_basin_to_tunnel',
                                fromRoomId: 'loc_culvert_basin',
                                toRoomId: 'loc_maintenance_tunnel',
                                fromCoord: { q: 1, r: 0 },
                                toCoord: { q: 0, r: 0 },
                                acousticDampingCdb: 800,
                                traversableDefault: true,
                            },
                        ],
                        occluders: [
                            {
                                occluderId: 'occ_basin_grate',
                                roomId: 'loc_culvert_basin',
                                coord: { q: 0, r: 1 },
                                blocksLoSDefault: false,
                                acousticDampingCdb: 400,
                            },
                        ],
                    },
                    {
                        roomId: 'loc_maintenance_tunnel',
                        roomName: 'Maintenance Conduit Alpha',
                        cellPitchMm: 1000,
                        ambientNoiseFloorCdb: 2800,
                        maxAdultGoblins: 2,
                        cells: [
                            { q: 0, r: 0, costUnits: 100 },
                            { q: 0, r: -1, costUnits: 120 },
                        ],
                        portals: [],
                        occluders: [],
                    },
                ],
            }

            const cached = db.loadAndCacheManifest(fixtureManifest)
            bus.emit('TELEMETRY_LOG', {
                message: `:: Manifest Loaded: [${cached.rootHash.slice(0, 16)}...] Rooms: ${cached.rooms.length}`,
            })

            for (const r of cached.rooms) {
                bus.emit('TELEMETRY_LOG', {
                    message: `   + Room [${r.roomId}] Cells: ${r.cells.length} Portals: ${r.portals.length} NoiseFloor: ${r.ambientNoiseFloorCdb} cdB`,
                })
            }
        },
    }
}
