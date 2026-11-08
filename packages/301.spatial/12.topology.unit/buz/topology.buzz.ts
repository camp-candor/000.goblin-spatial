import {
  TopologyManifest,
  TopologyManifestSchema,
  LocationNode,
  PortalEdge,
  TopologicalCell
} from '../../38.types.unit/fce/manifest.schema.js';

export interface TopologyValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly manifest?: TopologyManifest;
}

export function parseAndValidateManifest(raw: unknown): TopologyValidationResult {
  const parseResult = TopologyManifestSchema.safeParse(raw);
  if (!parseResult.success) {
    const issues = parseResult.error.issues.map(
      (iss) => `[SCHEMA_ERROR] ${iss.path.join('.')}: ${iss.message}`
    );
    return { valid: false, errors: issues };
  }

  const manifest = parseResult.data;
  const semanticErrors: string[] = [];
  const roomMap = new Map<string, LocationNode>();

  for (const room of manifest.rooms) {
    if (roomMap.has(room.roomId)) {
      semanticErrors.push(`[DUPLICATE_ROOM_ID] Room ID collision: ${room.roomId}`);
    }
    roomMap.set(room.roomId, room);

    // Validate cell uniqueness within room
    const cellCoords = new Set<string>();
    for (const cell of room.cells) {
      const key = `${cell.q},${cell.r}`;
      if (cellCoords.has(key)) {
        semanticErrors.push(`[DUPLICATE_CELL] Room ${room.roomId} has duplicate cell (${key})`);
      }
      cellCoords.add(key);
    }

    // Validate occluder coordinates exist in room
    for (const occluder of room.occluders) {
      const occluderKey = `${occluder.coord.q},${occluder.coord.r}`;
      if (!cellCoords.has(occluderKey)) {
        semanticErrors.push(
          `[ORPHAN_OCCLUDER] Occluder ${occluder.occluderId} references non-existent cell (${occluderKey}) in room ${room.roomId}`
        );
      }
    }
  }

  // Validate reciprocal portal links
  const portalRegistry = new Map<string, PortalEdge>();
  for (const room of manifest.rooms) {
    for (const portal of room.portals) {
      portalRegistry.set(portal.portalId, portal);

      if (!roomMap.has(portal.toRoomId)) {
        semanticErrors.push(
          `[DANGLING_PORTAL] Portal ${portal.portalId} targets unknown room ${portal.toRoomId}`
        );
        continue;
      }

      const targetRoom = roomMap.get(portal.toRoomId)!;
      const targetHasCell = targetRoom.cells.some(
        (c) => c.q === portal.toCoord.q && c.r === portal.toCoord.r
      );

      if (!targetHasCell) {
        semanticErrors.push(
          `[PORTAL_TARGET_INVALID] Portal ${portal.portalId} toCoord (${portal.toCoord.q},${portal.toCoord.r}) missing in target room ${targetRoom.roomId}`
        );
      }
    }
  }

  if (semanticErrors.length > 0) {
    return { valid: false, errors: semanticErrors };
  }

  return { valid: true, errors: [], manifest };
}

export function findRoomById(manifest: TopologyManifest, roomId: string): LocationNode | undefined {
  return manifest.rooms.find((r) => r.roomId === roomId);
}

export function findCellInRoom(
  room: LocationNode,
  q: number,
  r: number
): TopologicalCell | undefined {
  return room.cells.find((c) => c.q === q && c.r === r);
}



// Overriding previous dummy exports

export function initTopology(...args: any[]) {
    return { type: 'INIT_TOPOLOGY', payload: args };
}
export function updateTopology(...args: any[]) {
    return { type: 'UPDATE_TOPOLOGY', payload: args };
}
