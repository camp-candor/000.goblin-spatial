import clone from 'clone-deep'
import * as Act from './kernel.action'
import { KernelModel } from './kernel.model'
import * as Buzz from './kernel.buzzer'
import State from '../99.core/state'

export function reducer(
    model: KernelModel = new KernelModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.UPDATE_KERNEL:
            return Buzz.updateKernel(clone(model), act.bale, state)

        case Act.INIT_KERNEL:
            return Buzz.initKernel(clone(model), act.bale, state)

        default:
            return model
    }
}
