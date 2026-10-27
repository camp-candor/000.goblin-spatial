import clone from 'clone-deep'
import * as Act from './overlay.action'
import { OverlayModel } from './overlay.model'
import * as Buzz from './overlay.buzzer'
import State from '../99.core/state'

export function reducer(
    model: OverlayModel = new OverlayModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.UPDATE_OVERLAY:
            return Buzz.updateOverlay(clone(model), act.bale, state)

        case Act.INIT_OVERLAY:
            return Buzz.initOverlay(clone(model), act.bale, state)

        default:
            return model
    }
}
