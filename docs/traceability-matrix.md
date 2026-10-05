# Complete Requirements Traceability Matrix (RTM)

## Project: CoreBank QA Agent - Fund Transfer Journey (REQ-PAY-FT-001)

| Requirement AC | Business Rule & Description | Risk Level | Test Case ID | Test Category | Target Layer / File | Test Tags | Simulated Status | Defect Link | Quality Gate Impact |
|---|---|---|---|---|---|---|---|---|---|
| **AC-01** | Customer Auth & Active Session | High | `TC-FT-011` | Session / Security | Playwright UI (`fund-transfer.spec.ts`) | `@high @security @session` | PASS (Simulated) | None | Non-blocking if isolated |
| **AC-01** | JWT Token Validity & Expiration | High | `TC-FT-012` | Security / Token | API (`fund-transfer-api.spec.ts`) | `@high @security @jwt` | PASS (Simulated) | None | Blocking if auth bypassed |
| **AC-02** | Source Account Status Active | High | `TC-FT-005` | State Validation | API (`fund-transfer-api.spec.ts`) | `@critical @negative @account-state` | PASS (Simulated) | None | Release Blocking |
| **AC-03** | Beneficiary Status Active | High | `TC-FT-004` | Beneficiary Check | Playwright UI & API | `@high @negative @beneficiary` | PASS (Simulated) | None | Release Blocking |
| **AC-04** | Transfer Amount > 0 & Precision | High | `TC-FT-006` | Boundary / Schema | Playwright UI & API | `@high @boundary @input-validation` | PASS (Simulated) | None | Release Blocking |
| **AC-04** | Sub-Zero Negative Amount Rejection | High | `TC-FT-007` | Boundary / Currency | API (`fund-transfer-api.spec.ts`) | `@medium @boundary @currency` | PASS (Simulated) | None | Non-blocking |
| **AC-04** | Minimum Currency Unit ($0.01) | High | `TC-FT-020` | Boundary / Precision | Playwright UI & API | `@high @boundary @precision` | PASS (Simulated) | None | Release Blocking |
| **AC-05** | Available Balance Verification | Critical | `TC-FT-001` | Happy Path / E2E | UI, API, Reconciliation | `@smoke @critical @happy-path` | PASS (Simulated) | None | Release Blocking |
| **AC-05** | Insufficient Funds Rejection | Critical | `TC-FT-002` | Financial Guardrail | Playwright UI & API | `@critical @negative @financial-guardrail` | PASS (Simulated) | None | Release Blocking |
| **AC-05** | Legacy Teller Balance Check | Medium | `TC-FT-017` | Legacy Compatibility | Selenium (`SeleniumBankingAdapter.ts`)| `@legacy @selenium @admin-portal` | PASS (Simulated) | None | Non-blocking |
| **AC-06** | Daily Cumulative Limit Check | Critical | `TC-FT-003` | Boundary / Limit | Playwright UI & API | `@high @boundary @limit-check` | PASS (Simulated) | None | Release Blocking |
| **AC-07** | UI Multi-Click Debounce | Critical | `TC-FT-008` | Concurrency / UI | Playwright UI (`fund-transfer.spec.ts`) | `@critical @concurrency @ui-debounce` | PASS (Simulated) | None | Release Blocking |
| **AC-07** | Duplicate Idempotency Replay | Critical | `TC-FT-009` | Idempotency / Fin | API & Reconciliation | `@critical @idempotency @ledger-integrity` | **FAILED (Simulated)** | `DEF-FT-2026-001` | **DO NOT RELEASE** |
| **AC-07** | Parallel Balance Depletion Race | Critical | `TC-FT-010` | Concurrency / Lock | API & Reconciliation | `@critical @concurrency @race-condition`| PASS (Simulated) | None | Release Blocking |
| **AC-08** | Global Unique Txn Reference | Critical | `TC-FT-018` | Data Integrity | API & Reconciliation | `@critical @data-integrity` | PASS (Simulated) | None | Release Blocking |
| **AC-09** | Atomic Debit / Credit Integrity | Critical | `TC-FT-013` | Fault Tolerance | API & Reconciliation | `@critical @saga @reversal @resilience` | PASS (Simulated) | None | Release Blocking |
| **AC-09** | Non-Disruptive Failure UI UX | Medium | `TC-FT-019` | UX / Error Handling | Playwright UI (`fund-transfer.spec.ts`) | `@medium @ux @security` | PASS (Simulated) | None | Non-blocking |
| **AC-10** | Automated Saga Reversal | Critical | `TC-FT-014` | Reversal / Recovery | API & Reconciliation | `@critical @accounting @suspense` | PASS (Simulated) | None | Release Blocking |
| **AC-10** | Unrecoverable Suspense Routing | Critical | `TC-FT-015` | Compliance / Audit | Reconciliation Engine | `@critical @accounting @suspense` | PASS (Simulated) | None | Release Blocking |
| **AC-11** | Immutable Audit Trail Logging | High | `TC-FT-016` | Compliance / Audit | API & DB Audit Stream | `@high @compliance @audit` | PASS (Simulated) | None | Release Blocking |
| **AC-12** | PII Masking & Token Redaction | Critical | `TC-FT-020` | Security / Privacy | Playwright, API & Recon Loggers | `@critical @security @pii-masking` | PASS (Simulated) | None | Release Blocking |

---

## Traceability Metrics Summary
- **Total Acceptance Criteria Covered:** 12 / 12 (100.0%)
- **Total Mapped Test Cases:** 20 Test Scenarios
- **Critical Risk Tests:** 11 (55.0%)
- **High Risk Tests:** 7 (35.0%)
- **Medium/Low Risk Tests:** 2 (10.0%)
- **Simulated Execution Status:** 19 Passed, 1 Failed (`TC-FT-009` Duplicate Debit Defect)
- **Quality Gate Outcome:** **`DO NOT RELEASE`** triggered by `DEF-FT-2026-001` (Critical Financial Integrity Violation)
