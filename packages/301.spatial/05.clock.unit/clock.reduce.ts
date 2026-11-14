import clone from 'clone-deep'
import * as Act from './clock.action.js'
import { ClockModel } from './clock.model.js'
import * as Buzz from './clock.buzzer.js'
import type State from '../99.core/state.js'

export function reducer(
    model: ClockModel = new ClockModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.UPDATE_CLOCK:
            return Buzz.updateClock(clone(model), act.bale, state)

        case Act.INIT_CLOCK:
            return Buzz.initClock(clone(model), act.bale, state)

        case Act.SYNC_SPATIAL_CLOCK:
            return Buzz.syncSpatialClock(clone(model), act.bale, state)

        case Act.DERIVE_DIURNAL_PROFILE:
            return Buzz.deriveDiurnalProfile(clone(model), act.bale, state)

        default:
            return model
    }
}
