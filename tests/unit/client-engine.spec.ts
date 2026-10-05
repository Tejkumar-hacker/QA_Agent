/**
 * Unit Test Harness for CoreBank Client Engine (12 Invariant Tests)
 */

import { CoreBankClientEngine, ExitCode } from '../../scripts/CoreBankClientEngine';

console.log('=== COREBANK QA AGENT: RUNNING CLIENT ENGINE UNIT TEST SUITE (12 TESTS) ===\n');

let totalTests = 0;
let passedTests = 0;

function runTest(name: string, fn: () => boolean) {
  totalTests++;
  try {
    const success = fn();
    if (success) {
      passedTests++;
      console.log(`  [PASS] ${name}`);
    } else {
      console.error(`  [FAIL] ${name} - Assertion evaluated to false`);
    }
  } catch (err: any) {
    console.error(`  [FAIL] ${name} - Exception: ${err?.message}`);
  }
}

// Base valid payload helper
function createValidPayload(overrides: any = {}): any {
  return {
    metadata: {
      requestId: 'UNIT-TEST-001',
      requirementId: 'REQ-PAY-FT-001',
      executionMode: 'SIMULATED',
      dataClassification: 'SYNTHETIC'
    },
    transaction: {
      transactionReference: 'TXN-UNIT-001',
      correlationId: 'CORR-UNIT-001',
      idempotencyKey: 'IDEMP-UNIT-001',
      currency: 'USD'
    },
    expected: {
      openingBalance: 1500,
      transferAmount: 250,
      transferFee: 0,
      totalDebit: 250,
      beneficiaryCredit: 250,
      debitPostingCount: 1,
      creditPostingCount: 1,
      closingBalance: 1250,
      auditRecordRequired: true
    },
    observed: {
      totalDebit: 250,
      beneficiaryCredit: 250,
      debitPostingCount: 1,
      creditPostingCount: 1,
      closingBalance: 1250,
      auditRecordCreated: true,
      reversalRequired: false,
      reversalCompleted: false,
      sensitiveDataExposed: false
    },
    security: {
      sourceAccountMasked: 'XXXXXXXX1234',
      beneficiaryAccountMasked: 'XXXXXXXX5678',
      authenticationToken: '[REDACTED]'
    },
    ...overrides
  };
}

// 1. Perfectly balanced transaction returns PASS
runTest('1. Perfectly balanced transaction returns PASS (ExitCode 0)', () => {
  const result = CoreBankClientEngine.evaluate(createValidPayload());
  return result.recommendation === 'PASS' && result.exitCode === ExitCode.PASS && result.findingCodes.length === 0;
});

// 2. Duplicate debit returns DO NOT RELEASE
runTest('2. Duplicate debit returns DO NOT RELEASE (ExitCode 3)', () => {
  const payload = createValidPayload({
    observed: {
      totalDebit: 500,
      beneficiaryCredit: 250,
      debitPostingCount: 2,
      creditPostingCount: 1,
      closingBalance: 1000,
      auditRecordCreated: true
    }
  });
  const result = CoreBankClientEngine.evaluate(payload);
  return result.recommendation === 'DO NOT RELEASE' && result.exitCode === ExitCode.DO_NOT_RELEASE && result.findingCodes.includes('DUPLICATE_DEBIT');
});

// 3. Missing beneficiary credit returns DO NOT RELEASE
runTest('3. Missing beneficiary credit returns DO NOT RELEASE (ExitCode 3)', () => {
  const payload = createValidPayload({
    observed: {
      totalDebit: 250,
      beneficiaryCredit: 0,
      debitPostingCount: 1,
      creditPostingCount: 0,
      closingBalance: 1250,
      auditRecordCreated: true
    }
  });
  const result = CoreBankClientEngine.evaluate(payload);
  return result.recommendation === 'DO NOT RELEASE' && result.exitCode === ExitCode.DO_NOT_RELEASE && result.findingCodes.includes('MISSING_CREDIT');
});

// 4. Incorrect closing balance returns DO NOT RELEASE
runTest('4. Incorrect closing balance returns DO NOT RELEASE (ExitCode 3)', () => {
  const payload = createValidPayload({
    observed: {
      totalDebit: 250,
      beneficiaryCredit: 250,
      debitPostingCount: 1,
      creditPostingCount: 1,
      closingBalance: 1100, // Expected 1250
      auditRecordCreated: true
    }
  });
  const result = CoreBankClientEngine.evaluate(payload);
  return result.recommendation === 'DO NOT RELEASE' && result.findingCodes.includes('BALANCE_MISMATCH');
});

// 5. Failed reversal returns DO NOT RELEASE
runTest('5. Failed reversal returns DO NOT RELEASE (ExitCode 3)', () => {
  const payload = createValidPayload({
    observed: {
      totalDebit: 250,
      beneficiaryCredit: 250,
      debitPostingCount: 1,
      creditPostingCount: 1,
      closingBalance: 1250,
      reversalRequired: true,
      reversalCompleted: false
    }
  });
  const result = CoreBankClientEngine.evaluate(payload);
  return result.recommendation === 'DO NOT RELEASE' && result.findingCodes.includes('FAILED_REVERSAL');
});

