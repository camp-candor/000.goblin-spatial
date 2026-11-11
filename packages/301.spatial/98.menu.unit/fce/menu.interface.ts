import type { Model } from '../../99.core/interface/model.interface.js'

export type MenuMode = 'ROOT' | 'BOUNDARY_AUDIT' | 'TOPOLOGY_INSPECTION'

export interface MenuChoiceItem {
    readonly id: string
    readonly label: string
    readonly tooltip: string
}

export default interface Menu extends Model {
    idx: string
    activeMenuMode: MenuMode
    lastActionTimestamp: number
    totalInteractions: number
    statusMessage: string
    lastAuditSummary: string | null
}

export interface MenuActionPayload {
    readonly id: string
    readonly label: string
    readonly shortcut: string
    readonly category: 'DIAGNOSTIC' | 'LATTICE' | 'TOPOLOGY' | 'SIMULATION'
    readonly execute: (bus: SpatialBus) => Promise<void>
}

export interface MenuCatalogState {
    readonly activeIndex: number
    readonly activeCategory: string
    readonly actions: readonly MenuActionPayload[]
}

export interface SpatialBusEvent {
    readonly type: string
    readonly payload: Record<string, unknown>
    readonly timestamp: number
}

export type SpatialBusListener = (event: SpatialBusEvent) => void

export interface SpatialBus {
    emit(type: string, payload?: Record<string, unknown>): void
    subscribe(type: string, listener: SpatialBusListener): () => void
    clear(): void
    destroy(): void
}
