import * as ActFoc from '../focus.action'
import * as ActMap from '../../03.hexmap.unit/hexmap.action'
import * as ActCol from '../../97.collect.unit/collect.action'

var bit, val, idx, dex, lst, dat, src

export const initFocus = (cpy: FocusModel, bal: FocusBit, ste: State) => {
    var lst = [ActFoc.OPEN_FOCUS]
    bal.slv({ intBit: { idx: 'init-focus', lst } })

    return cpy
}

export const readFocus = async (cpy: FocusModel, bal: FocusBit, ste: State) => {
    var slv = bal.slv
    if (bal.idx == null) bal.idx = 'foc00'
    bit = await ste.hunt(ActCol.READ_COLLECT, {
        idx: bal.idx,
        src: bal.src,
        bit: ActFoc.CREATE_FOCUS,
    })

    if (slv != null) slv({ focBit: { idx: 'read-focus', dat: bit.clcBit.dat } })

    return cpy
}

export const writeFocus = async (
    cpy: FocusModel,
    bal: FocusBit,
    ste: State,
) => {
    //debugger

    if (bal.idx == null) bal.idx = 'foc00'
    //if (bal.val != 1) ste.hunt(ActFoc.UPDATE_FOCUS, { idx: bal.idx })

    bit = await ste.hunt(ActCol.WRITE_COLLECT, {
        idx: bal.idx,
        src: bal.src,
        dat: bal.dat,
        bit: ActFoc.CREATE_FOCUS,
    })
    var spot: SpotBit = bit.clcBit.dat

    //debugger

    if (bal.slv != null) bal.slv({ focBit: { idx: 'write-focus', dat: spot } })

    return cpy
}

export const removeFocus = (cpy: FocusModel, bal: FocusBit, ste: State) => {
    debugger
    return cpy
}

export const deleteFocus = (cpy: FocusModel, bal: FocusBit, ste: State) => {
    debugger
    return cpy
}

export const listFocus = async (cpy: FocusModel, bal: FocusBit, ste: State) => {
    dat = null

    bit = await ste.hunt(ActCol.FETCH_COLLECT, {
        val: 0,
        bit: ActFoc.CREATE_FOCUS,
    })

    if (bal.src == null) bal.src = FOCUS.AMBT

    src = bal.src

    if (bit.clcBit.dat == null) lst = []
    else dat = bit.clcBit.dat

    dat

    if (dat != null) {
        lst = []

        var bitList = dat.bitList
        var bits = dat.bits

        dat.bitList.forEach((a) => {
            src

            var itm = bitList[a.dex]

            if (bal.src.toUpperCase() != itm.typ.toUpperCase()) return
            lst.push(itm.idx)
        })
    }

    lst

    if (bal.slv != null) bal.slv({ focBit: { idx: 'list-focus', lst } })

    return cpy
}

export const centerFocus = async (
    cpy: FocusModel,
    bal: FocusBit,
    ste: State,
) => {
    if (bal.slv != null) bal.slv({ focBit: { idx: 'center-focus', dat } })
}

export const locateFocus = async (
    cpy: FocusModel,
    bal: FocusBit,
    ste: State,
) => {
    bit = await ste.hunt(ActFoc.READ_FOCUS, { idx: bal.idx })
    var spot: SpotBit = bit.focBit.dat

    bit = await ste.hunt(ActMap.READ_HEXMAP, { idx: spot.map })
    var map: MapBit = bit.mapBit.dat
    var grid = map.dat

    var hex = grid.get({ x: spot.x, y: spot.y })

    var idx = spot.map + '-' + spot.x + '-' + spot.y
    spot.loc = hex

    if (bal.slv != null) bal.slv({ focBit: { idx: 'locate-focus', dat: spot } })

    return cpy
}

export const selectFocus = async (
    cpy: FocusModel,
    bal: FocusBit,
    ste: State,
) => {
    bit = await ste.hunt(ActFoc.READ_FOCUS, { idx: bal.idx })

    var spot: SpotBit = bit.focBit.dat

    cpy.select = spot

    //bit = await ste.hunt( ActFoc.VISION_FOCUS, { idx: bal.idx })
    if (bal.slv != null)
        bal.slv({ focBit: { idx: 'select-focus', dat: cpy.select } })

    return cpy
}

export const openFocus = (cpy: FocusModel, bal: FocusBit, ste: State) => {
    if (bal.slv != null) bal.slv({ focBit: { idx: 'open-focus', dat: {} } })

    return cpy
}

//grab all the model data
export const modelFocus = async (
    cpy: FocusModel,
    bal: FocusBit,
    ste: State,
) => {
    if (bal.src == null) bal.src = 'GET'

    switch (bal.src) {
        case 'GET':
            bit = await ste.hunt(ActCol.GET_COLLECT, { idx: 'focus' })
            dat = bit.clcBit.dat
            break

        case 'PUT':
            break
    }

    if (bal.slv != null) bal.slv({ focBit: { idx: 'model-focus', dat } })

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
import * as FOCUS from '../../val/focus'

import MapBit from '../../03.hexmap.unit/fce/map.bit'
