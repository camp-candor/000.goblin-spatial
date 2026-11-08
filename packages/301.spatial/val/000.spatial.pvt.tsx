import { createSpatialBus } from '../99.bus.unit/buz/bus.buzz.js'
import { MenuDispatcher } from '../98.menu.unit/buz/00.menu.buzz.js'

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

    const unsubscribe = bus.subscribe('TELEMETRY_LOG', (evt) => {
        const msg = String(evt.payload.message || '')
        logs.push(msg)
        if (logs.length > 100) {
            logs.shift()
        }
    })

    const renderTelemetryFrame = (): string => {
        const catalog = menu.getCatalog()
        const actionLines = catalog.actions
            .map((act, i) => {
                const marker = i === catalog.activeIndex ? '>' : ' '
                return `  ${marker} [${act.shortcut}] ${act.label} (${act.category})`
            })
            .join('\n')

        const recentLogs =
            logs.slice(-5).join('\n') ||
            '  >> [SYSTEM READY: Awaiting Operator Input]'

        return [
            '+--------------------------------------------------------------------------+',
            '| 000.goblin-spatial :: BLESSED TERMINAL COCKPIT (Phase 1)                |',
            '+--------------------------------------------------------------------------+',
            '| MENU CONTROLS (Columns 0-4, Rows 0-12)                                   |',
            actionLines,
            '+--------------------------------------------------------------------------+',
            '| TELEMETRY LOG [cns00] (Columns 4-12, Rows 3-12)                          |',
            recentLogs,
            '+--------------------------------------------------------------------------+',
        ].join('\n')
    }

    return {
        bus,
        menu,
        renderTelemetryFrame,
        destroy: () => {
            unsubscribe()
            bus.clear()
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
