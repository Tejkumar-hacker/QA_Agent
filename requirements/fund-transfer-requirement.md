# Business Requirement Specification: Fund Transfer Journey

## Document Metadata
- **Requirement ID:** REQ-PAY-FT-001
- **Domain:** Retail Core Banking / Payment Services
- **Capability:** Domestic Fund Transfer to Registered Beneficiary
- **Version:** 1.0.0
- **Status:** Approved for QA Assessment

---

## 1. User Story
**As a** retail banking customer,  
**I want to** transfer funds from my active checking or savings account to a pre-registered beneficiary,  
**So that I can** make a secure domestic electronic payment.

---

## 2. Business Rules & Acceptance Criteria

| AC ID | Rule / Acceptance Criterion | Description |
|---|---|---|
| **AC-01** | **Customer Authentication** | The initiating customer must have an active session with valid MFA token/JWT claims. |
| **AC-02** | **Source Account Active** | The source account status must be `ACTIVE` (not frozen, blocked, or closed). |
| **AC-03** | **Beneficiary Active** | The beneficiary must be registered in the customer's beneficiary directory and status must be `ACTIVE`. |
| **AC-04** | **Amount Validation (> 0)** | The transfer amount must be greater than 0.00 and adhere to standard currency decimal precision (2 decimal places). |
| **AC-05** | **Available Balance Check** | Transfer amount must be $\le$ Available Balance ($Available = Ledger Balance - Holds/Lien$). Overdraft limit is excluded unless overdraft opt-in is enabled. |
| **AC-06** | **Daily Transaction Limit** | Aggregated successful transfers within the rolling 24-hour window plus current transfer amount must not exceed the customer's configured daily payment limit (default: $10,000.00 USD). |
| **AC-07** | **Duplicate & Idempotency Prevention** | Requests sharing the same `X-Idempotency-Key` or submitted within 60 seconds with identical source, beneficiary, and amount must be rejected or return the existing transaction record without duplicate debit. |
| **AC-08** | **Unique Transaction Reference** | Every successful transfer must generate an immutable, globally unique Reference ID (format: `TXN-<YYYYMMDD>-<UUID8>`). |
| **AC-09** | **Atomicity / No Incorrect Debit** | If credit to beneficiary or payment switch fails, the source account must not remain debited. State must remain consistent. |
| **AC-10** | **Partial Failure & Reversal** | Any orphaned debit caused by downstream timeout must trigger an automated two-phase reversal (Saga compensating transaction) within 300 seconds. |
| **AC-11** | **Audit Trail Logging** | All transfer lifecycle events (`INITIATED`, `VALIDATED`, `DEBITED`, `CREDITED`, `REVERSED`, `FAILED`) must be emitted to the immutable audit store with timestamps, correlation IDs, and non-sensitive user metadata. |
| **AC-12** | **Data Masking & PII Protection** | Full PAN, account numbers, and credentials must be masked in logs, payloads, traces, and reports (`XXXXXXXX1234` format). Sensitive credentials must never appear in unencrypted plaintext. |

---

## 3. Ambiguities & Open Questions for Clarification

1. **Daily Limit Boundary:** Is the daily limit enforced per customer entity or per source account? *(Assumption: Enforced per customer profile across all owned accounts).*
2. **Fee Deductions:** Are service charges/fees deducted from the principal transfer amount or debited separately? *(Assumption: Debited as a distinct ledger line item from the source account).*
3. **Pending Transaction Timeout:** What is the maximum SLA before a pending transaction transitions to `TIMED_OUT` and triggers compensation? *(Assumption: 120 seconds).*
4. **Multi-Currency:** Are foreign currency transfers supported in this flow? *(Assumption: Single-currency domestic transfers only for Phase 1 POC).*
