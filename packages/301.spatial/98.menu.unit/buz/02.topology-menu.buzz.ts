import { MenuActionPayload, SpatialBus } from '../fce/menu.interface.js';
import { TopologyDatabase } from '../../07.database.unit/buz/database.buzz.js';

export function createTopologyLoaderAction(db: TopologyDatabase): MenuActionPayload {
  return {
    id: 'TOP01_LOAD_MANIFEST',
    label: 'Load Canonical Manifest',
    shortcut: 'TOP01',
    category: 'TOPOLOGY',
    execute: async (bus: SpatialBus) => {
      // Deterministic synthetic test fixture for local testing
      const fixtureManifest = {
        schemaVersion: 'v1.0',
        topologyId: 'loc_culvert_basin',
        merkleRootHex: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        cells: [
          { coord: { q: 0, r: 0, s: 0 }, packedId: 2147516416, costUnits: 100, passable: true },
          { coord: { q: 1, r: 0, s: -1 }, packedId: 2147581952, costUnits: 100, passable: true },
          { coord: { q: 0, r: 1, s: -1 }, packedId: 2147516417, costUnits: 150, passable: true }
        ],
        portals: [
          {
            portalId: 'prt_basin_to_tunnel',
            fromRoomId: 'loc_culvert_basin',
            toRoomId: 'loc_maintenance_tunnel',
            entryCoord: { q: 1, r: 0, s: -1 },
            exitCoord: { q: 0, r: 0, s: 0 },
            acousticDampingCdb: 800,
            traversableDefault: true
          }
        ],
        occluders: [
          {
            occluderId: 'occ_basin_grate',
            coord: { q: 0, r: 1, s: -1 },
            blocksLoSDefault: false,
            attenuationCdb: 400
          }
        ]
      };

      const cached = db.loadAndCacheManifest(fixtureManifest);
      bus.emit('TELEMETRY_LOG', {
        message: `:: Manifest Loaded: [${cached.merkleRootHex.slice(0, 16)}...] Topology: ${cached.topologyId}`
      });
      bus.emit('TELEMETRY_LOG', {
        message: `   + Topology [${cached.topologyId}] Cells: ${cached.cells.length} Portals: ${cached.portals.length}`
      });
    }
  };
}
