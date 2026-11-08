import { MenuActionPayload, SpatialBus } from '../fce/menu.interface.js';
import { createAxialCoord, packAxial, PackedAxial, AxialCoord } from '../../28.axial.unit/val/axial.model.js';
import { axialDistance } from '../../28.axial.unit/buz/axial.buzz.js';
import { traceFiniteSupercover } from '../../41.segment.unit/buz/segment.buzz.js';
import { evaluateRayVertexCrossings } from '../../17.observer.unit/buz/observer.buzz.js';
import { computeOpticalTransmission } from '../../40.witness.unit/buz/witness.buzz.js';
import { toBasisPoints } from '../../40.witness.unit/val/witness.model.js';

function renderAsciiHexLattice(origin: AxialCoord, target: AxialCoord, isCellOpaque: (p: PackedAxial) => boolean): string {
    const radius = 3;
    const originPacked = packAxial(origin.q, origin.r);
    const targetPacked = packAxial(target.q, target.r);
    const trace = traceFiniteSupercover(origin, target);

    const traceSet = new Set<PackedAxial>();
    for (const p of trace.traversedCells) {
        traceSet.add(p);
    }
    const hitSet = new Set<PackedAxial>();
    for (const f of trace.features) {
        if (f.packedCell !== originPacked && f.packedCell !== targetPacked && isCellOpaque(f.packedCell)) {
            hitSet.add(f.packedCell);
            break;
        }
    }
    const lines: string[] = [];
    lines.push('+--------------------------------------------------------------------------+');
    lines.push('| LOS TACTICAL HEX LATTICE [RADIUS 3]                                      |');
    lines.push('+--------------------------------------------------------------------------+');

    // We render from r = -3 to r = 3
    for (let r = -radius; r <= radius; r++) {
        let line = '';
        // Indent for staggered grid appearance based on r
        const indent = Math.abs(r);
        line += ' '.repeat(indent * 2); // 2 spaces per indent

        // q ranges based on radius and r
        const q1 = Math.max(-radius, -r - radius);
        const q2 = Math.min(radius, -r + radius);

        for (let q = q1; q <= q2; q++) {
            const packed = packAxial(q, r);
            let marker = '.';
            if (packed === originPacked) marker = 'O';
            else if (packed === targetPacked) marker = 'T';
            else if (hitSet.has(packed)) marker = 'X';
            else if (isCellOpaque(packed)) marker = '#';
            else if (traceSet.has(packed)) marker = '*';

            line += `[${marker}] `;
        }
        lines.push('  ' + line);
    }

    lines.push('+--------------------------------------------------------------------------+');
    lines.push('| LEGEND: [O] Origin  [T] Target  [*] Ray  [X] Hit  [#] Wall  [.] Open     |');
    lines.push('+--------------------------------------------------------------------------+');

    return lines.join('\n');
}

export function createLoSVisualizerAction(): MenuActionPayload {
    return {
        id: 'LOS01',
        label: 'Evaluate Visual Raycast',
        shortcut: 'LOS01',
        category: 'SIMULATION',
        execute: async (bus: SpatialBus) => {
            const origin = createAxialCoord(0, -2);
            const target = createAxialCoord(0, 2);

            bus.emit('TELEMETRY_LOG', {
                message: `:: [LOS01] Trajectory Execution: Origin (0, -2) -> Target (0, 2)`
            });

            const isCellOpaque = (packed: PackedAxial): boolean => {
                const wallPacked = packAxial(0, 1);
                return packed === wallPacked;
            };

            const getCellOpacity = (packed: PackedAxial) => {
                return isCellOpaque(packed) ? toBasisPoints(10000) : toBasisPoints(0);
            };

            const trace = traceFiniteSupercover(origin, target);
            const dist = axialDistance(origin, target);

            bus.emit('TELEMETRY_LOG', {
                message: `:: Traversed Cells: ${trace.traversedCells.length} | Axial Dist: ${dist}`
            });

            const vertexCrossings = evaluateRayVertexCrossings(origin, target, isCellOpaque);
            const status = vertexCrossings.hasClearLineOfSight ? 'CLEAR' : 'GRAZING';
            bus.emit('TELEMETRY_LOG', {
                message: `:: Vertex Crossing Status: ${status}`
            });

            const transmission = computeOpticalTransmission({
                origin,
                target,
                traversedCells: trace.traversedCells.map(packed => {
                    // Quick unpack logic since unpackAxial is not imported here, but we can compute it if needed
                    // Actually, we can import unpackAxial
                    const qOffset = ((packed >>> 16) & 0xFFFF);
                    const rOffset = (packed & 0xFFFF);
                    const COORD_OFFSET = 32768;
                    const q = qOffset - COORD_OFFSET;
                    const r = rOffset - COORD_OFFSET;
                    return createAxialCoord(q, r);
                }),
                calculationMode: 'SUBTRACTIVE_LINEAR'
            }, getCellOpacity);

            const transmissionMsg = transmission.isVisible
                ? `Optical Transmission: ${transmission.transmissionBps} bp (CLEAR)`
                : `Optical Transmission: ${transmission.transmissionBps} bp (OCCLUDED)`;

            bus.emit('TELEMETRY_LOG', {
                message: `:: ${transmissionMsg}`
            });

            if (transmission.severedAtCell !== undefined) {
                bus.emit('TELEMETRY_LOG', {
                    message: `:: Occlusion Severed At Packed Cell: ${transmission.severedAtCell}`
                });
            }

            const frame = renderAsciiHexLattice(origin, target, isCellOpaque);
            bus.emit('ASCII_FRAME_RENDER', { frame });
        }
    };
}
