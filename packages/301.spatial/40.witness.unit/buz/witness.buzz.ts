import { packAxial, PackedAxial } from '../../28.axial.unit/val/axial.model.js'
import {
    BasisPoints,
    CellOpacitySample,
    OpticalTransmissionQuery,
    OpticalTransmissionReceipt,
} from '../fce/witness.interface.js'
import {
    MAX_BASIS_POINTS,
    toBasisPoints,
    clampBasisPoints,
    scaleBasisPointsRoundHalfEven,
} from '../val/witness.model.js'

export function computeOpticalTransmission(
    query: OpticalTransmissionQuery,
    getCellOpacity: (packedCoord: PackedAxial) => BasisPoints,
): OpticalTransmissionReceipt {
    const originPacked = packAxial(query.origin.q, query.origin.r)
    const targetPacked = packAxial(query.target.q, query.target.r)
    const mode = query.calculationMode || 'SUBTRACTIVE_LINEAR'
    const threshold = query.visibilityThresholdBps ?? 0

    if (query.traversedCells.length === 0) {
        return {
            originPacked,
            targetPacked,
            pathLength: 0,
            accumulatedOpacityBps: 0,
            transmissionBps: MAX_BASIS_POINTS,
            isVisible: MAX_BASIS_POINTS > threshold,
            samples: [],
        }
    }

    const samples: CellOpacitySample[] = []
    let totalOpacity = 0
    let transmittanceBps = MAX_BASIS_POINTS
    let severedAtCell: PackedAxial | undefined = undefined

    for (let i = 0; i < query.traversedCells.length; i++) {
        const coord = query.traversedCells[i]
        const packed = packAxial(coord.q, coord.r)
        const isEndpoint = packed === originPacked || packed === targetPacked

        // Endpoint Exemption: Endpoints count as completely transparent (0 bp opacity)
        const effectiveOpacity = isEndpoint
            ? toBasisPoints(0)
            : getCellOpacity(packed)

        samples.push({
            coord,
            packed,
            opacityBps: effectiveOpacity,
            isEndpoint,
        })

        if (isEndpoint) {
            continue
        }

        if (mode === 'SUBTRACTIVE_LINEAR') {
            totalOpacity += effectiveOpacity
            if (
                totalOpacity >= MAX_BASIS_POINTS &&
                severedAtCell === undefined
            ) {
                severedAtCell = packed
            }
        } else {
            // Multiplicative Beer-Lambert Formulation:
            // T_{k+1} = scaleBasisPoints(T_k, 10000 - opacity)
            const remainingTransparency = toBasisPoints(
                MAX_BASIS_POINTS - effectiveOpacity,
            )
            transmittanceBps = scaleBasisPointsRoundHalfEven(
                toBasisPoints(transmittanceBps),
                remainingTransparency,
            )
            if (transmittanceBps <= 0 && severedAtCell === undefined) {
                severedAtCell = packed
            }
        }
    }

    let finalTransmission: BasisPoints
    let finalAccumulatedOpacity: BasisPoints

    if (mode === 'SUBTRACTIVE_LINEAR') {
        finalAccumulatedOpacity = clampBasisPoints(totalOpacity)
        finalTransmission = clampBasisPoints(
            MAX_BASIS_POINTS - finalAccumulatedOpacity,
        )
    } else {
        finalTransmission = clampBasisPoints(transmittanceBps)
        finalAccumulatedOpacity = clampBasisPoints(
            MAX_BASIS_POINTS - finalTransmission,
        )
    }

    const isVisible = finalTransmission > threshold

    return {
        originPacked,
        targetPacked,
        pathLength: query.traversedCells.length,
        accumulatedOpacityBps: finalAccumulatedOpacity,
        transmissionBps: finalTransmission,
        isVisible,
        samples,
        severedAtCell,
    }
}
