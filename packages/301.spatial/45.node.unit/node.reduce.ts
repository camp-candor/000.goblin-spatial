import clone from 'clone-deep'
import * as Act from './node.action'
import { NodeModel } from './node.model'
import * as Buzz from './node.buzzer'
import State from '../99.core/state'

export function reducer(
    model: NodeModel = new NodeModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.UPDATE_NODE:
            return Buzz.updateNode(clone(model), act.bale, state)

        case Act.INIT_NODE:
            return Buzz.initNode(clone(model), act.bale, state)

        default:
            return model
    }
}
