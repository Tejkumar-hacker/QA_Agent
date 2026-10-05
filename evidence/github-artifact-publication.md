# Evidence Item 17: GitHub Actions Artifact Publication Specification

## Notice
> **SIMULATED SPECIFICATION / LOCAL LOGIC VERIFIED**  
> Configuration verified locally. Actual remote GitHub execution requires repository deployment.

---

## 1. Artifact Configuration

| Property | Value |
|---|---|
| **Action** | `actions/upload-artifact@v4` |
| **Artifact Name Format** | `corebank-agent-results-${{ github.run_number }}-${{ github.run_attempt }}` |
| **Source Path** | `results/` |
| **Execution Condition** | `if: always()` (Guarantees upload even when test/gate fails) |
| **Retention Period** | `30 days` |
| **Missing Output Policy** | `if-no-files-found: warn` |

---

## 2. Artifact Directory Structure

```text
corebank-agent-results-<run>-<attempt>/
└── <requestId>/
    ├── input-validation.json       # Schema, PII masking & token validation log
    ├── reconciliation-result.json  # Double-entry balance deltas & variances
    ├── quality-gate-result.json    # Machine-readable recommendation artifact
    ├── result-summary.md           # Markdown report table
    └── defect-report.md            # Detailed defect report (if anomalies present)
```

---

## 3. Security Exclusions Confirmed
- No `.env` or configuration secrets.
- No `node_modules` or runtime dependencies.
- No unmasked 10-16 digit account numbers (`XXXXXXXX1234` only).
- No unredacted authorization tokens (`[REDACTED]` only).
