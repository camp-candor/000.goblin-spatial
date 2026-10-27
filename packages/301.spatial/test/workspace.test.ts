import { describe, it, expect } from 'vitest'
import sim from '../hunt.js'
import UnitData, { list, reducer } from '../BEE.js'
import State from '../99.core/state.js'

describe('packages/001.spatial workspace scaffolding', () => {
    it('initializes UnitData model defaults', () => {
        const model = new UnitData()
        expect(model.idx).toBe('001.spatial')
        expect(Array.isArray(list)).toBe(true)
        expect(typeof reducer).toBe('object')
    })

    it('boots State instance with dispatcher and reducedApp', () => {
        const state = new State()
        expect(typeof state.dispatch).toBe('function')
        expect(typeof state.reducedApp).toBe('function')
        expect(state.value.idx).toBe('001.spatial')
    })

    it('executes in-memory sim.hunt loop cleanly', async () => {
        expect(typeof sim.hunt).toBe('function')
        const actionType = '[Spatial action] Ping Spatial'
        const responsePromise = sim.hunt(actionType, { ping: true })
        expect(responsePromise).toBeInstanceOf(Promise)
    })
})
