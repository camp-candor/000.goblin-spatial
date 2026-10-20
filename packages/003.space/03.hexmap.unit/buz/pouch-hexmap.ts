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

export const pouchHexmap = async (
    cpy: HexmapModel,
    bal: HexmapBit,
    ste: State,
) => {
    var dir = './data/mapbit'
    dat = {}

    bit = await ste.hunt(ActDsk.INDEX_DISK, { src: dir })

    lst = bit.dskBit.lst

    var out = []

    lst.forEach((a) => {
        var me = a.split('.')
        me.pop()

        idx = me.join('')

        var data = { idx, src: dir + '/' + a }
        out.push(data)
    })

    bit = await ste.hunt(ActDsk.WRITE_DISK, {
        idx: './data/mapbit.json',
        dat: JSON.stringify(out),
    })

    bal.slv({ mapBit: { idx: 'pouch-hexmap', lst: out } })

    return cpy
}
