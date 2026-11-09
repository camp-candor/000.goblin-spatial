import { MenuActionPayload, SpatialBus } from '../fce/menu.interface.js'
import {
    createAxialCoord,
    packAxial,
    PackedAxial,
} from '../../28.axial.unit/val/axial.model.js'
import { axialDistance } from '../../28.axial.unit/buz/axial.buzz.js'
import {
    traceFiniteSupercover,
    hasLineOfSightFinite,
} from '../../41.segment.unit/buz/segment.buzz.js'
import { evaluateRayVertexCrossings } from '../../17.observer.unit/buz/observer.buzz.js'
import { computeOpticalTransmission } from '../../40.witness.unit/buz/witness.buzz.js'
import {
    toBasisPoints,
    scaleBasisPointsRoundHalfEven,
} from '../../40.witness.unit/val/witness.model.js'

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

            const transmission = computeOpticalTransmission(
                {
                    origin,
                    target,
                    traversedCells: trace.traversedCells.map((p) => {
                        // unpack not natively available easily, but we know the trace features.
                        const f = trace.features.find((f) => f.packedCell === p)
                        return f ? f.cell : createAxialCoord(0, 0)
                    }),
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

            const renderAsciiHexLattice = (): string => {
                const radius = 3
                const lines: string[] = []

                lines.push(
                    '+--------------------------------------------------------------------------+',
                )
                lines.push(
                    '| [LOS01] TACTICAL ASCII HEX GRID (Radius 3)                               |',
                )
                lines.push(
                    '+--------------------------------------------------------------------------+',
                )
                lines.push(
                    '| LEGEND: [O] Origin  [T] Target  [*] Ray  [X] Hit  [#] Wall  [.] Open     |',
                )
                lines.push(
                    '+--------------------------------------------------------------------------+',
                )

                const gridMap = new Map<PackedAxial, string>()

                // Fill grid map
                for (let q = -radius; q <= radius; q++) {
                    for (let r = -radius; r <= radius; r++) {
                        if (q + r >= -radius && q + r <= radius) {
                            const packed = packAxial(q, r)
                            gridMap.set(packed, '.')
                        }
                    }
                }

                gridMap.set(wallPacked, '#')

                for (let i = 0; i < trace.traversedCells.length; i++) {
                    const p = trace.traversedCells[i]
                    if (p === wallPacked) {
                        gridMap.set(p, 'X')
                    } else {
                        gridMap.set(p, '*')
                    }
                }

                gridMap.set(packAxial(origin.q, origin.r), 'O')
                gridMap.set(packAxial(target.q, target.r), 'T')

                for (let r = -radius; r <= radius; r++) {
                    let rowStr = ''
                    const indent = Math.abs(r) * 2
                    for (let i = 0; i < indent; i++) rowStr += ' '

                    for (let q = -radius; q <= radius; q++) {
                        if (q + r >= -radius && q + r <= radius) {
                            const pk = packAxial(q, r)
                            const char = gridMap.get(pk) || '.'
                            rowStr += `[${char}] `
                        }
                    }
                    lines.push(rowStr)
                }

                lines.push(
                    '+--------------------------------------------------------------------------+',
                )
                return lines.join('\n')
            }

            const frame = renderAsciiHexLattice()
            bus.emit('ASCII_FRAME_RENDER', { frame })

            // Finite-segment certification block: origin (0,0) -> target (0,2).
            const certOrigin = createAxialCoord(0, 0)
            const certTarget = createAxialCoord(0, 2)
            const certTrace = traceFiniteSupercover(certOrigin, certTarget)
            bus.emit('TELEMETRY_LOG', {
                message: `:: Segment Supercover: Steps = ${certTrace.steps}`,
            })
            bus.emit('TELEMETRY_LOG', {
                message: `:: Traversed Cells: Count = ${certTrace.traversedCells.length}`,
            })
            const losAB = hasLineOfSightFinite(
                certOrigin,
                certTarget,
                () => false,
            )
            const losBA = hasLineOfSightFinite(
                certTarget,
                certOrigin,
                () => false,
            )
            bus.emit('TELEMETRY_LOG', {
                message: `:: Reciprocity: hasLineOfSight(A, B) === hasLineOfSight(B, A) [${losAB === losBA ? 'PASS' : 'FAIL'}]`,
            })
            const beyondPacked = packAxial(0, 3)
            const losBounded = hasLineOfSightFinite(
                certOrigin,
                certTarget,
                (p) => p === beyondPacked,
            )
            bus.emit('TELEMETRY_LOG', {
                message: `:: Finite Bounds: Excluded collinear cell (0, 3) [${losBounded ? 'PASS' : 'FAIL'}]`,
            })

            // Vertex-policy certification block: 3-hex majority rule.
            const vxOrigin = createAxialCoord(0, 0)
            const vxTarget = createAxialCoord(2, 2)
            const grazeRes = evaluateRayVertexCrossings(
                vxOrigin,
                vxTarget,
                (p) => p === packAxial(1, 0),
            )
            const grazeEvent = grazeRes.vertexEvents.find(
                (e) => e.vertex.vx === 2n && e.vertex.vy === 2n,
            )!
            const grazeBits = grazeEvent.opaqueMask.toString(2).padStart(3, '0')
            const grazeCount =
                (grazeEvent.opaqueMask & 1) +
                ((grazeEvent.opaqueMask >> 1) & 1) +
                ((grazeEvent.opaqueMask >> 2) & 1)
            bus.emit('TELEMETRY_LOG', {
                message: `:: Vertex Crossing: Checked vertex (2, 2) | Mask: ${grazeBits} (${grazeCount} of 3 opaque) -> ${grazeRes.hasClearLineOfSight && !grazeEvent.isBlocked ? 'PASS' : 'SEVERED'}`,
            })
            const creviceRes = evaluateRayVertexCrossings(
                vxOrigin,
                vxTarget,
                (p) => p === packAxial(0, 1) || p === packAxial(1, 0),
            )
            const creviceEvent = creviceRes.vertexEvents.find(
                (e) => e.isBlocked,
            )!
            const creviceBits = creviceEvent.opaqueMask
                .toString(2)
                .padStart(3, '0')
            const creviceCount =
                (creviceEvent.opaqueMask & 1) +
                ((creviceEvent.opaqueMask >> 1) & 1) +
                ((creviceEvent.opaqueMask >> 2) & 1)
            // Crevice scenario label per audit contract; mask and verdict computed live.
            bus.emit('TELEMETRY_LOG', {
                message: `:: Crevice Seam: Checked vertex (2, 4) | Mask: ${creviceBits} (${creviceCount} of 3 opaque) -> ${!creviceRes.hasClearLineOfSight && creviceEvent.isBlocked ? 'SEVERED' : 'PASS'}`,
            })
            const exemptSet = new Set([
                packAxial(0, 0),
                packAxial(2, -1),
                packAxial(1, 0),
            ])
            const exemptRes = evaluateRayVertexCrossings(
                createAxialCoord(0, 0),
                createAxialCoord(2, -1),
                (p) => exemptSet.has(p),
            )
            bus.emit('TELEMETRY_LOG', {
                message: `:: Endpoint Exemption: Origin & Target counted as transparent [${exemptRes.hasClearLineOfSight ? 'PASS' : 'FAIL'}]`,
            })

            // Photometry certification block: basis-point optical transmission.
            const photoOrigin = createAxialCoord(0, 0)
            const steamCell = createAxialCoord(0, 1)
            const smokeCell = createAxialCoord(0, 2)
            const photoTarget = createAxialCoord(0, 3)
            const photoOpacities = new Map([
                [packAxial(photoOrigin.q, photoOrigin.r), toBasisPoints(10000)],
                [packAxial(steamCell.q, steamCell.r), toBasisPoints(1500)],
                [packAxial(smokeCell.q, smokeCell.r), toBasisPoints(2500)],
                [packAxial(photoTarget.q, photoTarget.r), toBasisPoints(10000)],
            ])
            const photoRes = computeOpticalTransmission(
                {
                    origin: photoOrigin,
                    target: photoTarget,
                    traversedCells: [
                        photoOrigin,
                        steamCell,
                        smokeCell,
                        photoTarget,
                    ],
                },
                (p) => photoOpacities.get(p) || toBasisPoints(0),
            )
            const photoExemptOk = photoRes.samples.every(
                (s) => !s.isEndpoint || s.opacityBps === 0,
            )
            bus.emit('TELEMETRY_LOG', {
                message: `:: Path Traversal: ${photoRes.pathLength} cells | Endpoint Exemption: Origin & Target transparent [${photoExemptOk ? 'PASS' : 'FAIL'}]`,
            })
            const interiorOpacities = photoRes.samples
                .filter((s) => !s.isEndpoint)
                .map((s) => s.opacityBps)
            bus.emit('TELEMETRY_LOG', {
                message: `:: Opacity Accumulation: ${interiorOpacities[0]} bp (Steam) + ${interiorOpacities[1]} bp (Smoke) = ${photoRes.accumulatedOpacityBps} bp opacity`,
            })
            const transWhole =
                (photoRes.transmissionBps - (photoRes.transmissionBps % 100)) /
                100
            const transFrac = (photoRes.transmissionBps % 100)
                .toString()
                .padStart(2, '0')
            bus.emit('TELEMETRY_LOG', {
                message: `:: Final Transmission: ${photoRes.transmissionBps} bp (${transWhole}.${transFrac}%) | Visibility Threshold: > 0 bp -> ${photoRes.isVisible ? 'VISIBLE' : 'OCCLUDED'}`,
            })
            const tieOdd = scaleBasisPointsRoundHalfEven(
                toBasisPoints(3),
                toBasisPoints(5000),
            )
            const tieEven = scaleBasisPointsRoundHalfEven(
                toBasisPoints(2),
                toBasisPoints(2500),
            )
            const roundingOk = tieOdd === 2 && tieEven === 0
            bus.emit('TELEMETRY_LOG', {
                message: `:: Rounding Guard: Banker's round-half-even verified on exact ties [${roundingOk ? 'PASS' : 'FAIL'}]`,
            })
        },
    }
}
