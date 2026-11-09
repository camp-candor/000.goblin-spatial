import { PackedAxial } from '../../28.axial.unit/val/axial.model.js'

export class CellOccupancyTracker {
    private readonly counts = new Map<PackedAxial, number>()

    public getOccupancy(cell: PackedAxial): number {
        return this.counts.get(cell) ?? 0
    }

    public increment(cell: PackedAxial): number {
        const next = (this.counts.get(cell) ?? 0) + 1
        this.counts.set(cell, next)
        return next
    }

    public decrement(cell: PackedAxial): number {
        const current = this.counts.get(cell) ?? 0
        if (current <= 0) {
            throw new RangeError(
                `OCCUPANCY_UNDERFLOW: Attempted to decrement empty cell ${cell}`,
            )
        }
        const next = current - 1
        if (next === 0) {
            this.counts.delete(cell)
        } else {
            this.counts.set(cell, next)
        }
        return next
    }

    public setOccupancy(cell: PackedAxial, count: number): void {
        if (!Number.isInteger(count) || count < 0) {
            throw new TypeError(`INVALID_OCCUPANCY_VALUE: ${count}`)
        }
        if (count === 0) {
            this.counts.delete(cell)
        } else {
            this.counts.set(cell, count)
        }
    }

    public snapshot(): ReadonlyMap<PackedAxial, number> {
        return new Map(this.counts)
    }

    public clear(): void {
        this.counts.clear()
    }
}

export const createOccupancyTracker = (): CellOccupancyTracker =>
    new CellOccupancyTracker()

export const initOccupancy = (
    cpy: OccupancyModel,
    bal: OccupancyBit,
    ste: State,
) => {
    debugger
    return cpy
}

export const updateOccupancy = (
    cpy: OccupancyModel,
    bal: OccupancyBit,
    ste: State,
) => {
    return cpy
}

import { OccupancyModel } from '../occupancy.model'
import OccupancyBit from '../fce/occupancy.bit'
import State from '../../99.core/state'
