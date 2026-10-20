import * as ActGeo from '../geojson.action'
import * as ActMap from '../../03.hexmap.unit/hexmap.action'
import * as ActCol from '../../97.collect.unit/collect.action'
//import * as ActCns from "../../83.console.unit/console.action";

import { GeojsonModel } from '../geojson.model'
import GeojsonBit from '../fce/geojson.bit'
import State from '../../99.core/state'

//import * as ActDsk from "../../96.disk.unit/disk.action";

var bit, val, idx, dex, lst, dat, src

export const initGeojson = (cpy: GeojsonModel, bal: GeojsonBit, ste: State) => {
    debugger
    return cpy
}

export const updateGeojson = (
    cpy: GeojsonModel,
    bal: GeojsonBit,
    ste: State,
) => {
    return cpy
}

export const loadGeojson = async (
    cpy: GeojsonModel,
    bal: GeojsonBit,
    ste: State,
) => {
    src = bal.src

    if (bal.val != null) {
        val = bal.val

        //here we will load
        //     bit = await ste.hunt(ActDsk.INDEX_DISK, { src: cpy.geoSrc + '/' })

        lst = bit.dskBit.lst

        var itm = lst[val]

        var want = cpy.geoSrc + '/' + itm

        //   bit = await ste.hunt(ActDsk.READ_DISK, { src: want  })
        dat = bit.dskBit.dat
        src = itm.split('.')[0] + '.' + itm.split('.')[1]
        cpy.geojsonData = JSON.parse(dat)

        dat = cpy.geojsonData

        bal.slv({ geoBit: { idx: 'load-geojson', dat, src } })
    } else {
        // bit = await ste.hunt(ActDsk.READ_DISK, { src: cpy.geoSrc + '/' + src, val: 1 })
        dat = bit.dskBit.dat
        cpy.geojsonData = dat
        src = bal.src.split('.')[0] + '.' + bal.src.split('.')[1]
        bal.slv({ geoBit: { idx: 'load-geojson', dat, src } })
    }

    //bit = await ste.hunt(ActCns.UPDATE_CONSOLE, { idx: 'cns00', src: "loading.. "+ src })

    return cpy
}

export const indexGeojson = async (
    cpy: GeojsonModel,
    bal: GeojsonBit,
    ste: State,
) => {
    dat = null

    //bit = await ste.bus(ActDsk.INDEX_DISK, { src: cpy.geoSrc })
    lst = bit.dskBit.lst

    if (bal.slv != null) bal.slv({ geoBit: { idx: 'list-geojson', lst } })

    return cpy
}

export const captureGeojson = async (
    cpy: GeojsonModel,
    bal: GeojsonBit,
    ste: State,
) => {
    //var open = require('open')
    //await open(bal.src);

    if (bal.slv != null)
        bal.slv({ geoBit: { idx: 'capture-geojson', src: bal.src } })
    return cpy
}

export const saveGeojson = async (
    cpy: GeojsonModel,
    bal: GeojsonBit,
    ste: State,
) => {
    // bit = await ste.bus(ActDsk.INDEX_DISK, { src: "./data/geojson/" })
    lst = bit.dskBit.lst

    var dex = lst.length
    var out = String(dex).padStart(3, '0')

    var srcDir = './data/geojson/' + out + '.' + bal.src + '.json'

    var clipboardy = require('clipboardy')

    var geo

    try {
        geo = clipboardy.readSync()
    } catch (e) {
        console.log('hmmm ' + e)
        if (bal.slv != null) bal.slv({ geoBit: { idx: 'save-geojson-error' } })
        return
    }

    if (geo.includes('coordinates') == false) {
        if (bal.slv != null) bal.slv({ geoBit: { idx: 'save-geojson-error' } })
        return
    }

    if (geo.includes('type') == false) {
        if (bal.slv != null) bal.slv({ geoBit: { idx: 'save-geojson-error' } })
        return
    }

    // bit = await ste.bus(ActDsk.WRITE_DISK, { idx: srcDir, dat: geo })

    if (bal.slv != null)
        bal.slv({ geoBit: { idx: 'save-geojson', src: bal.src } })
    return cpy
}
