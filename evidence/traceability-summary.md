# Evidence Item 9: Requirements Traceability Summary

## Traceability Scope: Fund Transfer Journey (REQ-PAY-FT-001)

---

## 1. Traceability Metrics

```text
======================================================================
                 TRACEABILITY COVERAGE SUMMARY                        
======================================================================
Total Business Acceptance Criteria:    12
Total Generated Test Cases:            20
Traceability Coverage Percentage:      100.0%

Risk Distribution:
  - Critical / P0:                     11 (55.0%)
  - High / P1:                          7 (35.0%)
  - Medium / P2:                        2 (10.0%)
  - Low / P3:                           0 (0.0%)

Layer Distribution:
  - Modern Playwright UI:               9 tests
  - Payments API Suite:                13 tests
  - General Ledger Reconciliation:      8 tests
  - Legacy Selenium Adapter:            1 test
  - Audit & Telemetry Scrubbers:        2 tests

Defect Traceability Linkage:
  - REQ-PAY-FT-001 (AC-05, AC-07) -> TC-FT-009 -> DEF-FT-2026-001 -> GATED
======================================================================
```

---

## 2. Acceptance Criteria Mapping Status

| AC ID | Rule / Description | Risk | Mapped Tests | Coverage Status |
|---|---|---|---|---|
| **AC-01** | Customer Authentication & Session | High | `TC-FT-011`, `TC-FT-012` | 100% |
| **AC-02** | Source Account Active | High | `TC-FT-005` | 100% |
| **AC-03** | Beneficiary Active | High | `TC-FT-004` | 100% |
| **AC-04** | Transfer Amount > 0 & Precision | High | `TC-FT-006`, `TC-FT-007`, `TC-FT-020` | 100% |
| **AC-05** | Available Balance Check | Critical | `TC-FT-001`, `TC-FT-002`, `TC-FT-017` | 100% |
| **AC-06** | Daily Cumulative Limit Check | Critical | `TC-FT-003` | 100% |
| **AC-07** | Duplicate & Idempotency Check | Critical | `TC-FT-008`, `TC-FT-009`, `TC-FT-010` | 100% |
| **AC-08** | Unique Transaction Reference | Critical | `TC-FT-001`, `TC-FT-018` | 100% |
| **AC-09** | Atomicity / No Incorrect Debit | Critical | `TC-FT-013`, `TC-FT-019` | 100% |
| **AC-10** | Partial Failure Saga Reversal | Critical | `TC-FT-014`, `TC-FT-015` | 100% |
| **AC-11** | Audit Trail Event Emission | High | `TC-FT-016` | 100% |
| **AC-12** | Sensitive Data Masking & PII | Critical | `TC-FT-020` | 100% |
