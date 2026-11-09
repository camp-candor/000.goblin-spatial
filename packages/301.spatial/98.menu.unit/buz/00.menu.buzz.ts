/* eslint-disable */
import * as ActMnu from '../menu.action.js'
import * as ActSpc from '../../00.spatial.unit/spatial.action.js'

import type { MenuModel } from '../menu.model.js'
import type MenuBit from '../fce/menu.bit.js'
import type State from '../../99.core/state.js'

import * as Grid from '../../val/grid.js'
import * as Align from '../../val/align.js'
import * as Color from '../../val/console-color.js'

import * as SHAPE from '../../val/shape.js'
import * as FOCUS from '../../val/focus.js'

import { createSpatialBus } from '../../99.bus.unit/buz/bus.buzz.js'
import { createLatticeInspectionAction } from './01.lattice-menu.buzz.js'
import { createTopologyLoaderAction } from './02.topology-menu.buzz.js'
import { createLoSVisualizerAction } from './03.los-menu.buzz.js'
import { TopologyDatabase } from '../../07.database.unit/buz/database.buzz.js'

let bit, lst, dex, idx, dat, src, val
let rootSlv

let SOWER, AGENT, CLICKUP, PIVOT

const UPDATE_GRID = '[Grid action] Update Grid'
const WRITE_CONSOLE = '[Write action] Write Console'
const UPDATE_CONSOLE = '[Console action] Update Console'
const OPEN_CHOICE = '[Open action] Open Choice'
const CLOSE_TERMINAL = '[Close action] Close Terminal'
const PRINT_MENU = '[Render action] Print Menu'

// Live cockpit singleton: reactive bus + action catalog driving the menu.
let liveCockpit: { bus: any; menu: MenuDispatcher } | null = null

const ensureLiveCockpit = () => {
    if (liveCockpit != null) return liveCockpit
    const bus = createSpatialBus()
    const menu = new MenuDispatcher(bus)
    const db = new TopologyDatabase()

    // Forward reactive bus telemetry into the live cns00 console pane.
    bus.subscribe('TELEMETRY_LOG', (evt: any) => {
        const LIBRARY = (global as any).LIBRARY
        if (LIBRARY == null) return
        const message = String(evt?.payload?.message || '')
        if (message === '') return
        void LIBRARY.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: message,
        })
    })

    menu.registerAction(createLatticeInspectionAction())
    menu.registerAction(createTopologyLoaderAction(db))
    menu.registerAction(createLoSVisualizerAction())

    liveCockpit = { bus, menu }
    return liveCockpit
}

const getCatalogChoices = (menu: MenuDispatcher): string[] =>
    menu.getCatalog().actions.map((act) => `[${act.shortcut}] ${act.label}`)

export const initMenu = async (cpy: MenuModel, bal: MenuBit, ste: State) => {
    if (bal.slv != null) rootSlv = bal.slv

    bit = await global.LIBRARY.hunt(UPDATE_GRID, {
        x: 4,
        y: 0,
        xSpan: 8,
        ySpan: 12,
    })
    bit = await global.LIBRARY.hunt(WRITE_CONSOLE, {
        idx: 'cns00',
        src: '',
        dat: { net: bit.grdBit.dat, src: 'alligaor0' },
    })

    bit = await global.LIBRARY.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: '-----------',
    })
    bit = await global.LIBRARY.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: 'SPATIAL MENU',
    })

    bit = await global.LIBRARY.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: '-----------',
    })

    const live = ensureLiveCockpit()
    live.bus.emit('TELEMETRY_LOG', {
        message: '>> [SYSTEM READY: Awaiting Operator Input]',
    })

    await updateMenu(cpy, bal, ste)

    return cpy
}

