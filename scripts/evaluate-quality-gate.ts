import * as fs from 'fs';
import * as path from 'path';

export interface ExecutionSummary {
  evaluationId?: string;
  timestamp?: string;
  applicationName?: string;
  applicationVersion?: string;
  environment?: string;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  blocked?: number;
  criticalFailures: number;
  highFailures: number;
  mediumFailures: number;
  lowFailures: number;
  duplicateDebitsDetected: number;
  ledgerImbalanceCount: number;
  unmaskedPiiIncidents: number;
  reversalFailureCount?: number;
  unauthorizedTransferCount?: number;
  inconclusiveEnvironment: boolean;
  ledgerEvidenceMissing?: boolean;
}

export interface GateDecision {
  evaluationId: string;
  timestamp: string;
  application: string;
  version: string;
  environment: string;
  recommendation: 'PASS' | 'PASS WITH RISK' | 'DO NOT RELEASE' | 'INCONCLUSIVE';
  overallScore: number;
  totalTests: number;
  passed: number;
  failed: number;
  blocked: number;
  criticalFailures: number;
  riskSummary: {
    financialRisk: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    securityRisk: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    accountingIntegrity: 'BALANCED' | 'OUT_OF_BALANCE' | 'INCONCLUSIVE';
  };
  blockingReasons: string[];
  advisoryNotes: string[];
  requiredActions: string[];
  humanReviewRequired: boolean;
  simulationIndicator: boolean;
}

