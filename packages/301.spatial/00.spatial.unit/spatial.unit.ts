import type { Unit } from '../99.core/interface/unit.interface.js'
import { SpatialModel } from './spatial.model.js'
import { reducer } from './spatial.reduce.js'

export default class SpatialUnit implements Unit<SpatialModel> {
    idx: string = '00.spatial'
    model: SpatialModel = new SpatialModel()
    reducer = reducer
}
