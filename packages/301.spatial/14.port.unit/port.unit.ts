import type { Unit } from '../99.core/interface/unit.interface.js'
import { PortModel } from './port.model.js'
import { reducer } from './port.reduce.js'

export default class PortUnit implements Unit<PortModel> {
    idx: string = '14.port'
    model: PortModel = new PortModel()
    reducer = reducer
}
