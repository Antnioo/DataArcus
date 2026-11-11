## Summary
- **Approval:** TR2, the owner 11 Nov (D-1111-06 "all yes" to TR1's 8 asks; D-1111-11 "go TR2"). Base: `test/0.3.3-tr2` from `origin/integration/0.3.3` 7960ac78. Tests and CI only, no product code. Push only this branch; never merge.
- **Ask 3 (CL-2 reads a saved schema):** `mcp/lab/schema-offline.mjs` answers the validator's https requests for Microsoft's schemas from `mcp/lab/schemas/` (12 files, pinned by sha256 in `pins.json`); `validate()` in `lab/custom-visuals-lab.mjs` loads it. New check CL-2b pins the saved copy and proves the validator read all 12 from it. `lab/refresh-schemas.mjs [--write]` refreshes; `.github/workflows/schemas-refresh.yml` runs it every Monday (artifact and warning, never commits, never gates).
  Red first: on 7960ac78 with the network answering 503 for every https request, the suite fails CL-2 (72 checks, 1 failed: 8 warnings PBIR_SCHEMA_UNREACHABLE, the two false reds of 8 and 10 Nov). With the change and the same blocked network: PASS 73 checks. A saved file with one byte added: CL-2b fails.

## Probe (CO1 C-06, D-1111-07 ask 5)
(filled in at the end)
