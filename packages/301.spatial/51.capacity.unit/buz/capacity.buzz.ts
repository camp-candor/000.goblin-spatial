import { PackedAxial } from '../../28.axial.unit/val/axial.model.js'

export interface CellCapacitySpec {
    readonly cellCapacityDefault: number
    readonly overrides?: ReadonlyMap<PackedAxial, number>
}

export interface CapacityCheckReceipt {
    readonly cell: PackedAxial
    readonly currentOccupancy: number
    readonly maxCapacity: number
    readonly isOvercrowded: boolean
    readonly excessOccupants: number
}

export class CellCapacityEvaluator {
    private readonly defaultCapacity: number
    private readonly overrides: ReadonlyMap<PackedAxial, number>

    constructor(spec?: CellCapacitySpec) {
        this.defaultCapacity = spec?.cellCapacityDefault ?? 2 // Default 2 adult goblins per cell
        this.overrides = spec?.overrides ?? new Map<PackedAxial, number>()
    }

    public getCapacity(cell: PackedAxial): number {
        return this.overrides.get(cell) ?? this.defaultCapacity
    }

    public checkSaturation(
        cell: PackedAxial,
        currentOccupancy: number,
    ): CapacityCheckReceipt {
        if (!Number.isInteger(currentOccupancy) || currentOccupancy < 0) {
            throw new TypeError(`INVALID_OCCUPANCY_COUNT: ${currentOccupancy}`)
        }

        const maxCapacity = this.getCapacity(cell)
        const isOvercrowded = currentOccupancy > maxCapacity
        const excessOccupants = isOvercrowded
            ? currentOccupancy - maxCapacity
            : 0

        return {
            cell,
            currentOccupancy,
            maxCapacity,
            isOvercrowded,
            excessOccupants,
        }
    }
}

export const createCapacityEvaluator = (
    spec?: CellCapacitySpec,
): CellCapacityEvaluator => new CellCapacityEvaluator(spec)

export const initCapacity = (
    cpy: CapacityModel,
    bal: CapacityBit,
    ste: State,
) => {
    debugger
    return cpy
}

export const updateCapacity = (
    cpy: CapacityModel,
    bal: CapacityBit,
    ste: State,
) => {
    return cpy
}

import { CapacityModel } from '../capacity.model'
import CapacityBit from '../fce/capacity.bit'
import State from '../../99.core/state'
