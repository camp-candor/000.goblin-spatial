import { HexmapModel } from '../hexmap.model'
import HexmapBit from '../fce/hexmap.bit'
import State from '../../99.core/state'
import * as SHAPE from '../../val/shape'
import * as Honeycomb from 'honeycomb-grid'

import * as HEXMAP from '../../val/hexmap'
import S from 'string'
import MapBit from '../fce/map.bit'
import * as SPACE from '../../val/space'
import SpotBit from '../../01.focus.unit/fce/spot.bit'

import * as ActMap from '../hexmap.action'

import * as ActFoc from '../../01.focus.unit/focus.action'

import * as ActSpc from '../../00.space.unit/space.action'
import * as ActCol from '../../97.collect.unit/collect.action'

import * as ActDsk from '../../act/disk.action'
import * as ActVrt from '../../act/vurt.action'

var bit, idx, lst, dat, val, src

export const createHexmap = async (
    cpy: HexmapModel,
    bal: HexmapBit,
    ste: State,
) => {
    if (bal.dat.bit != null) {
        bal.slv({ mapBit: { idx: 'create-hexmap', dat: bal.dat.bit } })
        return
    }

    var clone = require('clone-deep')

    var dat: MapBit = {
        idx: bal.idx,
        typ: HEXMAP.AMBT,
        val: bal.dat.val,
        ver: '00.00',
    }

    for (var key in bal.dat) {
        dat[key] = bal.dat[key]
    }

    dat

    const Hex = Honeycomb.extendHex({
        size: Number(1), // default: 1
        orientation: 'flat',
    })

    const Grid = Honeycomb.defineGrid(Hex)

    dat.bit

    if (dat.bit == null)
        bal.slv({
            mapBit: { idx: 'create-hexmap-error', src: 'no bit present' },
        })

    dat.bit.grid

    var copied = clone(dat.bit.grid)

    dat.grid = Grid(copied)
    //debugger

    var size = dat.grid.length

    if (dat.bit == null) {
        if (bal.slv != null)
            bal.slv({
                mapBit: { idx: 'create-hexmap-error', src: 'no bit present' },
            })

        return
    }

    dat

    bal.slv({ mapBit: { idx: 'create-hexmap', dat } })

    //var next = async ()=>{

    //  size -= 1;

    //  var itm = dat.grid[ size ]
    //  var hex = itm.hex;

    //11.07.23 this had been set to use the bus and it cause big trouble
    //  bit = await ste.hunt( ActFoc.WRITE_FOCUS, { idx:hex, src: dat.idx, dat:{  x: itm.x, y: itm.y, } })

    //  if ( size == 0 )
    //  {

    //    return
    //  }

    //   await next()

    // }

    // next()

    return cpy
}
