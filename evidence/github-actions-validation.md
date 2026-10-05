# Evidence Item 14: GitHub Actions Workflow Validation & CI/CD Migration Report

## Document Metadata
- **Audit Date:** 2026-10-05
- **Primary CI/CD Platform:** GitHub Actions (`.github/workflows/corebank-qa-agent.yml`)
- **Legacy CI/CD Platform Reference:** Azure DevOps (`pipelines/azure-pipelines.yml`)
- **Workflow Configuration Status:** **READY FOR GITHUB VERIFICATION**
- **Actual Remote GitHub Execution:** **NOT VERIFIED** (Requires pushing to remote GitHub repository)

---

## 1. Migration Summary
GitHub Actions has been configured as the primary CI/CD platform for the CoreBank QA Agent. The configuration encapsulates both continuous integration framework checks and on-demand client synthetic data evaluations with strict quality-gate enforcement and protected human review routing.

```text
Client Synthetic Data (JSON / CSV)
                │
                ▼
       GitHub Actions Workflow
       (.github/workflows/corebank-qa-agent.yml)
                │
                ▼
      validate-framework Job
      (TypeScript Typecheck + Unit Tests)
                │
                ▼
      evaluate-client-data Job
      (Single-Command Agent: npm run agent)
                │
                ▼
      Reconciliation & Invariant Check
                │
                ▼
    Evidence Artifact Upload (actions/upload-artifact@v4)
                │
                ▼
     Quality-Gate Policy Enforcement
      ┌─────────────┼─────────────┐
      ▼             ▼             ▼
     PASS     PASS_WITH_RISK  DO_NOT_RELEASE / INPUT_REJECTED
  (Success)         │         (Workflow Failed & Blocked)
                    ▼
          human-review-gate Job
          (corebank-human-review Environment)
```

---

## 2. GitHub Actions Workflow Configuration Details

| Property | Value | Notes |
|---|---|---|
| **Workflow Name** | `CoreBank QA Agent` | Primary CI/CD pipeline |
| **Workflow File** | `.github/workflows/corebank-qa-agent.yml` | Validated YAML structure |
| **Triggers** | `push` (main), `pull_request` (main), `workflow_dispatch` | Manual trigger accepts `input_file` & `execution_label` |
| **Node.js Runtime** | Node.js `22` (Active LTS) | Configured with `cache: 'npm'` |
| **Runner OS** | `ubuntu-latest` | Clean Ubuntu virtual environment |
| **Security Permissions** | `contents: read` | Principle of least privilege (no write permissions) |
| **Artifact Retention** | `30 days` | Uploads `results/` artifacts via `actions/upload-artifact@v4` |
| **Human Review Gate** | Protected GitHub Environment: `corebank-human-review` | Triggered exclusively on `PASS_WITH_RISK` |

---

## 3. Input Path Security & Protections
The workflow enforces strict safety constraints on the `input_file` parameter:
- **Folder Whitelist:** Must reside strictly inside the `input/` folder.
- **Extension Whitelist:** Only `.json` and `.csv` extensions are allowed.
- **Path Traversal Protection:** Parent traversal (`../`) and absolute paths (`/`, `C:\`) are rejected immediately with exit code 2 (`INPUT_REJECTED`).
- **File Validation:** Non-existent or empty files are rejected before invoking the agent engine.

---

## 4. Quality Gate Exit Code Mapping

| Agent Exit Code | Mapped Recommendation | GitHub Actions Workflow Result | Release Action |
|---|---|---|---|
| **`0`** | `PASS` | **Success** (Green) | Release allowed to proceed |
| **`1`** | `PASS_WITH_RISK` | **Success $\rightarrow$ Routes to Human Gate** | Gated on `corebank-human-review` environment approval |
| **`2`** | `INPUT_REJECTED` | **Failure** (Red) | Blocked immediately |
| **`3`** | `DO_NOT_RELEASE` | **Failure** (Red) | Blocked immediately (Defect artifact preserved) |
| **`4`** | `INCONCLUSIVE` | **Failure** (Red) | Blocked due to missing evidence |
| **`5`** | `INTERNAL_AGENT_ERROR`| **Failure** (Red) | Blocked due to runtime exception |

*Note: Evidence upload is executed with `if: always()` prior to quality-gate step termination, ensuring complete telemetry is captured even when the workflow fails.*

---

## 5. Local Logic Verification (Simulated Runs)

```text
[LOCAL VERIFICATION SUMMARY]
1. TypeScript strict compilation:     0 errors (PASSED)
2. Client Engine Invariant Suite:     12/12 passed (PASSED)
3. Reconciliation Unit Harness:       7/7 passed (PASSED)
4. Quality Gate Matrix:               9/9 passed (PASSED)
5. sample-pass.json:                  Exit Code 0 -> PASS (PASSED)
6. sample-duplicate-debit.json:       Exit Code 3 -> DO NOT RELEASE (PASSED)
7. sample-batch.csv:                  Exit Code 3 -> DO NOT RELEASE (PASSED)
```

---

## 6. Remote GitHub Actions Verification Status
- **Local Workflow Configuration:** **VERIFIED & READY**
- **Actual Remote GitHub Workflow Run:** **NOT VERIFIED** (Requires pushing commits to a live GitHub repository).
- **Human Action Needed:** Push the repository to GitHub and trigger `.github/workflows/corebank-qa-agent.yml` under GitHub Actions.
