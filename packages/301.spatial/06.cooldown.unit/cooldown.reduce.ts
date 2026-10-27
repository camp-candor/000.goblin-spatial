import clone from 'clone-deep'
import * as Act from './cooldown.action'
import { CooldownModel } from './cooldown.model'
import * as Buzz from './cooldown.buzzer'
import State from '../99.core/state'

export function reducer(
    model: CooldownModel = new CooldownModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.UPDATE_COOLDOWN:
            return Buzz.updateCooldown(clone(model), act.bale, state)

        case Act.INIT_COOLDOWN:
            return Buzz.initCooldown(clone(model), act.bale, state)

        default:
            return model
    }
}
