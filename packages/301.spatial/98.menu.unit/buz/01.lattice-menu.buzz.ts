import { MenuActionPayload, SpatialBus } from '../fce/menu.interface.js';
import { createAxialCoord, packAxial } from '../../28.axial.unit/val/axial.model.js';
import { axialToDoubled, axialDistance } from '../../28.axial.unit/buz/axial.buzz.js';
import { getRing, getSpiralDisk } from '../../21.lattice.unit/buz/lattice.buzz.js';

export function createLatticeInspectionAction(): MenuActionPayload {
  return {
    id: 'LAT01_INSPECT_RINGS',
    label: 'Inspect Coordinate Rings',
    shortcut: 'LAT01',
    category: 'LATTICE',
    execute: async (bus: SpatialBus) => {
      const origin = createAxialCoord(0, 0);
      const ring1 = getRing(origin, 1);
      const disk2 = getSpiralDisk(origin, 2);

      bus.emit('TELEMETRY_LOG', {
        message: `:: Lattice: Origin (0,0) Doubled: (${axialToDoubled(origin).x}, ${axialToDoubled(origin).y})`
      });
      bus.emit('TELEMETRY_LOG', {
        message: `:: Ring 1 Count: ${ring1.length} | Disk 2 Count: ${disk2.length}`
      });

      const sample = disk2[disk2.length - 1];
      const packed = packAxial(sample.q, sample.r);
      const dist = axialDistance(origin, sample);

      bus.emit('TELEMETRY_LOG', {
        message: `:: Sample Cell: (${sample.q}, ${sample.r}) Packed: ${packed} Dist: ${dist}`
      });
    }
  };
}