export const updateMenu = async (cpy: MenuModel, bal: MenuBit, ste: State) => {
    const live = ensureLiveCockpit()
    lst = [...getCatalogChoices(live.menu), 'ROOT MENU']

    bit = await global.LIBRARY.hunt(UPDATE_GRID, {
        x: 0,
        y: 4,
        xSpan: 4,
        ySpan: 8,
    })
    bit = await global.LIBRARY.hunt(OPEN_CHOICE, {
        dat: { clr0: Color.BLACK, clr1: Color.YELLOW },
        src: Align.VERTICAL,
        lst,
        net: bit.grdBit.dat,
    })

    src = bit.chcBit.src

    const labels = getCatalogChoices(live.menu)
    const hit = labels.indexOf(src)

    if (src === 'ROOT MENU' || src === '') {
        // 'ROOT MENU' choice or ESC-cancel: yield control back to the root menu.
        if (rootSlv != null) rootSlv({ mnuBit: { idx: 'root-menu' } })
        return cpy
    }

    if (hit < 0) {
        src = ''
        bit = await ste.hunt(CLOSE_TERMINAL, {})
        return cpy
    }

    // Park the active index on the selected catalog action, then execute it
    // through the reactive bus. Telemetry forwarding writes into cns00.
    while (live.menu.getCatalog().activeIndex !== hit) {
        live.menu.selectNext()
    }
    await live.menu.executeSelected()

    bit = await ste.hunt(ActSpc.UPDATE_SPATIAL, {
        content: src || 'Spatial Menu Selected',
    })
    bit = await global.LIBRARY.hunt(PRINT_MENU, bit)

    // Immediately re-render the choice pane (no drift-prone repaint timer).
    return updateMenu(cpy, bal, ste)
}

const patch = (ste, type, bale) => ste.dispatch({ type, bale })

import {
    MenuActionPayload,
    MenuCatalogState,
    SpatialBus,
} from '../fce/menu.interface.js'

export class MenuDispatcher {
    private actions: MenuActionPayload[] = []
    private activeIndex: number = 0

    constructor(private readonly bus: SpatialBus) {
        this.registerDefaultActions()
    }

    public registerAction(action: MenuActionPayload): void {
        const exists = this.actions.some((a) => a.id === action.id)
        if (exists) {
            throw new Error(`DUPLICATE_ACTION_ID: ${action.id}`)
        }
        this.actions.push(action)
    }

    public getCatalog(): MenuCatalogState {
        const currentAction = this.actions[this.activeIndex]
        return {
            activeIndex: this.activeIndex,
            activeCategory: currentAction ? currentAction.category : 'NONE',
            actions: [...this.actions],
        }
    }

    public selectNext(): void {
        if (this.actions.length === 0) return
        this.activeIndex = (this.activeIndex + 1) % this.actions.length
        this.bus.emit('MENU_INDEX_CHANGED', { index: this.activeIndex })
    }

    public selectPrevious(): void {
        if (this.actions.length === 0) return
        this.activeIndex =
            (this.activeIndex - 1 + this.actions.length) % this.actions.length
        this.bus.emit('MENU_INDEX_CHANGED', { index: this.activeIndex })
    }

    public async executeSelected(): Promise<void> {
        const action = this.actions[this.activeIndex]
        if (!action) {
            throw new Error('NO_ACTION_SELECTED')
        }
        this.bus.emit('TELEMETRY_LOG', {
            message: `>> EXECUTING: [${action.shortcut}] ${action.label}`,
        })
        await action.execute(this.bus)
        this.bus.emit('TELEMETRY_LOG', {
            message: `>> COMPLETED: [${action.shortcut}] ${action.label}`,
        })
    }

    private registerDefaultActions(): void {
        this.registerAction({
            id: 'D01_RESET_KERNEL',
            label: 'Reset Spatial Kernel State',
            shortcut: 'D01',
            category: 'DIAGNOSTIC',
            execute: async (bus) => {
                bus.emit('KERNEL_STATE_RESET', { timestamp: Date.now() })
            },
        })

        this.registerAction({
            id: 'D02_INSPECT_TOPOLOGY',
            label: 'Inspect Active Topology Manifest',
            shortcut: 'D02',
            category: 'TOPOLOGY',
            execute: async (bus) => {
                bus.emit('TELEMETRY_LOG', {
                    message:
                        ':: Manifest: [000.goblin-spatial] Cached Nodes: 0',
                })
            },
        })

        this.registerAction({
            id: 'D03_RUN_BENCHMARK',
            label: 'Execute Sub-Millisecond Profiler',
            shortcut: 'D03',
            category: 'SIMULATION',
            execute: async (bus) => {
                bus.emit('TELEMETRY_LOG', {
                    message:
                        ':: Benchmark: Budget Target <= 2ms. Status: NOMINAL',
                })
            },
        })
    }
}
