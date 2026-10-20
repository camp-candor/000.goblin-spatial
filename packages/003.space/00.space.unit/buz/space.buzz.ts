import { SpaceModel } from '../space.model'
import SpaceBit from '../fce/space.bit'
import State from '../../99.core/state'

import S from 'string'

import * as ActMnu from '../../98.menu.unit/menu.action'
import * as ActSpc from '../../00.space.unit/space.action'
import * as ActGeo from '../../02.geojson.unit/geojson.action'
import * as ActMap from '../../03.hexmap.unit/hexmap.action'
import * as ActFoc from '../../01.focus.unit/focus.action'

import * as ActCol from '../../97.collect.unit/collect.action'

import * as ActPvt from '../../act/pivot.action'
import * as ActDsk from '../../act/disk.action'

import * as ActBus from '../../99.bus.unit/bus.action'

var bit, lst, dex, src, dat

export const initSpace = (cpy: SpaceModel, bal: SpaceBit, ste: State) => {
    const url =
        process.env.SPACE_URL ||
        'https://zero00-server.onrender.com/api/space/test'
    if (url) {
        fetch(url)
            .then((response) => response.json())
            .then((data) => {
                if (bal.slv != null) {
                    bal.slv({
                        intBit: {
                            idx: 'init-space',
                            dat: {
                                space: data,
                            },
                        },
                    })
                }
            })
            .catch((error: any) => {
                if (bal.slv != null) {
                    bal.slv({
                        intBit: { idx: 'init-space-err', dat: error.message },
                    })
                }
            })
    } else {
        if (bal.slv != null) {
            bal.slv({ intBit: { idx: 'init-space' } })
        }
    }

    return cpy
}

export const updateSpace = (cpy: SpaceModel, bal: SpaceBit, ste: State) => {
    const { exec } = require('child_process')

    exec('tsc -b 002.space', async (err, stdout, stderr) => {
        if (err) {
            console.error(`exec error: ${err}`)
        }

        lst = []

        bit = await ste.bus(ActPvt.BUNDLE_PIVOT, { src: '002.space' })
        lst.push(bit)

        //bit = await ste.bus(ActDsk.READ_DISK, { src: "./work/002.space.js" });
        //var blend = bit.dskBit.dat;

        //var replace = '_globals = (function(){ return this || (0,eval)("this"); }());'
        //blend = S(blend).replaceAll(replace, '').s

        //bit = await ste.bus(ActDsk.WRITE_DISK, { src: "./cloud/002.space.js", dat: blend });
        //lst.push(bit);

        setTimeout(async () => {
            //bit = await ste.hunt(ActCns.UPDATE_CONSOLE, { idx: "cns00", src: "--- space bundled" });

            if (bal.slv != null) bal.slv({ spcBit: { idx: 'update-space' } })
        }, 3)
    })

    return cpy
}

export const testSpace = async (cpy: SpaceModel, bal: SpaceBit, ste: State) => {
    //bit = await ste.hunt(ActCns.UPDATE_CONSOLE, { idx: "cns00", src: "-----------" });
    //bit = await ste.hunt(ActCns.UPDATE_CONSOLE, { idx: "cns00", src: "Testing Space" });
    //bit = await ste.hunt(ActCns.UPDATE_CONSOLE, { idx: "cns00", src: "-----------" });

    bal.slv({ spcBit: { idx: 'test-space', src: 'testing-space' } })

    return cpy
}

var patch = (ste, type, bale) => ste.dispatch({ type, bale })
