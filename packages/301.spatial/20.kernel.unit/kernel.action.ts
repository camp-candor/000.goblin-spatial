import { Action } from '../99.core/interface/action.interface'
import KernelBit from './fce/kernel.bit'

// Kernel actions

export const INIT_KERNEL = '[Kernel action] Init Kernel'
export class InitKernel implements Action {
    readonly type = INIT_KERNEL
    constructor(public bale: KernelBit) {}
}

export const UPDATE_KERNEL = '[Kernel action] Update Kernel'
export class UpdateKernel implements Action {
    readonly type = UPDATE_KERNEL
    constructor(public bale: KernelBit) {}
}

export type Actions = InitKernel | UpdateKernel
