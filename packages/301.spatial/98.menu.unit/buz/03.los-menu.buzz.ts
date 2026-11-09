import { MenuActionPayload, SpatialBus } from '../fce/menu.interface.js'
import {
    AxialCoord,
    createAxialCoord,
    packAxial,
    PackedAxial,
} from '../../28.axial.unit/val/axial.model.js'
import { axialDistance } from '../../28.axial.unit/buz/axial.buzz.js'
import { traceFiniteSupercover } from '../../41.segment.unit/buz/segment.buzz.js'
import { evaluateRayVertexCrossings } from '../../17.observer.unit/buz/observer.buzz.js'
import { computeOpticalTransmission } from '../../40.witness.unit/buz/witness.buzz.js'
import { toBasisPoints } from '../../40.witness.unit/val/witness.model.js'

export interface AsciiLatticeScene {
    readonly origin: AxialCoord
    readonly target: AxialCoord
    readonly opaqueCells: ReadonlySet<PackedAxial>
    readonly traversedCells: readonly AxialCoord[]
}

/**
 * Renders the tactical hex lattice viewport (Radius 3) as pure 7-bit ASCII:
 * a 3-line viewport header, 7 lattice rows, and 1 legend line (11 lines).
 * Markers: [O] origin, [T] target, [*] ray, [X] hit, [#] wall, [.] open.
 */
export function renderAsciiHexLattice(scene: AsciiLatticeScene): string {
    const radius = 3
    const lines: string[] = [
        '+------------------------------------------------------+',
        '| TACTICAL HEX LATTICE VIEWPORT (Radius 3)             |',
        '+------------------------------------------------------+',
    ]

    const originPacked = packAxial(scene.origin.q, scene.origin.r)
    const targetPacked = packAxial(scene.target.q, scene.target.r)
    const traversedMap = new Map<PackedAxial, boolean>()
    for (let i = 0; i < scene.traversedCells.length; i++) {
        const c = scene.traversedCells[i]
        const p = packAxial(c.q, c.r)
        traversedMap.set(p, scene.opaqueCells.has(p))
    }

    for (let r = -radius; r <= radius; r++) {
        let rowStr = ''
        const indent = Math.abs(r) * 2
        for (let i = 0; i < indent; i++) rowStr += ' '

        for (let q = -radius; q <= radius; q++) {
            if (q + r >= -radius && q + r <= radius) {
                const pk = packAxial(q, r)
                let char = '.'
                if (pk === originPacked) {
                    char = 'O'
                } else if (pk === targetPacked) {
                    char = 'T'
                } else if (traversedMap.has(pk)) {
                    char = traversedMap.get(pk) ? 'X' : '*'
                } else if (scene.opaqueCells.has(pk)) {
                    char = '#'
                }
                rowStr += `[${char}] `
            }
        }
        lines.push(rowStr)
    }

    lines.push(
        '| LEGEND: [O] Origin  [T] Target  [*] Ray  [X] Hit  [#] Wall  [.] Open | Grid: TACTICAL ASCII HEX GRID (Radius 3) |',
    )
    return lines.join('\n')
}

export function createLoSVisualizerAction(): MenuActionPayload {
    return {
        id: 'LOS01_EVALUATE_VISUAL_RAYCAST',
        label: 'Evaluate Visual Raycast',
        shortcut: 'LOS01',
        category: 'SIMULATION',
        execute: async (bus: SpatialBus) => {
            const origin = createAxialCoord(0, -2)
            const target = createAxialCoord(0, 2)

            bus.emit('TELEMETRY_LOG', {
                message: `:: [LOS01] Trajectory Execution: Origin (0, -2) -> Target (0, 2)`,
            })

            const dist = axialDistance(origin, target)

            // Setup a mock wall at (0, 1) to intersect the ray
            const wallCell = createAxialCoord(0, 1)
            const wallPacked = packAxial(wallCell.q, wallCell.r)

            const isCellOpaque = (packed: PackedAxial) => {
                return packed === wallPacked
            }

            const getCellOpacity = (packed: PackedAxial) => {
                return packed === wallPacked
                    ? toBasisPoints(10000)
                    : toBasisPoints(0)
            }

            const trace = traceFiniteSupercover(origin, target)
            bus.emit('TELEMETRY_LOG', {
                message: `:: Traversed Cells: ${trace.traversedCells.length} | Axial Dist: ${dist}`,
            })

            const vertexCrossings = evaluateRayVertexCrossings(
                origin,
                target,
                isCellOpaque,
            )
            const status = vertexCrossings.hasClearLineOfSight
                ? 'CLEAR'
                : 'BLOCKED'
            bus.emit('TELEMETRY_LOG', {
                message: `:: Vertex Crossing Status: ${status}`,
            })

            const traversedAxial = trace.features.map((f) => f.cell)
            const transmission = computeOpticalTransmission(
                {
                    origin,
                    target,
                    traversedCells: traversedAxial,
                },
                getCellOpacity,
            )

            const opticalStatus =
                transmission.transmissionBps > 0n ? 'CLEAR' : 'OCCLUDED'
            bus.emit('TELEMETRY_LOG', {
                message: `:: Optical Transmission: ${transmission.transmissionBps} bp (${opticalStatus})`,
            })

            if (transmission.severedAtCell !== undefined) {
                bus.emit('TELEMETRY_LOG', {
                    message: `:: Occlusion Severed At Packed Cell: ${transmission.severedAtCell}`,
                })
            }

            const frame = renderAsciiHexLattice({
                origin,
                target,
                opaqueCells: new Set([wallPacked]),
                traversedCells: traversedAxial,
            })
            bus.emit('ASCII_FRAME_RENDER', { frame })
        },
    }
}
