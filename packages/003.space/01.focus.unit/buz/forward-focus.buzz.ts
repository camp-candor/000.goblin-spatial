import * as ActFoc from '../focus.action'
import * as ActMap from '../../03.hexmap.unit/hexmap.action'
import * as ActCol from '../../97.collect.unit/collect.action'

var bit, val, idx, dex, lst, dat

export const forwardFocus = async (
    cpy: FocusModel,
    bal: FocusBit,
    ste: State,
) => {
    bit = await ste.hunt(ActFoc.READ_FOCUS, { idx: bal.idx })
    var spot: SpotBit = bit.focBit.dat

    //bit = await ste.hunt(ActFoc.CENTER_FOCUS, {idx:spot.idx, dat: spot } )

    var x = spot.x
    var y = spot.y

    var face = spot.face
    var bonds = spot.bonds

    if (bonds == null) {
        //nothing happens
        bit = await ste.hunt(ActFoc.BOND_FOCUS, {
            idx: bal.idx,
            src: face,
            dat: spot,
        })
        var bonds = bit.focBit.dat
        spot.bonds = bonds
    } else {
        const now = bonds[face]

        if (now != null) {
            x = now.x
            y = now.y
        }
    }

    spot.x = x
    spot.y = y

    bit = await ste.hunt(ActFoc.BOND_FOCUS, {
        idx: bal.idx,
        src: face,
        dat: spot,
    })
    var bonds = bit.focBit.dat
    spot.bonds = bonds

    bit = await ste.hunt(ActFoc.CORNER_FOCUS, { dat: spot })
    spot.corners = bit.focBit.lst

    spot

    bit = await ste.hunt(ActFoc.WRITE_FOCUS, {
        idx: spot.idx,
        src: spot.src,
        dat: { x, y, bonds, face },
    })

    if (bal.slv != null)
        bal.slv({ focBit: { idx: 'forward-focus', bit: spot } })
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
