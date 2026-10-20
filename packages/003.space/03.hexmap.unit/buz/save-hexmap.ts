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

export const saveHexmap = async (
    cpy: HexmapModel,
    bal: HexmapBit,
    ste: State,
) => {
    bit = await ste.hunt(ActMap.READ_HEXMAP, { idx: bal.idx })

    dat = bit.mapBit.dat

    dat.idx = S(dat.idx).slugify().s

    if (bal.val == null) bal.val = 10

    val = String(bal.val).padStart(5, '0')

    bit = await ste.bus(ActDsk.ENSURE_DISK, { src: cpy.hexmapLoc })

    src = cpy.hexmapLoc + bal.idx + '.' + val + '.json'

    bit = await ste.bus(ActDsk.WRITE_DISK, { idx: null, src, dat, val: 1 })

    bal.slv({ mapBit: { idx: 'save-hexmap', src, dat } })

    return cpy
}
