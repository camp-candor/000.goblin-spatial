import clone from 'clone-deep'
import * as Act from './cells.action'
import { CellsModel } from './cells.model'
import * as Buzz from './cells.buzzer'
import State from '../99.core/state'

export function reducer(
    model: CellsModel = new CellsModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.UPDATE_CELLS:
            return Buzz.updateCells(clone(model), act.bale, state)

        case Act.INIT_CELLS:
            return Buzz.initCells(clone(model), act.bale, state)

        default:
            return model
    }
}
