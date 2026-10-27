import clone from 'clone-deep'
import * as Act from './topology.action'
import { TopologyModel } from './topology.model'
import * as Buzz from './topology.buzzer'
import State from '../99.core/state'

export function reducer(
    model: TopologyModel = new TopologyModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.UPDATE_TOPOLOGY:
            return Buzz.updateTopology(clone(model), act.bale, state)

        case Act.INIT_TOPOLOGY:
            return Buzz.initTopology(clone(model), act.bale, state)

        default:
            return model
    }
}
