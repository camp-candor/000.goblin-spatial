import { describe, it, expect, vi } from 'vitest'
import { initSpace } from './buz/space.buzz.js'
import { SpaceModel } from './space.model.js'

describe('Space', () => {
    it('should initialize space', () => {
        const model = new SpaceModel()
        const state = {
            hunt: vi.fn().mockResolvedValue({}),
            dispatch: vi.fn(),
        } as any

        const slv = vi.fn()
        const bal = { idx: 'test', slv } as any

        // Check if initSpace is a function and can be called
        expect(typeof initSpace).toBe('function')

        const result = initSpace(model, bal, state)
        expect(result).toBe(model)
        //expect(slv).toHaveBeenCalledWith({ intBit: { idx: 'init-space' } });
    })

    it('should wake up the server if url is provided', async () => {
        const model = new SpaceModel()
        const state = {} as any
        const slv = vi.fn()
        const bal = { idx: 'test', slv } as any

        const urlSpace = 'https://zero00-server.onrender.com/api/space/test'

        const mockResponseSpace = { status: 'space-awake' }

        const globalFetch = vi
            .spyOn(global, 'fetch')
            .mockImplementation((url) => {
                if (url === urlSpace) {
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve(mockResponseSpace),
                    } as any)
                }
                return Promise.reject(new Error('Unknown URL'))
            })

        initSpace(model, bal, state)

        // Wait for the promise in initSpace to resolve
        await new Promise((resolve) => setTimeout(resolve, 0))

        expect(globalFetch).toHaveBeenCalledWith(urlSpace)
        expect(slv).toHaveBeenCalledWith({
            intBit: {
                idx: 'init-space',
                dat: {
                    space: mockResponseSpace,
                },
            },
        })

        globalFetch.mockRestore()
    })

    it('should handle fetch errors', async () => {
        const model = new SpaceModel()
        const state = {} as any
        const slv = vi.fn()
        const bal = { idx: 'test', slv } as any

        const urlSpace = 'https://zero00-server.onrender.com/api/space/test'

        const errorMessage = 'Network error'
        const globalFetch = vi
            .spyOn(global, 'fetch')
            .mockImplementation((url) => {
                if (url === urlSpace) {
                    return Promise.reject(new Error(errorMessage))
                }
                return Promise.resolve({
                    ok: true,
                    json: async () => ({}),
                } as any)
            })

        initSpace(model, bal, state)

        // Wait for the promise in initSpace to resolve
        await new Promise((resolve) => setTimeout(resolve, 0))

        expect(globalFetch).toHaveBeenCalledWith(urlSpace)

        expect(slv).toHaveBeenCalledWith({
            intBit: { idx: 'init-space-err', dat: errorMessage },
        })

        globalFetch.mockRestore()
    })
})
