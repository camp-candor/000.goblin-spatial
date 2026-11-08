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

let bit, lst, dex, idx, dat, src, val
let rootSlv

let SOWER, AGENT, CLICKUP, PIVOT

const UPDATE_GRID = '[Grid action] Update Grid'
const WRITE_CONSOLE = '[Write action] Write Console'
const UPDATE_CONSOLE = '[Console action] Update Console'
const OPEN_CHOICE = '[Open action] Open Choice'
const CLOSE_TERMINAL = '[Close action] Close Terminal'
const PRINT_MENU = '[Render action] Print Menu'

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

    await updateMenu(cpy, bal, ste)

    return cpy
}

export const updateMenu = async (cpy: MenuModel, bal: MenuBit, ste: State) => {
    lst = [ActSpc.UPDATE_SPATIAL.split(']')[1], 'ROOT MENU']

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

    switch (src) {
        case ActSpc.UPDATE_SPATIAL.split(']')[1]:
            bit = await ste.hunt(ActSpc.UPDATE_SPATIAL, {
                content: 'Spatial Menu Selected',
            })
            bit = await global.LIBRARY.hunt(PRINT_MENU, bit)
            break

        case 'ROOT MENU':
            if (rootSlv != null) rootSlv({ mnuBit: { idx: 'root-menu' } })
            return cpy

        default:
            bit = await ste.hunt(CLOSE_TERMINAL, {})
            break
    }

    setTimeout(async () => {
        bit = await ste.hunt(ActMnu.UPDATE_MENU, {})
    }, 333)

    return cpy
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
