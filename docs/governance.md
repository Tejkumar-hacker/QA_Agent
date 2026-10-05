# Security, Safety Guardrails & Governance Policy

## Mandatory AI Agent Safety Principles

1. **Decision-Support Boundary (Human-in-the-Loop):**
   - The CoreBank QA Agent is explicitly architected as a **decision-support accelerator**.
   - It **MUST NEVER** autonomously approve production deployments, commit live financial transactions, or execute destructive commands against production systems.
   - All generated automation scripts, defect reports, and release recommendations require explicit human review and sign-off by a qualified QA Lead / CAB owner.

2. **Zero Production Data Access:**
   - Real customer data, PII, account balances, and production database endpoints are strictly prohibited.
   - All tests utilize deterministic, mathematically valid synthetic datasets (`test-data/synthetic/`).

3. **Strict Data Masking & Redaction:**
   - Account numbers must always be formatted as `XXXXXXXX1234`.
   - JWT tokens, authorization headers, and API keys are redacted to `[REDACTED]` prior to trace publishing.
   - Automated log scrubbers sanitize browser telemetry, HTTP logs, and screenshot artifacts.

4. **Least-Privilege Environment Execution:**
   - Test execution connections to core banking test environments are restricted to non-production environments with read-only database roles for reconciliation.

5. **Financial Integrity Gating:**
   - Overall test pass rate percentage is never used in isolation.
   - Any financial discrepancy (duplicate debit, ledger imbalance, failed saga reversal) triggers an immediate **`DO NOT RELEASE`** recommendation.
