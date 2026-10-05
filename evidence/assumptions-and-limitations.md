# Evidence Item 10: Assumptions, Constraints & System Limitations

## 1. Domain & Requirement Assumptions
1. **Single-Currency Domestic Transfers:** The Phase 1 proof of concept models domestic payments in USD without foreign exchange (FX) conversion.
2. **Per-Customer Daily Limits:** Daily limits ($10,000.00 USD) are enforced across the customer profile aggregation rather than per individual sub-account.
3. **Fee Accounting Structure:** Standard wire/ACH transfers in the demonstration have zero fees ($0.00); fee-bearing reconciliation logic is fully supported in the engine interface.
4. **Saga Reversal SLA:** Compensating transactions for orphaned debits are assumed to complete within 300 seconds.

---

## 2. Technical & Infrastructure Limitations
1. **Proof of Concept Scope:** The workspace is configured as a standalone test architecture with local mocks, synthetic fixtures, and deterministic simulation runners. It is not connected to a live production core banking engine (e.g., FIS, Fiserv, Temenos).
2. **Simulated Financial Execution:** In the absence of an active staging banking database, execution results, network latencies, and ledger imbalances are simulated for proof-of-concept evaluation.
3. **Legacy Selenium Workstation:** The Selenium adapter is implemented as an optional isolated compatibility bridge; execution against legacy IE11/teller portals requires an enterprise Selenium Grid infrastructure.

---

## 3. Governance & Decision-Support Boundary
1. **Strict Decision-Support Role:** CoreBank QA Agent provides evidence-based recommendations (`PASS`, `PASS WITH RISK`, `DO NOT RELEASE`, `INCONCLUSIVE`). It **CANNOT and MUST NEVER** autonomously deploy code or commit transactions to production.
2. **Mandatory Human Control:** Final release gating, defect filing in live Jira/Azure Boards, and production deployment sign-off require authorized human approval from QA Leads and the Change Advisory Board (CAB).
