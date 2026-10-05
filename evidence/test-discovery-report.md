# Evidence Item 3: Test Discovery & Specification Catalog Report

## Discovery Execution Date: 2026-10-05
## Runner: Playwright Test Discovery Engine (v1.43.0)

---

## 1. Discovered Playwright Automated Specs

```text
Listing tests:
  [ui-chromium] › ui/playwright/fund-transfer.spec.ts:45:7 › CoreBank UI Fund Transfer - Playwright Automation Suite › TC-FT-001: [Happy Path] Complete Fund Transfer with Valid Balance @ui @smoke @critical
  [ui-chromium] › ui/playwright/fund-transfer.spec.ts:57:7 › CoreBank UI Fund Transfer - Playwright Automation Suite › TC-FT-002: [Negative] Transfer Exceeding Available Balance Displays Inline Error @ui @critical
  [ui-chromium] › ui/playwright/fund-transfer.spec.ts:66:7 › CoreBank UI Fund Transfer - Playwright Automation Suite › TC-FT-008: [Concurrency] Rapid Multi-Click UI Debounce Test @ui @critical
  [api] › api/fund-transfer-api.spec.ts:14:7 › CoreBank Payments API - Financial & Negative Assertions › TC-FT-001 (API): Valid Fund Transfer & Contract Schema Validation @api @critical @smoke
  [api] › api/fund-transfer-api.spec.ts:43:7 › CoreBank Payments API - Financial & Negative Assertions › TC-FT-009 (API): Duplicate Idempotency Key Returns Same Record Without Double Debit @api @critical
  [api] › api/fund-transfer-api.spec.ts:72:7 › CoreBank Payments API - Financial & Negative Assertions › TC-FT-006 (API): Negative & Zero Amount Boundary Rejection @api @high
  [api] › api/fund-transfer-api.spec.ts:85:7 › CoreBank Payments API - Financial & Negative Assertions › TC-FT-012 (API): Expired JWT Token Rejection @api @high @security
Total: 7 automated executable tests discovered across 2 project profiles (ui-chromium, api).
```

---

## 2. Test Catalog Distribution Summary (20 Scenarios)

| Layer / Engine | Test Case IDs | Count | Tags |
|---|---|---|---|
| **Modern UI (Playwright)** | `TC-FT-001`, `TC-FT-002`, `TC-FT-003`, `TC-FT-004`, `TC-FT-006`, `TC-FT-008`, `TC-FT-011`, `TC-FT-019`, `TC-FT-020` | 9 | `@ui @smoke @critical @concurrency` |
| **Payments API Contract & Idempotency** | `TC-FT-001`, `TC-FT-002`, `TC-FT-003`, `TC-FT-004`, `TC-FT-005`, `TC-FT-006`, `TC-FT-007`, `TC-FT-009`, `TC-FT-010`, `TC-FT-012`, `TC-FT-013`, `TC-FT-018`, `TC-FT-020` | 13 | `@api @critical @high @security` |
| **Financial Ledger Reconciliation** | `TC-FT-001`, `TC-FT-005`, `TC-FT-009`, `TC-FT-010`, `TC-FT-013`, `TC-FT-014`, `TC-FT-015`, `TC-FT-018` | 8 | `@critical @reconciliation @ledger-integrity` |
| **Legacy Selenium Adapter** | `TC-FT-017` | 1 | `@legacy @selenium @admin-portal` |
| **Audit & Privacy Telemetry** | `TC-FT-016`, `TC-FT-019` | 2 | `@compliance @audit @pii-masking` |

*(Note: Multi-layer scenarios such as `TC-FT-001` span UI, API, and Reconciliation simultaneously).*
