import * as ActFoc from '../focus.action'
import * as ActMap from '../../03.hexmap.unit/hexmap.action'
import * as ActCol from '../../97.collect.unit/collect.action'

var bit, val, idx, dex, lst, dat

export const brownianFocus = async (
    cpy: FocusModel,
    bal: FocusBit,
    ste: State,
) => {
    var spot: SpotBit

    var now = Math.floor(Math.random() * 11)

    switch (now) {
        case 0:
            bit = await ste.hunt(ActFoc.FORWARD_FOCUS, { idx: bal.idx })
            spot = bit.focBit.bit
            break

        case 1:
            bit = await ste.hunt(ActFoc.FORWARD_FOCUS, { idx: bal.idx })
            spot = bit.focBit.bit
            break

        case 2:
            bit = await ste.hunt(ActFoc.FORWARD_FOCUS, { idx: bal.idx })
            spot = bit.focBit.bit
            break

        case 3:
            bit = await ste.hunt(ActFoc.FORWARD_FOCUS, { idx: bal.idx })
            spot = bit.focBit.bit
            break

        case 4:
            bit = await ste.hunt(ActFoc.FORWARD_FOCUS, { idx: bal.idx })
            spot = bit.focBit.bit
            break

        case 5:
            bit = await ste.hunt(ActFoc.FORWARD_FOCUS, { idx: bal.idx })
            spot = bit.focBit.bit

            break

        case 6:
            bit = await ste.hunt(ActFoc.SPIN_LEFT_FOCUS, { idx: bal.idx })
            spot = bit.focBit.bit
            break

        case 7:
            bit = await ste.hunt(ActFoc.SPIN_RIGHT_FOCUS, { idx: bal.idx })
            spot = bit.focBit.bit
            break

        case 8:
            bit = await ste.hunt(ActFoc.SPIN_LEFT_FOCUS, { idx: bal.idx })
            spot = bit.focBit.bit
            break

        case 9:
            bit = await ste.hunt(ActFoc.BACKWARD_FOCUS, { idx: bal.idx })
            spot = bit.focBit.bit
            break

        case 10:
            bit = await ste.hunt(ActFoc.BACKWARD_FOCUS, { idx: bal.idx })
            spot = bit.focBit.bit
            break
    }

    if (bal.slv != null) bal.slv({ focBit: { idx: 'vision-focus', bit: spot } })

    return cpy
}

import { FocusModel } from '../focus.model'
import FocusBit from '../fce/focus.bit'
import State from '../../99.core/state'
import SpotBit from '../fce/spot.bit'
import * as Honeycomb from 'honeycomb-grid'
import * as SHAPE from '../../val/shape'
import * as SPACE from '../../val/space'
import * as DIRECTION from '../../val/direction'

import MapBit from '../../03.hexmap.unit/fce/map.bit'
