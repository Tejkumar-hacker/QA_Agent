# Evidence Item 18: GitHub Actions Protected Human Review Configuration Guide

## Purpose
This document specifies the setup instructions for repository administrators to configure the protected `corebank-human-review` environment in GitHub.

---

## 1. Environment Configuration Steps

1. In the GitHub repository, navigate to:
   **Settings $\rightarrow$ Environments $\rightarrow$ New Environment**
2. Name the environment:
   `corebank-human-review`
3. Under **Deployment protection rules**:
   - Check **Required reviewers**.
   - Add authorized QA Leads, Risk Officers, and Release Managers (e.g., `@corebank-qa-leads`, `@release-cab`).
   - Check **Prevent self-review** to enforce separation of duties.
4. Under **Deployment branches**:
   - Select **Selected branches** $\rightarrow$ add `main` to prevent untrusted pull request bypasses.
5. Under **Environment secrets**:
   - Do **NOT** store production banking secrets or live database credentials.

---

## 2. Protected Workflow Behavior

```text
evaluate-client-data Job
           │
           ▼
[Recommendation == 'PASS_WITH_RISK'?]
      │                   │
     YES                  NO
      │                   │
      ▼                   ▼
human-review-gate       Job Completed
(Prompts reviewers      (Workflow terminates
 in GitHub UI)           based on exit code)
```

- When the CoreBank QA Agent evaluates a synthetic dataset and returns **`PASS WITH RISK`** (Exit Code 1), GitHub Actions automatically triggers the `human-review-gate` job.
- GitHub pauses execution until designated reviewers inspect the uploaded `corebank-agent-results` artifact and approve or reject the deployment.
