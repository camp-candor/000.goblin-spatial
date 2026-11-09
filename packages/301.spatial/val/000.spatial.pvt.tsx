import { createSpatialBus } from '../99.bus.unit/buz/bus.buzz.js';
import { MenuDispatcher } from '../98.menu.unit/buz/00.menu.buzz.js';
import { createLatticeInspectionAction } from '../98.menu.unit/buz/01.lattice-menu.buzz.js';
import { createTopologyLoaderAction } from '../98.menu.unit/buz/02.topology-menu.buzz.js';
import { createTopologyDatabase } from '../07.database.unit/buz/database.buzz.js';
import { createLoSVisualizerAction } from '../98.menu.unit/buz/03.los-menu.buzz.js';
import { createSoundPropagationAction } from '../98.menu.unit/buz/04.sound-menu.buzz.js';
import { createPathSimulationAction } from '../98.menu.unit/buz/05.path-menu.buzz.js';

export interface CockpitInstance {
  readonly bus: ReturnType<typeof createSpatialBus>;
  readonly menu: MenuDispatcher;
  readonly renderTelemetryFrame: () => string;
  readonly getActiveAsciiFrame: () => string | undefined;
  destroy(): void;
}

export function initializeCockpitHarness(): CockpitInstance {
  const bus = createSpatialBus();
  const menu = new MenuDispatcher(bus);
  const db = createTopologyDatabase();
  const logs: string[] = [];
  let lastAsciiFrame: string | undefined = undefined;

  // Register domain actions
  menu.registerAction(createLatticeInspectionAction());
  menu.registerAction(createTopologyLoaderAction(db));
  menu.registerAction(createLoSVisualizerAction());
  menu.registerAction(createSoundPropagationAction());
  menu.registerAction(createPathSimulationAction());

  const unsubLogs = bus.subscribe('TELEMETRY_LOG', (evt) => {
    const msg = String(evt.payload.message || '');
    logs.push(msg);
    if (logs.length > 100) {
      logs.shift();
    }
  });

  const unsubFrame = bus.subscribe('ASCII_FRAME_RENDER', (evt) => {
    lastAsciiFrame = String(evt.payload.frame || '');
  });

  const renderTelemetryFrame = (): string => {
    const catalog = menu.getCatalog();
    const actionLines = catalog.actions
      .map((act, i) => {
        const marker = i === catalog.activeIndex ? '>' : ' ';
        return `  ${marker} [${act.shortcut}] ${act.label} (${act.category})`;
      })
      .join('\n');

    const recentLogs = logs.slice(-6).join('\n') || '  >> [SYSTEM READY: Awaiting Operator Input]';
    const frameSection = lastAsciiFrame ? `\n${lastAsciiFrame}\n` : '';

    return [
      '+--------------------------------------------------------------------------+',
      '| 000.goblin-spatial :: BLESSED TERMINAL COCKPIT (Phase 6)                |',
      '+--------------------------------------------------------------------------+',
      '| MENU CONTROLS (Columns 0-4, Rows 0-12)                                   |',
      actionLines,
      '+--------------------------------------------------------------------------+',
      '| TELEMETRY LOG [cns00] (Columns 4-12, Rows 3-12)                          |',
      recentLogs,
      frameSection,
      '+--------------------------------------------------------------------------+'
    ].join('\n');
  };

  return {
    bus,
    menu,
    renderTelemetryFrame,
    getActiveAsciiFrame: () => lastAsciiFrame,
    destroy: () => {
      unsubLogs();
      unsubFrame();
      bus.destroy();

    }
  };
}

if (process.env.NODE_ENV !== 'test' && typeof process.stdout.write === 'function') {
  const cockpit = initializeCockpitHarness();
  process.stdout.write(cockpit.renderTelemetryFrame() + '\n');
}
