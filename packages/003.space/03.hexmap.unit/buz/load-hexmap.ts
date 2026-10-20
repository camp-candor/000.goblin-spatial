import { HexmapModel } from '../hexmap.model'
import HexmapBit from '../fce/hexmap.bit'
import State from '../../99.core/state'

import * as ActMap from '../hexmap.action'
import * as ActDsk from '../../act/disk.action'

let bit

export const loadHexmap = async (
    cpy: HexmapModel,
    bal: HexmapBit,
    ste: State,
) => {
    bit = await ste.hunt(ActDsk.READ_DISK, { src: bal.src })
    var mapBit = JSON.parse(bit.dskBit.dat)
    bit = await ste.hunt(ActMap.WRITE_HEXMAP, {
        idx: bal.idx,
        dat: { bit: mapBit },
    })

    debugger

    bal.slv({ mapBit: { idx: 'load-hexmap', dat: {} } })

    return cpy
}
