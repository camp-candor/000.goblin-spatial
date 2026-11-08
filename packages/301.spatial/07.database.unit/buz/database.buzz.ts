import { TopologyManifest } from '../../38.types.unit/fce/manifest.schema.js';
import { parseAndValidateManifest } from '../../12.topology.unit/buz/topology.buzz.js';

function deepFreeze<T>(obj: T): Readonly<T> {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  Object.freeze(obj);
  for (const key of Object.getOwnPropertyNames(obj)) {
    const value = (obj as Record<string, unknown>)[key];
    if (value !== null && (typeof value === 'object' || typeof value === 'function')) {
      deepFreeze(value);
    }
  }
  return obj;
}

export class TopologyDatabase {
  private readonly store = new Map<string, Readonly<TopologyManifest>>();
  private activeRootHash: string | undefined;

  public loadAndCacheManifest(rawManifest: unknown): Readonly<TopologyManifest> {
    const validation = parseAndValidateManifest(rawManifest);
    if (!validation.valid || !validation.manifest) {
      throw new Error(`TOPOLOGY_VALIDATION_FAILED: ${validation.errors.join('; ')}`);
    }

    const frozen = deepFreeze(validation.manifest);
    this.store.set(frozen.rootHash, frozen);
    this.activeRootHash = frozen.rootHash;
    return frozen;
  }

  public getManifest(rootHash: string): Readonly<TopologyManifest> | undefined {
    return this.store.get(rootHash);
  }

  public getActiveManifest(): Readonly<TopologyManifest> | undefined {
    if (!this.activeRootHash) return undefined;
    return this.store.get(this.activeRootHash);
  }

  public clear(): void {
    this.store.clear();
    this.activeRootHash = undefined;
  }

  public size(): number {
    return this.store.size;
  }
}

export const createTopologyDatabase = (): TopologyDatabase => new TopologyDatabase();



// Overriding previous dummy exports

export function initDatabase(...args: any[]) {
    return { type: 'INIT_DATABASE', payload: args };
}
export function updateDatabase(...args: any[]) {
    return { type: 'UPDATE_DATABASE', payload: args };
}
