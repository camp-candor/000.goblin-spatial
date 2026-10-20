import { expect, test } from 'vitest'
import * as Import from './BEE.js'

test('002.space list test', () => {
    expect(Import.list).toBeDefined()
})
