import {
  AxialCoord,
  PackedAxial,
  packAxial,
  unpackAxial
} from '../../28.axial.unit/val/axial.model.js';
import { axialDistance } from '../../28.axial.unit/buz/axial.buzz.js';
import { AXIAL_DIRECTIONS } from '../../46.neighbor.unit/buz/neighbor.buzz.js';
import { DynamicOverlay } from '../../38.types.unit/fce/manifest.schema.js';
import { compareTieBreakNodes, TieBreakNode } from '../../25.distance.unit/buz/distance.buzz.js';

export interface PathQueryOptions {
  readonly origin: AxialCoord;
  readonly destination: AxialCoord;
  readonly maxBudgetCostUnits: number;
  readonly overlay?: DynamicOverlay;
  readonly blockedCells?: ReadonlySet<PackedAxial>;
  readonly workEnvelopeLimit?: number;
  readonly episodeSeed?: number;
}

export type PathQueryResult =
  | {
      readonly ok: true;
      readonly originPacked: PackedAxial;
      readonly destinationPacked: PackedAxial;
      readonly path: readonly AxialCoord[];
      readonly pathPacked: readonly PackedAxial[];
      readonly totalCostUnits: number;
      readonly expandedSteps: number;
    }
  | {
      readonly ok: false;
      readonly reason: 'UNREACHABLE' | 'BUDGET_EXCEEDED' | 'IMPASSABLE';
      readonly expandedSteps: number;
    };

export function findShortestBoundedPath(query: PathQueryOptions): PathQueryResult {
  const envelopeLimit = query.workEnvelopeLimit ?? 512;
  const originPacked = packAxial(query.origin.q, query.origin.r);
  const destPacked = packAxial(query.destination.q, query.destination.r);
  const blocked = query.blockedCells ?? new Set<PackedAxial>();

  if (blocked.has(originPacked) || blocked.has(destPacked)) {
    return { ok: false, reason: 'IMPASSABLE', expandedSteps: 0 };
  }

  if (originPacked === destPacked) {
    return {
      ok: true,
      originPacked,
      destinationPacked: destPacked,
      path: [query.origin],
      pathPacked: [originPacked],
      totalCostUnits: 0,
      expandedSteps: 0
    };
  }

  const gScore = new Map<PackedAxial, number>();
  const parent = new Map<PackedAxial, PackedAxial>();
  const queue: TieBreakNode[] = [];

  gScore.set(originPacked, 0);
  const initialH = axialDistance(query.origin, query.destination) * 100;
  queue.push({
    cell: originPacked,
    fScore: initialH,
    gScore: 0,
    hScore: initialH,
    seedDigest: (query.episodeSeed ?? 0) ^ originPacked
  });

  let steps = 0;

  while (queue.length > 0) {
    steps++;
    if (steps > envelopeLimit) {
      return { ok: false, reason: 'BUDGET_EXCEEDED', expandedSteps: steps };
    }

    queue.sort((a, b) => compareTieBreakNodes(a, b, query.destination));
    const current = queue.shift()!;

    if (current.cell === destPacked) {
      const pathPacked: PackedAxial[] = [];
      let curr: PackedAxial | undefined = destPacked;
      while (curr !== undefined) {
        pathPacked.unshift(curr);
        curr = parent.get(curr);
      }

      const pathCoords = pathPacked.map((p) => unpackAxial(p));
      return {
        ok: true,
        originPacked,
        destinationPacked: destPacked,
        path: pathCoords,
        pathPacked,
        totalCostUnits: current.gScore,
        expandedSteps: steps
      };
    }

    const currentCoord = unpackAxial(current.cell);

    for (let i = 0; i < 6; i++) {
      const dir = AXIAL_DIRECTIONS[i];
      const neighborQ = currentCoord.q + dir.q;
      const neighborR = currentCoord.r + dir.r;
      const neighborPacked = packAxial(neighborQ, neighborR);

      if (blocked.has(neighborPacked)) {
        continue;
      }

      const stepCost = 100;
      const tentativeG = current.gScore + stepCost;

      if (tentativeG > query.maxBudgetCostUnits) {
        continue;
      }

      const prevG = gScore.get(neighborPacked);
      if (prevG === undefined || tentativeG < prevG) {
        gScore.set(neighborPacked, tentativeG);
        parent.set(neighborPacked, current.cell);

        const neighborCoord = unpackAxial(neighborPacked);
        const h = axialDistance(neighborCoord, query.destination) * 100;
        queue.push({
          cell: neighborPacked,
          fScore: tentativeG + h,
          gScore: tentativeG,
          hScore: h,
          seedDigest: (query.episodeSeed ?? 0) ^ neighborPacked
        });
      }
    }
  }

  return { ok: false, reason: 'UNREACHABLE', expandedSteps: steps };
}

export const initPath = (cpy: PathModel, bal: PathBit, ste: State) => {
    debugger
    return cpy
}

export const updatePath = (cpy: PathModel, bal: PathBit, ste: State) => {
    return cpy
}

import { PathModel } from '../path.model'
import PathBit from '../fce/path.bit'
import State from '../../99.core/state'
