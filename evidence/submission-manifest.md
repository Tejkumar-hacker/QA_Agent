# Evidence Item 12: Final Submission Manifest & Artifact Classification

## Package Name: CoreBank QA Agent - Submission Artifact Package
## Submission Version: v1.0.0-poc
## Release Date: 2026-10-05
## Author: Tej Kumar Jajula
## Final Recommendation: READY FOR GITHUB VERIFICATION

---

## 1. Submission Artifact Manifest

| File Path | Document Category | Primary Purpose | Validation Status | Sensitivity Classification | Simulation Status | Included in Package |
|---|---|---|---|---|---|---|
| `submission/README.md` | Overview & Setup | Quickstart guide, architecture overview & instructions | Verified | Public Submission | Documentation | **Included** |
| `RELEASE_NOTES.md` | Release Governance | Formal release notes for v1.0.0-poc | Verified | Public Submission | Documentation | **Included** |
| `.github/workflows/corebank-qa-agent.yml` | CI/CD Workflow | Primary GitHub Actions CI/CD workflow | Verified Locally | Public Submission | Automation | **Included** |
| `pipelines/azure-pipelines.yml` | CI/CD Pipeline (Legacy) | Optional reference Azure DevOps pipeline | Verified | Internal Technical | Pipeline | **Included** |
| `white-paper/CoreBank-QA-Agent-White-Paper.md` | White Paper | Full 30-section technical white paper | Verified | Public Submission | Methodological | **Included** |
| `white-paper/assets/corebank-qa-agent-architecture.svg` | Diagram Asset | Conceptual solution architecture visual | Verified | Public Submission | Diagram | **Included** |
| `white-paper/assets/quality-gate-decision.svg` | Diagram Asset | Quality gate decision flow visual | Verified | Public Submission | Diagram | **Included** |
| `presentation/CoreBank-QA-Agent-Presentation.md` | Executive Presentation | 12-slide briefing with speaker notes | Verified | Public Submission | Presentation | **Included** |
| `presentation/demo-script.md` | Demonstration Script | 8-to-10 minute repeatable demo walkthrough | Verified | Public Submission | Script | **Included** |
| `requirements/fund-transfer-requirement.md` | Requirement Spec | REQ-PAY-FT-001 (12 Acceptance Criteria) | Verified | Internal Technical | Requirement | **Included** |
| `config/risk-rules.json` | Risk Configuration | 5-factor mathematical risk weighting formula | Verified | Internal Technical | Configuration | **Included** |
| `config/environments.example.json` | Config Template | Non-prod environment configuration template | Verified | Configuration Template | Template | **Included** |
| `prompts/requirement-analysis-prompt.md` | AI Prompt | Prompt for requirement & ambiguity extraction | Verified | Internal Technical | Prompt | **Included** |
| `prompts/test-generation-prompt.md` | AI Prompt | Prompt for multi-layer test synthesis | Verified | Internal Technical | Prompt | **Included** |
| `prompts/failure-analysis-prompt.md` | AI Prompt | Prompt for root-cause triage & defect creation | Verified | Internal Technical | Prompt | **Included** |
| `schemas/transfer-api-schema.json` | API Schema | Draft-07 JSON Schema response contract | Verified | Internal Technical | Contract | **Included** |
| `test-data/synthetic/synthetic-test-data.json` | Synthetic Test Data | Masked synthetic accounts and scenarios | Verified | Simulated Evidence | Synthetic Data | **Included** |
| `input/sample-pass.json` | Client Input Sample | Valid synthetic pass scenario | Verified | Simulated Evidence | Synthetic Data | **Included** |
| `input/sample-duplicate-debit.json` | Client Input Sample | Duplicate debit anomaly scenario | Verified | Simulated Evidence | Synthetic Data | **Included** |
| `input/sample-batch.csv` | Client Input Sample | Multi-row batch CSV scenario | Verified | Simulated Evidence | Synthetic Data | **Included** |
| `pages/FundTransferPage.ts` | Source Code | Playwright Page Object Model | Verified | Source Code | Source | **Included** |
| `tests/fund-transfer-test-catalog.md` | Test Catalog | 20 detailed risk-ranked test specifications | Verified | Internal Technical | Catalog | **Included** |
| `tests/ui/playwright/fund-transfer.spec.ts` | Automated Test | Playwright UI E2E test suite | Verified | Source Code | Executable | **Included** |
| `tests/api/fund-transfer-api.spec.ts` | Automated Test | Payments API & contract test suite | Verified | Source Code | Executable | **Included** |
| `tests/legacy-ui/selenium/SeleniumBankingAdapter.ts` | Source Code | Isolated Selenium adapter for legacy portals | Verified | Source Code | Adapter | **Included** |
| `tests/reconciliation/CoreBankReconciliationEngine.ts` | Source Code | Double-entry ledger balance reconciler | Verified | Source Code | Source | **Included** |
| `tests/reconciliation/validate-ledger.ts` | Unit Test Harness | 7-fixture reconciliation unit test suite | Verified | Source Code | Executable | **Included** |
| `tests/unit/client-engine.spec.ts` | Unit Test Harness | 12-test client evaluation engine suite | Verified | Source Code | Executable | **Included** |
| `scripts/CoreBankClientEngine.ts` | Source Code | Client dataset evaluation & reconciliation engine | Verified | Source Code | Executable | **Included** |
| `scripts/run-agent.ts` | Source Code | Single-command CLI runner | Verified | Source Code | Executable | **Included** |
| `scripts/evaluate-quality-gate.ts` | Evaluation Engine | 9-case quality gate decision matrix harness | Verified | Source Code | Executable | **Included** |
| `scripts/simulate-execution.ts` | Simulation Harness | Prototype execution & duplicate-debit runner | Verified | Source Code | Executable | **Included** |
| `reports/defect-DEF-FT-2026-001.md` | Defect Report | Sanitized critical duplicate debit defect report | Verified | Simulated Evidence | Simulated Defect | **Included** |
| `docs/architecture.md` | Architecture Spec | Solution architecture & component design | Verified | Internal Technical | Documentation | **Included** |
| `docs/governance.md` | Governance Policy | Safety guardrails & human-in-the-loop policy | Verified | Internal Technical | Policy | **Included** |
| `docs/traceability-matrix.md` | Traceability Matrix | 100% Acceptance Criteria to Test Mapping | Verified | Internal Technical | Traceability | **Included** |
| `docs/security-validation-report.md` | Audit Report | Secret scanning & PII masking report | Verified | Internal Technical | Audit | **Included** |
| `evidence/repository-validation-report.md` | Evidence Report | File inventory & dependency audit | Verified | Simulated Evidence | Evidence | **Included** |
| `evidence/build-validation-report.md` | Evidence Report | TypeScript compilation results (0 errors) | Verified | Simulated Evidence | Evidence | **Included** |
| `evidence/test-discovery-report.md` | Evidence Report | Playwright test discovery report (7 tests) | Verified | Simulated Evidence | Evidence | **Included** |
| `evidence/simulated-execution-report.md` | Evidence Report | Prototype simulation log (20 scenarios) | Verified | Simulated Evidence | Evidence | **Included** |
| `evidence/quality-gate-result.json` | Machine Artifact | Machine-readable JSON quality gate output | Verified | Simulated Evidence | Machine Data | **Included** |
| `evidence/quality-gate-result.md` | Evidence Report | Human-readable quality gate evaluation | Verified | Simulated Evidence | Evidence | **Included** |
| `evidence/sanitized-defect-report.md` | Evidence Report | Copy of DEF-FT-2026-001 report | Verified | Simulated Evidence | Evidence | **Included** |
| `evidence/security-validation-report.md` | Evidence Report | Security & privacy scan summary | Verified | Simulated Evidence | Evidence | **Included** |
| `evidence/traceability-summary.md` | Evidence Report | Requirements traceability metrics summary | Verified | Simulated Evidence | Evidence | **Included** |
| `evidence/assumptions-and-limitations.md` | Evidence Report | Scope, constraints & limitations | Verified | Simulated Evidence | Evidence | **Included** |
| `evidence/implementation-status.md` | Evidence Report | Component implementation matrix | Verified | Simulated Evidence | Evidence | **Included** |
| `evidence/final-independent-validation.md` | Evidence Report | 15-check consistency audit report | Verified | Simulated Evidence | Evidence | **Included** |
| `evidence/github-actions-validation.md` | Evidence Report | GitHub Actions CI/CD migration report | Verified Locally | Simulated Evidence | Evidence | **Included** |
| `evidence/github-pass-run.md` | Evidence Report | GitHub Actions PASS workflow specification | Verified Locally | Simulated Evidence | Evidence | **Included** |
| `evidence/github-blocked-run.md` | Evidence Report | GitHub Actions blocked workflow specification | Verified Locally | Simulated Evidence | Evidence | **Included** |
| `evidence/github-artifact-publication.md` | Evidence Report | Artifact upload specification | Verified Locally | Simulated Evidence | Evidence | **Included** |
| `evidence/github-human-review-configuration.md` | Evidence Report | Protected human-review setup guide | Verified Locally | Simulated Evidence | Evidence | **Included** |
| `evidence/github-migration-independent-validation.md` | Audit Report | 18-point GitHub migration independent audit | Verified Locally | Simulated Evidence | Evidence | **Included** |
| `evidence/submission-manifest.md` | Manifest | Complete file manifest & classifications | Verified | Public Submission | Manifest | **Included** |

---

## 2. Excluded Sensitive & Heavy Materials

| Excluded Item | Reason for Exclusion | Enforcement Mechanism |
|---|---|---|
| `node_modules/` | Build dependencies (re-installable via `npm install`) | `.gitignore` / Archive Filter |
| `.env` / `.env.local` | Sensitive environment files | `.gitignore` / Linter Scan |
| Production Credentials | Prohibited in QA proof of concept | Secret Linter (`0` findings) |
| Real Customer Records / PII | Regulatory violation (PCI-DSS / GDPR) | PII Masking Standard (`XXXXXXXX1234`) |
| Production Endpoints | Prohibited (Isolated non-prod only) | Domain Whitelist (`*.internal`) |
| Unsanitized Traces / Dumps | Risk of accidental token exposure | Redaction Pipeline (`[REDACTED]`) |
| Build Caches / Temp Files | Workspace cleanliness | Compiler Output Filter |
