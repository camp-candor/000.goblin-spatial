import { createSpatialBus } from '../99.bus.unit/buz/bus.buzz.js'
import { MenuDispatcher } from '../98.menu.unit/buz/00.menu.buzz.js'
import { createLatticeInspectionAction } from '../98.menu.unit/buz/01.lattice-menu.buzz.js'
import { createTopologyLoaderAction } from '../98.menu.unit/buz/02.topology-menu.buzz.js'
import { createLoSVisualizerAction } from '../98.menu.unit/buz/03.los-menu.buzz.js'
import { TopologyDatabase } from '../07.database.unit/buz/database.buzz.js'

export interface CockpitInstance {
    readonly bus: ReturnType<typeof createSpatialBus>
    readonly menu: MenuDispatcher
    readonly renderTelemetryFrame: () => string
    destroy(): void
}

export function initializeCockpitHarness(): CockpitInstance {
    const bus = createSpatialBus()
    const menu = new MenuDispatcher(bus)
    const logs: string[] = []
    let currentAsciiFrame: string | null = null
    const db = new TopologyDatabase()

    menu.registerAction(createLatticeInspectionAction())
    menu.registerAction(createTopologyLoaderAction(db))
    menu.registerAction(createLoSVisualizerAction())

    const unsubscribeLog = bus.subscribe('TELEMETRY_LOG', (evt) => {
        const msg = String(evt.payload.message || '')
        logs.push(msg)
        if (logs.length > 100) {
            logs.shift()
        }
    })

    const unsubscribeFrame = bus.subscribe('ASCII_FRAME_RENDER', (evt) => {
        currentAsciiFrame = String(evt.payload.frame || '')
    })

    const renderTelemetryFrame = (): string => {
        const catalog = menu.getCatalog()
        const actionLines = catalog.actions
            .map((act, i) => {
                const marker = i === catalog.activeIndex ? '>' : ' '
                return `  ${marker} [${act.shortcut}] ${act.label} (${act.category})`
            })
            .join('\n')

        // Window covers the full LOS01 stream: base telemetry plus the
        // segment, vertex-policy, and photometry blocks after the ASCII frame.
        const recentLogs =
            logs.slice(-18).join('\n') ||
            '  >> [SYSTEM READY: Awaiting Operator Input]'

        return [
            '+--------------------------------------------------------------------------+',
            '| 000.goblin-spatial :: BLESSED TERMINAL COCKPIT (Phase 1)                |',
            '+--------------------------------------------------------------------------+',
            '| MENU CONTROLS (Columns 0-4, Rows 0-12)                                   |',
            actionLines,
            '+--------------------------------------------------------------------------+',
            currentAsciiFrame ? currentAsciiFrame : '',
            '| TELEMETRY LOG [cns00] (Columns 4-12, Rows 3-12)                          |',
            recentLogs,
            '+--------------------------------------------------------------------------+',
        ]
            .filter((l) => l !== '')
            .join('\n')
    }

    return {
        bus,
        menu,
        renderTelemetryFrame,
        destroy: () => {
            unsubscribeLog()
            unsubscribeFrame()
            bus.destroy()
            db.clear()
        },
    }
}

if (
    process.env.NODE_ENV !== 'test' &&
    typeof process.stdout.write === 'function'
) {
    const cockpit = initializeCockpitHarness()
    process.stdout.write(cockpit.renderTelemetryFrame() + '\n')
}