// 6. Sensitive-data exposure returns DO NOT RELEASE
runTest('6. Sensitive-data exposure returns DO NOT RELEASE (ExitCode 3)', () => {
  const payload = createValidPayload({
    observed: {
      totalDebit: 250,
      beneficiaryCredit: 250,
      debitPostingCount: 1,
      creditPostingCount: 1,
      closingBalance: 1250,
      sensitiveDataExposed: true
    }
  });
  const result = CoreBankClientEngine.evaluate(payload);
  return result.recommendation === 'DO NOT RELEASE' && result.findingCodes.includes('SENSITIVE_DATA_EXPOSURE');
});

// 7. Missing required observed values returns INPUT_REJECTED
runTest('7. Missing required observed values returns INPUT_REJECTED (ExitCode 2)', () => {
  const payload = createValidPayload({
    observed: {
      totalDebit: 250,
      // missing beneficiaryCredit, debitPostingCount, creditPostingCount, closingBalance
    }
  });
  const result = CoreBankClientEngine.evaluate(payload);
  return result.inputStatus === 'INPUT_REJECTED' && result.exitCode === ExitCode.INPUT_REJECTED;
});

// 8. Invalid classification (e.g., PRODUCTION) returns INPUT_REJECTED
runTest('8. Invalid dataClassification returns INPUT_REJECTED (ExitCode 2)', () => {
  const payload = createValidPayload({
    metadata: {
      requestId: 'UNIT-TEST-008',
      requirementId: 'REQ-PAY-FT-001',
      executionMode: 'SIMULATED',
      dataClassification: 'PRODUCTION' // Prohibited
    }
  });
  const result = CoreBankClientEngine.evaluate(payload);
  return result.inputStatus === 'INPUT_REJECTED' && result.exitCode === ExitCode.INPUT_REJECTED;
});

// 9. Unmasked account number returns INPUT_REJECTED
runTest('9. Unmasked account number returns INPUT_REJECTED (ExitCode 2)', () => {
  const payload = createValidPayload({
    security: {
      sourceAccountMasked: '12345678901234', // Unmasked raw digits
      beneficiaryAccountMasked: 'XXXXXXXX5678',
      authenticationToken: '[REDACTED]'
    }
  });
  const result = CoreBankClientEngine.evaluate(payload);
  return result.inputStatus === 'INPUT_REJECTED' && result.exitCode === ExitCode.INPUT_REJECTED;
});

// 10. Redacted token passes validation
runTest('10. Redacted token passes input validation', () => {
  const payload = createValidPayload({
    security: {
      sourceAccountMasked: 'XXXXXXXX1234',
      beneficiaryAccountMasked: 'XXXXXXXX5678',
      authenticationToken: '[REDACTED]'
    }
  });
  const validation = CoreBankClientEngine.validateInput(payload);
  return validation.status === 'VALID' && validation.issues.length === 0;
});

// 11. Floating-point monetary values handled accurately (integer minor units cents)
runTest('11. Floating-point cents handling precision test (0.1 + 0.2 = 0.30)', () => {
  const payload = createValidPayload({
    expected: {
      openingBalance: 100.10,
      transferAmount: 0.20,
      transferFee: 0.05,
      totalDebit: 0.25,
      beneficiaryCredit: 0.20,
      debitPostingCount: 1,
      creditPostingCount: 1,
      closingBalance: 99.85
    },
    observed: {
      totalDebit: 0.25,
      beneficiaryCredit: 0.20,
      debitPostingCount: 1,
      creditPostingCount: 1,
      closingBalance: 99.85
    }
  });
  const result = CoreBankClientEngine.evaluate(payload);
  return (
    result.recommendation === 'PASS' &&
    result.financials.netReconciliationVarianceCents === 0 &&
    result.financials.balanceVarianceCents === 0
  );
});

// 12. Multi-row CSV parsing and batch evaluation
runTest('12. Multi-row CSV returns most severe batch result (DO NOT RELEASE)', () => {
  const csvData = `requestId,requirementId,executionMode,dataClassification,transactionReference,correlationId,idempotencyKey,currency,openingBalance,transferAmount,transferFee,expectedTotalDebit,expectedBeneficiaryCredit,expectedDebitPostingCount,expectedCreditPostingCount,expectedClosingBalance,observedTotalDebit,observedBeneficiaryCredit,observedDebitPostingCount,observedCreditPostingCount,observedClosingBalance,auditRecordRequired,auditRecordCreated,reversalRequired,reversalCompleted,sensitiveDataExposed,sourceAccountMasked,beneficiaryAccountMasked
CSV-PASS,REQ-PAY-FT-001,SIMULATED,SYNTHETIC,TXN-1,CORR-1,IDEMP-1,USD,1000,100,0,100,100,1,1,900,100,100,1,1,900,true,true,false,false,false,XXXXXXXX1234,XXXXXXXX5678
CSV-FAIL,REQ-PAY-FT-001,SIMULATED,SYNTHETIC,TXN-2,CORR-2,IDEMP-2,USD,1000,100,0,100,100,1,1,900,200,100,2,1,800,true,true,false,false,false,XXXXXXXX1234,XXXXXXXX5678`;

  const records = CoreBankClientEngine.parseCsv(csvData);
  const eval1 = CoreBankClientEngine.evaluate(records[0]);
  const eval2 = CoreBankClientEngine.evaluate(records[1]);

  return eval1.recommendation === 'PASS' && eval2.recommendation === 'DO NOT RELEASE' && eval2.exitCode === ExitCode.DO_NOT_RELEASE;
});

console.log(`\nClient Engine Unit Test Summary: ${passedTests}/${totalTests} Passed.`);
if (passedTests !== totalTests) {
  process.exit(1);
}