export class CoreBankQualityGateEngine {
  public static evaluate(summary: ExecutionSummary): GateDecision {
    const blockingReasons: string[] = [];
    const advisoryNotes: string[] = [];
    const requiredActions: string[] = [];

    const evaluationId = summary.evaluationId || `QG-EVAL-${Date.now()}`;
    const timestamp = summary.timestamp || new Date().toISOString();
    const app = summary.applicationName || 'CoreBank Payments Service';
    const version = summary.applicationVersion || 'v2.4.1-rc3';
    const env = summary.environment || 'QA-Integration-01';
    const blockedCount = summary.blocked || 0;

    // Rule 1: Inconclusive check (Environment unavailable or missing ledger evidence)
    if (summary.inconclusiveEnvironment || summary.ledgerEvidenceMissing || summary.totalTests === 0) {
      return {
        evaluationId,
        timestamp,
        application: app,
        version,
        environment: env,
        recommendation: 'INCONCLUSIVE',
        overallScore: 0,
        totalTests: summary.totalTests,
        passed: summary.passed,
        failed: summary.failed,
        blocked: blockedCount,
        criticalFailures: summary.criticalFailures,
        riskSummary: {
          financialRisk: 'MEDIUM',
          securityRisk: 'LOW',
          accountingIntegrity: 'INCONCLUSIVE'
        },
        blockingReasons: [
          summary.inconclusiveEnvironment
            ? 'Test environment or required dependent banking service was inaccessible.'
            : 'Ledger or reconciliation audit evidence is missing or inaccessible.'
        ],
        advisoryNotes: ['Re-run execution once QA environment services and ledger read-replicas are stabilized.'],
        requiredActions: ['Verify test database connectivity', 'Rerun test suite with active reconciliation log stream'],
        humanReviewRequired: true,
        simulationIndicator: true
      };
    }

    // Rule 2: Zero-Tolerance Critical Financial Invariants (DO NOT RELEASE)
    if (summary.duplicateDebitsDetected > 0) {
      blockingReasons.push(`CRITICAL FINANCIAL: Detected ${summary.duplicateDebitsDetected} duplicate debit transaction(s) violating ledger integrity.`);
      requiredActions.push('Investigate distributed locking on idempotency keys and prevent race condition debits');
    }

    if (summary.ledgerImbalanceCount > 0) {
      blockingReasons.push(`CRITICAL ACCOUNTING: Detected ${summary.ledgerImbalanceCount} general ledger out-of-balance condition(s).`);
      requiredActions.push('Audit double-entry posting pipeline for orphaned debit records');
    }

    if ((summary.reversalFailureCount || 0) > 0) {
      blockingReasons.push(`CRITICAL RECOVERY: ${summary.reversalFailureCount} compensating saga reversal(s) failed to restore customer balance.`);
      requiredActions.push('Inspect payment switch saga orchestrator compensation queues');
    }

    if ((summary.unauthorizedTransferCount || 0) > 0) {
      blockingReasons.push(`CRITICAL SECURITY: Detected ${summary.unauthorizedTransferCount} unauthorized / token bypass transaction(s).`);
      requiredActions.push('Patch authentication filter and step-up auth claims verification');
    }

    if (summary.unmaskedPiiIncidents > 0) {
      blockingReasons.push(`CRITICAL PRIVACY: Found ${summary.unmaskedPiiIncidents} unmasked PII/credential exposure incident(s) in logs/telemetry.`);
      requiredActions.push('Verify telemetry scrubbers and mask sensitive account/token values');
    }

    if (summary.criticalFailures > 0 && blockingReasons.length === 0) {
      blockingReasons.push(`CRITICAL QA: ${summary.criticalFailures} Critical/P0 financial test scenario(s) failed.`);
      requiredActions.push('Remediate failing critical test cases and verify financial posting invariants');
    }

    if (summary.highFailures > 0) {
      blockingReasons.push(`HIGH QA: ${summary.highFailures} High-priority scenario(s) failed.`);
      requiredActions.push('Resolve high-priority functional validation bugs prior to release packaging');
    }

    // Evaluate Decision
    if (blockingReasons.length > 0) {
      return {
        evaluationId,
        timestamp,
        application: app,
        version,
        environment: env,
        recommendation: 'DO NOT RELEASE',
        overallScore: Math.round(((summary.passed / summary.totalTests) * 100) * 10) / 10,
        totalTests: summary.totalTests,
        passed: summary.passed,
        failed: summary.failed,
        blocked: blockedCount,
        criticalFailures: summary.criticalFailures,
        riskSummary: {
          financialRisk: (summary.duplicateDebitsDetected > 0 || summary.ledgerImbalanceCount > 0) ? 'CRITICAL' : 'HIGH',
          securityRisk: summary.unmaskedPiiIncidents > 0 ? 'CRITICAL' : 'LOW',
          accountingIntegrity: summary.ledgerImbalanceCount > 0 ? 'OUT_OF_BALANCE' : 'BALANCED'
        },
        blockingReasons,
        advisoryNotes: ['Release pipeline gated. Escalate defect DEF-FT-2026-001 to Payments Core team.'],
        requiredActions,
        humanReviewRequired: true,
        simulationIndicator: true
      };
    }

    if (summary.mediumFailures > 0 || summary.lowFailures > 0) {
      advisoryNotes.push(`PASS WITH RISK: ${summary.mediumFailures} medium and ${summary.lowFailures} low non-financial failures observed.`);
      requiredActions.push('Obtain written CAB and product owner risk acceptance for non-critical failures');
      return {
        evaluationId,
        timestamp,
        application: app,
        version,
        environment: env,
        recommendation: 'PASS WITH RISK',
        overallScore: Math.round(((summary.passed / summary.totalTests) * 100) * 10) / 10,
        totalTests: summary.totalTests,
        passed: summary.passed,
        failed: summary.failed,
        blocked: blockedCount,
        criticalFailures: summary.criticalFailures,
        riskSummary: {
          financialRisk: 'LOW',
          securityRisk: 'NONE',
          accountingIntegrity: 'BALANCED'
        },
        blockingReasons: [],
        advisoryNotes,
        requiredActions,
        humanReviewRequired: true,
        simulationIndicator: true
      };
    }

    return {
      evaluationId,
      timestamp,
      application: app,
      version,
      environment: env,
      recommendation: 'PASS',
      overallScore: 100.0,
      totalTests: summary.totalTests,
      passed: summary.passed,
      failed: summary.failed,
      blocked: blockedCount,
      criticalFailures: 0,
      riskSummary: {
        financialRisk: 'NONE',
        securityRisk: 'NONE',
        accountingIntegrity: 'BALANCED'
      },
      blockingReasons: [],
      advisoryNotes: ['All 20 multi-layer financial and UI tests passed. Ready for CAB review.'],
      requiredActions: ['Proceed to final CAB review and production deployment scheduling'],
      humanReviewRequired: true,
      simulationIndicator: true
    };
  }
}

