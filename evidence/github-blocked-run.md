# Evidence Item 16: GitHub Actions Simulated Blocked (DO NOT RELEASE) Run Specification

## Notice
> **SIMULATED SPECIFICATION / LOCAL LOGIC VERIFIED**  
> Configuration verified locally. Actual remote GitHub execution requires repository deployment.

---

## 1. Scenario Metadata
- **Scenario ID:** `GH-RUN-SCENARIO-BLOCKED`
- **Target Workflow:** `.github/workflows/corebank-qa-agent.yml`
- **Trigger:** `workflow_dispatch` with `input_file: input/sample-duplicate-debit.json`
- **Execution Mode:** `SIMULATED`
- **Data Classification:** `SYNTHETIC`

---

## 2. Expected Workflow Execution Trace

```text
[validate-framework job]
  ✔ actions/checkout@v4
  ✔ actions/setup-node@v4 (Node 22)
  ✔ npm ci
  ✔ npm run typecheck (0 errors)
  ✔ npm run validate (12/12 client, 7/7 recon, 9/9 quality-gate passed)

[evaluate-client-data job]
  ✔ actions/checkout@v4
  ✔ actions/setup-node@v4 (Node 22)
  ✔ npm ci
  ✔ Resolve input: 'input/sample-duplicate-debit.json' (VALIDATED)
  ✔ Run Agent: npm run agent -- --input input/sample-duplicate-debit.json --output results/github-run-102-1
      Agent Exit Code: 3
      Recommendation:  DO_NOT_RELEASE
      Request ID:      CLIENT-TEST-001
      Findings:        DUPLICATE_DEBIT, BALANCE_MISMATCH
  ✔ Generate $GITHUB_STEP_SUMMARY: Published with warning banners
  ✔ actions/upload-artifact@v4: 'corebank-agent-results-102-1' uploaded (retention: 30 days)
      Uploaded: defect-report.md, result-summary.md, quality-gate-result.json
  ✖ Enforce Quality Gate Policy: Exit Code 3 -> QUALITY GATE BLOCKED: DO NOT RELEASE (Red/Failed)

[human-review-gate job]
  - SKIPPED / BLOCKED (Workflow failed; deployment blocked)
```

---

## 3. Policy Enforcement Assessment
- **Workflow Exit Code:** `3` (Quality Gate Blocked)
- **Quality Gate Recommendation:** **`DO NOT RELEASE`**
- **Evidence Integrity:** Complete sanitized defect report and reconciliation logs uploaded prior to workflow step failure.
- **Safety Outcome:** Release progression halted immediately.
