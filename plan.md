1. **Define Ledger Models**:
   - Run a bash script to overwrite `packages/301.spatial/19.ledger.unit/val/ledger.model.ts` with Zod schemas for `Sha256HashSchema`, `SpatialAuditQuadrupleSchema`, and `SpatialLedgerEntrySchema`, enforcing `.strict()` and zero-float invariants. Includes constants `DEFAULT_KERNEL_VERSION` ("0.1.0") and `GENESIS_PREFIX` ("GOBLIN-SPATIAL-GENESIS::").

2. **Define Ledger Interfaces**:
   - Run a bash script to write `packages/301.spatial/19.ledger.unit/fce/ledger.interface.ts` with TypeScript definitions for `SpatialAuditQuadruple`, `SpatialLedgerEntry`, `HashChainVerificationResult`, and `LedgerLoggerOptions`, preserving ESM imports if needed.

3. **Implement Ledger Business Logic**:
   - Run a bash script to overwrite `packages/301.spatial/19.ledger.unit/buz/ledger.buzz.ts`. This file will use `node:crypto` to implement `canonicalizeJCS` (rejecting floats), `sha256Hex`, `computeGenesisHash`, `mintEntryHash`, and `SpatialLedgerLogger` class along with `verifyLedgerIntegrity` method. Existing initialization exports (`initLedger`, `updateLedger`) will be retained.

4. **Implement Unit Tests**:
   - Run a bash script to write `packages/301.spatial/test/ledger.test.ts`. Tests will cover RFC 8785 lexicographical key sorting, float rejection, hash chain verification, `.ndjson` export, and deep freezing.

5. **Verify Implementation Files**:
   - Run `cat` on `ledger.model.ts`, `ledger.interface.ts`, `ledger.buzz.ts`, and `ledger.test.ts` to confirm correct file generation and contents.

6. **Execute Verification Checks**:
   - Run `npm run test` for the workspace to ensure tests pass.
   - Run `npx vitest run packages/301.spatial/test/ledger.test.ts` directly.
   - Run static analysis commands for pure 7-bit ASCII compliance: `git diff HEAD -- packages/301.spatial/19.ledger.unit/ packages/301.spatial/test/ledger.test.ts | grep -P "[^\x00-\x7F]"`.
   - Run static scan for Zero-Float AST: `grep -En "Math\.(sin|cos|sqrt|round)" packages/301.spatial/19.ledger.unit/`.
   - Run pure Zod architecture check: `grep -rn "@sinclair/typebox" packages/301.spatial/19.ledger.unit/`.

7. **Pre-commit**:
   - Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.

8. **Finalize**:
   - Use `sed` or bash to update `data/directive/day-002/028.phase-fourteen.jules.md` to `[🟢 Complete - <Date>]` and append the halt statement.
   - Run the submit tool.