// Unit Test & Demonstration Matrix
if (require.main === module) {
  console.log('=== COREBANK QA AGENT: VALIDATING QUALITY GATE DECISION ENGINE (9 TEST CASES) ===\n');

  const testCases: { name: string; summary: ExecutionSummary; expected: 'PASS' | 'PASS WITH RISK' | 'DO NOT RELEASE' | 'INCONCLUSIVE' }[] = [
    {
      name: 'CASE 1: All critical and high-risk tests pass',
      summary: { totalTests: 20, passed: 20, failed: 0, skipped: 0, criticalFailures: 0, highFailures: 0, mediumFailures: 0, lowFailures: 0, duplicateDebitsDetected: 0, ledgerImbalanceCount: 0, unmaskedPiiIncidents: 0, inconclusiveEnvironment: false },
      expected: 'PASS'
    },
    {
      name: 'CASE 2: Only an accepted medium or low-risk test fails',
      summary: { totalTests: 20, passed: 18, failed: 2, skipped: 0, criticalFailures: 0, highFailures: 0, mediumFailures: 1, lowFailures: 1, duplicateDebitsDetected: 0, ledgerImbalanceCount: 0, unmaskedPiiIncidents: 0, inconclusiveEnvironment: false },
      expected: 'PASS WITH RISK'
    },
    {
      name: 'CASE 3: Duplicate debit is detected',
      summary: { totalTests: 20, passed: 19, failed: 1, skipped: 0, criticalFailures: 1, highFailures: 0, mediumFailures: 0, lowFailures: 0, duplicateDebitsDetected: 1, ledgerImbalanceCount: 0, unmaskedPiiIncidents: 0, inconclusiveEnvironment: false },
      expected: 'DO NOT RELEASE'
    },
    {
      name: 'CASE 4: Debit and credit reconciliation fails',
      summary: { totalTests: 20, passed: 19, failed: 1, skipped: 0, criticalFailures: 1, highFailures: 0, mediumFailures: 0, lowFailures: 0, duplicateDebitsDetected: 0, ledgerImbalanceCount: 1, unmaskedPiiIncidents: 0, inconclusiveEnvironment: false },
      expected: 'DO NOT RELEASE'
    },
    {
      name: 'CASE 5: Reversal fails',
      summary: { totalTests: 20, passed: 19, failed: 1, skipped: 0, criticalFailures: 1, highFailures: 0, mediumFailures: 0, lowFailures: 0, duplicateDebitsDetected: 0, ledgerImbalanceCount: 0, unmaskedPiiIncidents: 0, reversalFailureCount: 1, inconclusiveEnvironment: false },
      expected: 'DO NOT RELEASE'
    },
    {
      name: 'CASE 6: Sensitive customer information is exposed',
      summary: { totalTests: 20, passed: 19, failed: 1, skipped: 0, criticalFailures: 1, highFailures: 0, mediumFailures: 0, lowFailures: 0, duplicateDebitsDetected: 0, ledgerImbalanceCount: 0, unmaskedPiiIncidents: 1, inconclusiveEnvironment: false },
      expected: 'DO NOT RELEASE'
    },
    {
      name: 'CASE 7: Required environment is unavailable',
      summary: { totalTests: 20, passed: 0, failed: 0, skipped: 0, blocked: 20, criticalFailures: 0, highFailures: 0, mediumFailures: 0, lowFailures: 0, duplicateDebitsDetected: 0, ledgerImbalanceCount: 0, unmaskedPiiIncidents: 0, inconclusiveEnvironment: true },
      expected: 'INCONCLUSIVE'
    },
    {
      name: 'CASE 8: Ledger or reconciliation evidence is unavailable',
      summary: { totalTests: 20, passed: 20, failed: 0, skipped: 0, criticalFailures: 0, highFailures: 0, mediumFailures: 0, lowFailures: 0, duplicateDebitsDetected: 0, ledgerImbalanceCount: 0, unmaskedPiiIncidents: 0, inconclusiveEnvironment: false, ledgerEvidenceMissing: true },
      expected: 'INCONCLUSIVE'
    },
    {
      name: 'CASE 9: 19/20 tests pass (95%), but failed test is duplicate debit',
      summary: { totalTests: 20, passed: 19, failed: 1, skipped: 0, criticalFailures: 1, highFailures: 0, mediumFailures: 0, lowFailures: 0, duplicateDebitsDetected: 1, ledgerImbalanceCount: 1, unmaskedPiiIncidents: 0, inconclusiveEnvironment: false },
      expected: 'DO NOT RELEASE'
    }
  ];

  let passedCases = 0;
  testCases.forEach((tc, idx) => {
    const decision = CoreBankQualityGateEngine.evaluate(tc.summary);
    const matches = decision.recommendation === tc.expected;
    if (matches) passedCases++;
    console.log(`[${matches ? 'PASS' : 'FAIL'}] ${tc.name} -> Evaluated: ${decision.recommendation} (Expected: ${tc.expected})`);
  });

  console.log(`\nQuality Gate Decision Verification: ${passedCases}/${testCases.length} Passed.\n`);

  // Demonstration CLI output for the core simulated failure (Case 9):
  const sampleDecision = CoreBankQualityGateEngine.evaluate(testCases[8].summary);
  console.log('--- SAMPLE MACHINE-READABLE GATE DECISION ARTIFACT ---');
  console.log(JSON.stringify(sampleDecision, null, 2));
}
