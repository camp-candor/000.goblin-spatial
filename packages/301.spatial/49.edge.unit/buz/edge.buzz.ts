import { PackedAxial } from '../../28.axial.unit/val/axial.model.js';
import { CentiDecibels } from '../../13.sound.unit/fce/sound.interface.js';
import { canonicalUndirectedEdgeKey, clampCentiDecibels } from '../../13.sound.unit/val/sound.model.js';
import { EdgeModel } from '../edge.model.js';
import EdgeBit from '../fce/edge.bit.js';
import State from '../../99.core/state.js';

export class PartitionDampingRegistry {
  private readonly dampingMap = new Map<string, CentiDecibels>();

  public setPartitionDamping(
    p1: PackedAxial,
    p2: PackedAxial,
    dampingCdb: CentiDecibels
  ): void {
    const key = canonicalUndirectedEdgeKey(p1, p2);
    this.dampingMap.set(key, dampingCdb);
  }

  public getPartitionDamping(
    p1: PackedAxial,
    p2: PackedAxial,
    overlayDeltas?: ReadonlyMap<string, number>
  ): CentiDecibels {
    const key = canonicalUndirectedEdgeKey(p1, p2);
    const base = this.dampingMap.get(key) ?? (0 as CentiDecibels);
    const delta = overlayDeltas?.get(key) ?? 0;
    return clampCentiDecibels(base + delta);
  }

  public clear(): void {
    this.dampingMap.clear();
  }
}

export const createPartitionRegistry = (): PartitionDampingRegistry =>
  new PartitionDampingRegistry();

export const initEdge = (cpy: EdgeModel, bal: EdgeBit, ste: State) => { return cpy; };
export const updateEdge = (cpy: EdgeModel, bal: EdgeBit, ste: State) => { return cpy; };
