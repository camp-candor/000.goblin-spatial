import { MenuActionPayload, SpatialBus } from '../fce/menu.interface.js';
import { createAxialCoord, packAxial, PackedAxial } from '../../28.axial.unit/val/axial.model.js';
import { axialDistance } from '../../28.axial.unit/buz/axial.buzz.js';
import { traceFiniteSupercover } from '../../41.segment.unit/buz/segment.buzz.js';
import { evaluateRayVertexCrossings } from '../../17.observer.unit/buz/observer.buzz.js';
import { computeOpticalTransmission } from '../../40.witness.unit/buz/witness.buzz.js';
import { toBasisPoints } from '../../40.witness.unit/val/witness.model.js';

export function createLoSVisualizerAction(): MenuActionPayload {
  return {
    id: 'LOS01_EVALUATE_VISUAL_RAYCAST',
    label: 'Evaluate Visual Raycast',
    shortcut: 'LOS01',
    category: 'SIMULATION',
    execute: async (bus: SpatialBus) => {
      const origin = createAxialCoord(0, -2);
      const target = createAxialCoord(0, 2);

      bus.emit('TELEMETRY_LOG', {
        message: `:: [LOS01] Trajectory Execution: Origin (0, -2) -> Target (0, 2)`
      });

      const dist = axialDistance(origin, target);

      // Setup a mock wall at (0, 1) to intersect the ray
      const wallCell = createAxialCoord(0, 1);
      const wallPacked = packAxial(wallCell.q, wallCell.r);

      const isCellOpaque = (packed: PackedAxial) => {
        return packed === wallPacked;
      };

      const getCellOpacity = (packed: PackedAxial) => {
        return packed === wallPacked ? toBasisPoints(10000) : toBasisPoints(0);
      };

      const trace = traceFiniteSupercover(origin, target);
      bus.emit('TELEMETRY_LOG', {
        message: `:: Traversed Cells: ${trace.traversedCells.length} | Axial Dist: ${dist}`
      });

      const vertexCrossings = evaluateRayVertexCrossings(origin, target, isCellOpaque);
      const status = vertexCrossings.hasClearLineOfSight ? 'CLEAR' : 'BLOCKED';
      bus.emit('TELEMETRY_LOG', {
        message: `:: Vertex Crossing Status: ${status}`
      });

      const transmission = computeOpticalTransmission(
        {
          origin,
          target,
          traversedCells: trace.traversedCells.map(p => {
             // unpack not natively available easily, but we know the trace features.
             const f = trace.features.find(f => f.packedCell === p);
             return f ? f.cell : createAxialCoord(0,0);
          })
        },
        getCellOpacity
      );

      const opticalStatus = transmission.transmissionBps > 0n ? 'CLEAR' : 'OCCLUDED';
      bus.emit('TELEMETRY_LOG', {
        message: `:: Optical Transmission: ${transmission.transmissionBps} bp (${opticalStatus})`
      });

      if (transmission.severedAtCell !== undefined) {
        bus.emit('TELEMETRY_LOG', {
          message: `:: Occlusion Severed At Packed Cell: ${transmission.severedAtCell}`
        });
      }

      const renderAsciiHexLattice = (): string => {
        const radius = 3;
        const lines: string[] = [];

        lines.push('+--------------------------------------------------------------------------+');
        lines.push('| [LOS01] TACTICAL ASCII HEX GRID (Radius 3)                               |');
        lines.push('+--------------------------------------------------------------------------+');
        lines.push('| LEGEND: [O] Origin  [T] Target  [*] Ray  [X] Hit  [#] Wall  [.] Open     |');
        lines.push('+--------------------------------------------------------------------------+');

        const gridMap = new Map<PackedAxial, string>();

        // Fill grid map
        for (let q = -radius; q <= radius; q++) {
          for (let r = -radius; r <= radius; r++) {
            if (q + r >= -radius && q + r <= radius) {
               const packed = packAxial(q, r);
               gridMap.set(packed, '.');
            }
          }
        }

        gridMap.set(wallPacked, '#');

        for (let i = 0; i < trace.traversedCells.length; i++) {
           const p = trace.traversedCells[i];
           if (p === wallPacked) {
              gridMap.set(p, 'X');
           } else {
              gridMap.set(p, '*');
           }
        }

        gridMap.set(packAxial(origin.q, origin.r), 'O');
        gridMap.set(packAxial(target.q, target.r), 'T');

        for (let r = -radius; r <= radius; r++) {
          let rowStr = '';
          const indent = Math.abs(r) * 2;
          for (let i = 0; i < indent; i++) rowStr += ' ';

          for (let q = -radius; q <= radius; q++) {
             if (q + r >= -radius && q + r <= radius) {
                const pk = packAxial(q, r);
                const char = gridMap.get(pk) || '.';
                rowStr += `[${char}] `;
             }
          }
          lines.push(rowStr);
        }

        lines.push('+--------------------------------------------------------------------------+');
        return lines.join('\n');
      };

      const frame = renderAsciiHexLattice();
      bus.emit('ASCII_FRAME_RENDER', { frame });
    }
  };
}
