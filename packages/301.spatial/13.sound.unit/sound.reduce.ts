import clone from 'clone-deep'
import * as Act from './sound.action'
import { SoundModel } from './sound.model'
import * as Buzz from './sound.buzzer'
import State from '../99.core/state'

export function reducer(
    model: SoundModel = new SoundModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.UPDATE_SOUND:
            return Buzz.updateSound(clone(model), act.bale, state)

        case Act.INIT_SOUND:
            return Buzz.initSound(clone(model), act.bale, state)

        default:
            return model
    }
}
