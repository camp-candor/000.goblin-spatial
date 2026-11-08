1. **Create `packages/301.spatial/98.menu.unit/buz/03.los-menu.buzz.ts`:**
    - Use `write_file` to create the action file exporting `createLoSVisualizerAction()`.
    - Inside, implement `execute` integrating `traceFiniteSupercover` (from `41.segment.unit`), `evaluateRayVertexCrossings` (from `17.observer.unit`), and `computeOpticalTransmission` (from `40.witness.unit`).
    - The action evaluates a raycast from `(0, -2)` to `(0, 2)`. It formats a tactical 7-bit ASCII hex grid (Radius 3) with `[O]`, `[T]`, `[*]`, `[X]`, and `[#]`, tracking cell blockages, and emits telemetry and an `ASCII_FRAME_RENDER` event.
2. **Verify `03.los-menu.buzz.ts`:**
    - Use `read_file` to verify the content.
3. **Update `packages/301.spatial/val/000.spatial.pvt.tsx`:**
    - Use `replace_with_git_merge_diff` to add the new action to the cockpit harness and subscribe to `ASCII_FRAME_RENDER`.
4. **Verify `000.spatial.pvt.tsx`:**
    - Use `read_file` to verify the changes.
5. **Create `packages/301.spatial/test/los-menu.test.ts`:**
    - Use `write_file` to add a test suite that checks the catalog action registration, 7-bit ASCII tactical lattice rendering, 2ms execution profiling, and interactive cockpit telemetry frame updates.
6. **Verify `los-menu.test.ts`:**
    - Use `read_file` to verify the content.
7. **Perform zero-float, 7-bit ASCII and cleanroom scans:**
    - Use `run_in_bash_session` to execute `find packages/301.spatial -name "*.js" -o -name "*.d.ts"`, verify 0 float math usage, and check for absence of multi-byte UTF-8 emojis.
8. **Test execution and boundary check:**
    - Execute `npx vitest run packages/301.spatial/test/los-menu.test.ts`.
    - Run `npm run check:boundary`.
9. **Run workspace-wide tests:**
    - Execute `npm run test` using `run_in_bash_session` to verify no regressions.
10. **Update Progress Checkbox:**
    - Use `run_in_bash_session` to read and update `data/directive/day-002/016.phase-eight.jules.md`.
    - Update progress status to `[🟢 Complete - <Date>]` and append the explicit halt statement if checks pass.
11. **Pre-commit step:**
    - Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.
12. **Submit changes:**
    - Submit the workspace.
