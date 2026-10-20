import * as ActFoc from '../focus.action'
import * as ActMap from '../../03.hexmap.unit/hexmap.action'
import * as ActCol from '../../97.collect.unit/collect.action'

var bit, val, idx, dex, lst, dat

export const backwardFocus = async (
    cpy: FocusModel,
    bal: FocusBit,
    ste: State,
) => {
    bit = await ste.hunt(ActFoc.READ_FOCUS, { idx: bal.idx })
    var spot: SpotBit = bit.focBit.dat

    var x = spot.x
    var y = spot.y
    var face = spot.face
    var bonds, bond

    //bit = await ste.hunt(ActFoc.CENTER_FOCUS, {idx:spot.idx, dat: spot } )

    if (face == DIRECTION.WEST) {
        bit = await ste.hunt(ActFoc.BOND_FOCUS, {
            idx: spot.idx,
            src: DIRECTION.EAST,
            dat: spot,
        })
        bonds = bit.focBit.dat
        if (bonds != null) bond = bonds[DIRECTION.EAST]
        if (bond != null) {
            x = bond.x
            y = bond.y
        }
    }

    if (face == DIRECTION.EAST) {
        bit = await ste.hunt(ActFoc.BOND_FOCUS, {
            idx: spot.idx,
            src: DIRECTION.WEST,
            dat: spot,
        })
        bonds = bit.focBit.dat
        if (bonds != null) bond = bonds[DIRECTION.WEST]
        if (bond != null) {
            x = bond.x
            y = bond.y
        }
    }

    if (face == DIRECTION.NORTH_WEST) {
        bit = await ste.hunt(ActFoc.BOND_FOCUS, {
            idx: spot.idx,
            src: DIRECTION.SOUTH_EAST,
            dat: spot,
        })
        bonds = bit.focBit.dat
        if (bonds != null) bond = bonds[DIRECTION.SOUTH_EAST]
        if (bond != null) {
            x = bond.x
            y = bond.y
        }
    }

    if (face == DIRECTION.NORTH_EAST) {
        bit = await ste.hunt(ActFoc.BOND_FOCUS, {
            idx: spot.idx,
            src: DIRECTION.SOUTH_WEST,
            dat: spot,
        })
        bonds = bit.focBit.dat
        if (bonds != null) bond = bonds[DIRECTION.SOUTH_WEST]
        if (bond != null) {
            x = bond.x
            y = bond.y
        }
    }

    if (face == DIRECTION.SOUTH_WEST) {
        bit = await ste.hunt(ActFoc.BOND_FOCUS, {
            idx: spot.idx,
            src: DIRECTION.NORTH_EAST,
            dat: spot,
        })
        bonds = bit.focBit.dat
        if (bonds != null) bond = bonds[DIRECTION.NORTH_EAST]
        if (bond != null) {
            x = bond.x
            y = bond.y
        }
    }

    if (face == DIRECTION.SOUTH_EAST) {
        bit = await ste.hunt(ActFoc.BOND_FOCUS, {
            idx: spot.idx,
            src: DIRECTION.NORTH_WEST,
            dat: spot,
        })
        bonds = bit.focBit.dat
        if (bonds != null) bond = bonds[DIRECTION.NORTH_WEST]
        if (bond != null) {
            x = bond.x
            y = bond.y
        }
    }

    //patch(ste, ActFoc.LIST_VISON_FOCUS, foci);
    //locateHex(ste, foci);

    bit = await ste.hunt(ActFoc.WRITE_FOCUS, {
        idx: bal.idx,
        dat: { x, y, bonds, face },
    })

    if (bal.slv != null)
        bal.slv({ focBit: { idx: 'backward-focus', dat: spot } })
}

import { FocusModel } from '../focus.model'
import FocusBit from '../fce/focus.bit'
import State from '../../99.core/state'
import SpotBit from '../fce/spot.bit'
import * as Honeycomb from 'honeycomb-grid'
import * as SHAPE from '../../val/shape'
import * as SPACE from '../../val/space'
import * as DIRECTION from '../../val/direction'
