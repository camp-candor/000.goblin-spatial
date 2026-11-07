import clone from 'clone-deep'
import * as Act from './segment.action'
import { SegmentModel } from './segment.model'
import * as Buzz from './segment.buzzer'
import State from '../99.core/state'

export function reducer(
    model: SegmentModel = new SegmentModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.UPDATE_SEGMENT:
            return Buzz.updateSegment(clone(model), act.bale, state)

        case Act.INIT_SEGMENT:
            return Buzz.initSegment(clone(model), act.bale, state)

        default:
            return model
    }
}
