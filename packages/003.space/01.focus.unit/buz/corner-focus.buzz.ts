import * as ActFoc from '../focus.action'
import * as ActMap from '../../03.hexmap.unit/hexmap.action'
import * as ActCol from '../../97.collect.unit/collect.action'

var bit, val, idx, dex, lst, dat

export const cornerFocus = async (
    cpy: FocusModel,
    bal: FocusBit,
    ste: State,
) => {
    var spot: SpotBit = bal.dat

    var grid
    bit = await ste.hunt(ActMap.READ_HEXMAP, { idx: spot.src })

    grid = bit.mapBit.dat.grid

    if (grid == null)
        bal.slv({ focBit: { idx: 'corner-focus-error', lst, dat: spot } })
    if (grid == null) return

    var hex = grid.get({ x: spot.x, y: spot.y })

    const point = hex.toPoint()
    lst = hex.corners().map((corner) => corner.add(point))

    spot.corners = lst

    if (bal.slv != null)
        bal.slv({ focBit: { idx: 'corner-focus', lst, bit: spot } })

    return cpy
}

import { FocusModel } from '../focus.model'
import FocusBit from '../fce/focus.bit'
import State from '../../99.core/state'
import SpotBit from '../fce/spot.bit'
import * as Honeycomb from 'honeycomb-grid'
import * as SHAPE from '../../val/shape'
import * as SPACE from '../../val/space'
import * as FOCUS from '../../val/focus'
import * as DIRECTION from '../../val/direction'
import MapBit from '../../03.hexmap.unit/fce/map.bit'
