1. **Initialize missing files in `packages/301.spatial/42.receipt.unit/`**:
   - `fce/receipt.interface.ts`
   - `val/receipt.model.ts`
   - `fce/receipt.bit.ts`
   - `receipt.action.ts`
   - `receipt.model.ts`
   - `buz/receipt.buzz.ts`
   - `receipt.buzzer.ts`
   - `receipt.reduce.ts`
   - `receipt.unit.ts`
   - `test/receipt.test.ts` All files must strictly follow the structures and
     behaviors defined in the `045.phase-four.jules.md` directive.

2. **Verify Types & Compile Output**:
   - Ensure all TS types compile cleanly by running `npm run check:types`.
   - Ensure no `.js` or `.d.ts` artifacts are leaking outside of `dist` paths.

3. **Verify Constraints**:
   - Ensure `packages/301.spatial/src` does not exist.
   - Ensure `packages/301.spatial/42.receipt.unit/` is strictly 7-bit clean
     ASCII.
   - Run tests specifically via
     `npx vitest run packages/301.spatial/42.receipt.unit/test/receipt.test.ts`.

4. **Verify Regressions**:
   - Run `npm run test` to verify regressions.

5. **Complete pre-commit steps to ensure proper testing, verification, review,
   and reflection are done**:
   - Run `pre_commit_instructions` via `run_in_bash_session`.

6. **Submit**:
   - Commit the changes and open PR.
