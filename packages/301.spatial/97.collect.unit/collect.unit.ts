import type { Unit } from '../99.core/interface/unit.interface.js'
import { CollectModel } from './collect.model.js'
import { reducer } from './collect.reduce.js'

export default class CollectUnit implements Unit<CollectModel> {
    idx: string = '97.collect'
    model: CollectModel = new CollectModel()
    reducer = reducer
}
