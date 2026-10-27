import clone from 'clone-deep'
import * as Act from './observer.action'
import { ObserverModel } from './observer.model'
import * as Buzz from './observer.buzzer'
import State from '../99.core/state'

export function reducer(
    model: ObserverModel = new ObserverModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.UPDATE_OBSERVER:
            return Buzz.updateObserver(clone(model), act.bale, state)

        case Act.INIT_OBSERVER:
            return Buzz.initObserver(clone(model), act.bale, state)

        default:
            return model
    }
}
