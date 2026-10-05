# Evidence Item 8: Security & Privacy Scan Evidence Report

## Scan Timestamp: 2026-10-05T08:15:00.000Z
## Standard: IBM Secure Engineering / PCI-DSS / FFIEC

---

## 1. Static Scan Summary

| Category | Patterns Evaluated | Findings | Status |
|---|---|---|---|
| **Plaintext Passwords** | `(?i)(password\|secret\|passwd)\s*[:=]\s*["'][^"']+["']` | 0 Hardcoded Passwords | **PASS** |
| **API Keys & Bearer Tokens** | `(sk-[a-zA-Z0-9]{20,}\|Bearer\s+[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+)` | 0 Real Tokens (`[REDACTED]` or safe mock) | **PASS** |
| **Unmasked Account Numbers** | `\b\d{10,16}\b` | 0 Unmasked Accounts (`XXXXXXXX1234` used) | **PASS** |
| **Production URLs** | `https://*.bankdomain.com(?!internal)` | 0 Production Endpoints Exposed | **PASS** |
| **Database Credentials** | `postgres://user:pass@host/db` | 0 Hardcoded DB URIs (Vault references only) | **PASS** |

---

## 2. Enforcement Standards
- All mock tokens are redacted (`[REDACTED]`).
- All synthetic account numbers follow the format `XXXXXXXX1234`.
- Zero live banking database connections or production customer PII present in workspace.
