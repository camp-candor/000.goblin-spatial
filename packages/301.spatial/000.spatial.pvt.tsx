'use server'

import * as Import from './BEE.js'
import State from './99.core/state.js'

let instance: any = null

const sim: any = {
    hunt: (a: any, b: any) => {},
    state: null,
}

const host = (obj: any, typ: string) => {
    init()

    let slv: (val0: any) => void
    const promo = new Promise((rslv) => {
        slv = rslv
    })

    if (obj == null) obj = {}
    if (obj.slv == null) obj.slv = (val0: any) => slv(val0)

    sim.state.dispatch({ type: typ, bale: obj })
    return promo
}

sim.hunt = (typ: string, obj: any) => {
    return host(obj, typ)
}

const init = () => {
    if (!instance) {
        if (sim.state != null) return
        sim.state = new State()
        sim.state.pivot = sim
        sim.state.hunt = sim.hunt
        for (const k in Import.list) {
            new Import.list[k](sim.state)
        }
        instance = sim
    }

    return instance
}

export const spatial = async (typ: string, obj: any) => {
    return sim.hunt(typ, obj)
}
