# Sample Defect Report: Critical Financial Integrity Breach

## Notice
> **SIMULATED RESULT**  
> This result was generated for proof-of-concept demonstration.  
> It was not produced by execution against a real banking system.  
> No real financial transaction was performed.  
> No real customer data was used.

---

## Header Information
- **Defect ID:** DEF-FT-2026-001
- **Title:** [Payments Core] Concurrent UI submission with same Idempotency Key causes duplicate debit on source account
- **Severity:** Critical (Loss of Financial Integrity)
- **Priority:** P0 (Release Blocking)
- **Environment:** QA-Integration-01 (Build: v2.4.1-rc3)
- **Application Version:** `corebank-payments-service:2.4.1-rc3`
- **Detected By:** CoreBank QA Agent (Automated Execution & Ledger Reconciliation)
- **Requirement Traceability:** REQ-PAY-FT-001 (AC-05, AC-07)
- **Test Case Ref:** `TC-FT-009`, `TC-FT-010`
- **Human Review Requirement:** Mandatory QA Lead & Release CAB sign-off before closure.

---

## Preconditions
1. Source checking account `XXXXXXXX1234` had starting balance: **$5,000.00 USD**.
2. Beneficiary `XXXXXXXX5678` active.
3. Network simulation injected a 450ms lag on the primary database commit transaction.

---

## Steps to Reproduce
1. Submit transfer request of **$250.00 USD** from `XXXXXXXX1234` to `XXXXXXXX5678` with header `X-Idempotency-Key: IDEMP-REPLAY-88219`.
2. Simultaneously submit identical request within 80ms using identical `X-Idempotency-Key`.
3. Query the source account balance and ledger entries after completion.

---

## Expected Result
- System processes only the first transaction, returning HTTP 200 with `transactionRef: TXN-20260510-441029`.
- Second request recognized as duplicate, returns identical transaction payload without re-posting.
- **Source Account Balance:** Debited by exactly **$250.00** $\rightarrow$ Final Balance: **$4,750.00 USD**.
- **General Ledger Entries:** Exactly 1 Debit entry ($250.00) and 1 Credit entry ($250.00). Expected Posting Count: 1.

---

## Actual Result
- Both requests received HTTP 200 responses with two distinct transaction references (`TXN-20260510-441029` and `TXN-20260510-441030`).
- **Source Account Balance:** Debited twice ($250.00 + $250.00) $\rightarrow$ Final Balance: **$4,500.00 USD** (*$250.00 financial deficit*).
- **General Ledger Entries:** Two separate debit entries posted to source ledger against a single credit acknowledgment. Actual Posting Count: 2.

---

## Financial Impact Assessment
- **Monetary Variance:** -$250.00 un-reconciled debit from customer checking account.
- **Ledger Imbalance:** Double debit posted without matching clearing credit.
- **Customer Risk:** Immediate customer overcharge, potential NSF cascades, regulatory compliance breach (CFPB Reg E / OCC).

---

## Sanitized Evidence & Telemetry
```json
{
  "correlationId": "4a7f82b0-9e23-4411-881c-99a2f64e1011",
  "idempotencyKey": "IDEMP-REPLAY-88219",
  "sourceAccountMasked": "XXXXXXXX1234",
  "beneficiaryMasked": "XXXXXXXX5678",
  "requestedAmount": 250.00,
  "currency": "USD",
  "expectedPostingCount": 1,
  "actualPostingCount": 2,
  "observedDebits": [
    { "ref": "TXN-20260510-441029", "amount": 250.00, "timestamp": "2026-05-10T14:22:01.102Z" },
    { "ref": "TXN-20260510-441030", "amount": 250.00, "timestamp": "2026-05-10T14:22:01.182Z" }
  ],
  "reconLedgerVariance": -250.00,
  "reconciliationStatus": "FAILED_OUT_OF_BALANCE",
  "authToken": "[REDACTED]"
}
```

- **Trace Artifact:** `artifacts/traces/tc-ft-009-duplicate-debit-trace.zip` (PII Masked)
- **Ledger Snapshot:** `artifacts/recon/recon-audit-DEF-FT-2026-001.json`

---

## Data Protection Confirmation
- [x] Full 16-digit account numbers masked to last 4 digits (`XXXXXXXX1234`).
- [x] Bearer JWT authentication tokens replaced with `[REDACTED]`.
- [x] Zero production customer data accessed; executed on synthetic test cohort.

---

## Probable Cause & Recommended Investigation
- **Probable Cause:** Suspected race condition during idempotency cache validation before the database transaction commit window completes. (Confidence Level: 85% - High).
- **Suggested Investigation:**
  1. Inspect Redis distributed lock implementation in `PaymentOrchestrationService.acquireIdempotencyLock()`.
  2. Check database isolation level on `account_balance` table update (ensure `SELECT ... FOR UPDATE` row-level lock or serializable isolation is enforced).
  3. Validate database unique constraint on `payments_ledger.idempotency_key` column.

---

## Release Recommendation
**`DO NOT RELEASE`**  
Critical financial control failure. Release must remain blocked until the duplicate debit defect is patched and verified by full regression and human QA sign-off.
