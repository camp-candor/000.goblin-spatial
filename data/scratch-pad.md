
## Phase 1: Workspace Provisioning & Unsigned Bit-Packed Axial Identity (`packages/001.spatial`)

**Phase Objective:** Provision the `packages/001.spatial` workspace following the `PACKAGE_TEMPLATE_FILES` exemplar in `05.package.unit/buz/package.buzz.ts`, and implement negative-safe, monotonic 32-bit cell packing and 64-bit commutative edge packing with zero string allocation.

-Task 1.1: Scaffold the `packages/001.spatial` Workspace & Project References**
-Task 1.2: Author Branded Integer Primitives & Domain Interfaces**
-Task 1.3: Implement Monotonic Unsigned 32-Bit Cell Packing & 64-Bit Commutative Edge Keys**
-Task 1.4: Verify Bit-Packing Bijection & Lexicographical Monotonicity**

---

## Phase 2: Doubled Coordinate Affine Transformation & Axial Topology (`packages/001.spatial`)

**Phase Objective:** Implement the doubled integer affine lattice $(4q + 2r, 6r)$, polygon vertex/edge generators, and pure axial distance/ring/disk topology primitives inside `01.lattice.unit`.

-Task 2.1: Implement Doubled Affine Coordinate Projectors (`hexCentroid`, `hexVertices`, `hexEdges`)**
-Task 2.2: Implement Non-Euclidean Axial Distance & Topological Disks (`d_axial`, `neighbors`, `ring`, `range`)
-Task 2.3: Verify Affine Tiling Coincidence & Metric Space Axioms**

## Phase 3: 2D Integer Cross-Product Supercover & `EDGE_PAIR` Line-of-Sight Engine (`packages/001.spatial`)

**Phase Objective:** Implement the exact 2D integer cross-product segment-intersection predicates, parametric rational ordering of crossed features (`CELL_INTERIOR`, `EDGE`, `VERTEX`), and the `EDGE_PAIR` boundary resolution policy inside `02.supercover.unit`.

* **Task 3.1: Implement Exact 2D Integer Cross-Product & Segment Intersection Predicates**
* **Task 3.2: Implement Exact Parametric Supercover Feature Extraction & Rational Sorting**
* **Task 3.3: Implement the `EDGE_PAIR` Boundary Resolution Policy & Dynamic Overlay Merger**

## Phase 4: The 8,190-Pair Continuous Rational Oracle & Cockpit Integration (`packages/001.spatial` & `apps/worker`)

**Phase Objective:** Construct the independent `BigInt` rational-arithmetic reference raytracer, execute the 8,190-pair radius-5 verification gauntlet, wire the Blessed cockpit menu in `packages/001.spatial`, and expose the TypeBox-validated edge tool in `apps/worker/src/tools.custom.ts`.

* **Task 4.1: Build the Independent `BigInt` Rational Reference Raytracer & 8,190-Pair Oracle Suite**
* **Task 4.2: Wire `00.spatial.unit`, `98.menu.unit`, and `BEE.ts` Manifest inside `packages/001.spatial**`
* **Task 4.3: Register Pluggable Edge Domain Tools in `apps/worker/src/tools.custom.ts**`
* **Task 4.4: Execute Static Zero-IO Guard & Full Monorepo Verification Gauntlet**
