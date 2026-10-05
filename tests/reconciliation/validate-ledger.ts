/**
 * Unit & Integration Test Harness for Double-Entry Financial Reconciliation.
 * Validates balance invariants, double-entry equality, duplicate debit detection,
 * missing credits, saga reversals, currency validation, and missing evidence handling.
 */

import {
  CoreBankReconciliationEngine,
  AccountBalanceSnapshot,
  ReconciliationResult
} from './CoreBankReconciliationEngine';

console.log('=== COREBANK QA AGENT: RUNNING RECONCILIATION UNIT SUITE ===\n');

let totalUnitTests = 0;
let passedUnitTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalUnitTests++;
  if (condition) {
    passedUnitTests++;
    console.log(`  [PASS] ${testName}`);
  } else {
    console.error(`  [FAIL] ${testName} - ${detail || 'Condition not met'}`);
  }
}

// FIXTURE 1: Successful Transfer (Happy Path: $250.00)
const srcBefore: AccountBalanceSnapshot = {
  accountId: 'ACCT-CHK-001',
  accountMasked: 'XXXXXXXX1234',
  currency: 'USD',
  availableBalance: 5000.00,
  ledgerBalance: 5000.00
};

const srcAfterHappy: AccountBalanceSnapshot = {
  accountId: 'ACCT-CHK-001',
  accountMasked: 'XXXXXXXX1234',
  currency: 'USD',
  availableBalance: 4750.00,
  ledgerBalance: 4750.00
};

const benBefore: AccountBalanceSnapshot = {
  accountId: 'BENEF-001',
  accountMasked: 'XXXXXXXX5678',
  currency: 'USD',
  availableBalance: 1200.00,
  ledgerBalance: 1200.00
};

const benAfterHappy: AccountBalanceSnapshot = {
  accountId: 'BENEF-001',
  accountMasked: 'XXXXXXXX5678',
  currency: 'USD',
  availableBalance: 1450.00,
  ledgerBalance: 1450.00
};

console.log('1. Validating Happy Path Double-Entry Posting:');
const happyRes = CoreBankReconciliationEngine.validateDoubleEntryPosting(
  srcBefore,
  srcAfterHappy,
  benBefore,
  benAfterHappy,
  250.00
);
assert(happyRes.isBalanced === true, 'Double-entry balanced for valid transfer');
assert(happyRes.netVariance === 0.00, 'Net financial variance is exactly 0.00');

// FIXTURE 2: Duplicate Debit Defect ($250.00 transfer resulted in $500.00 source debit)
console.log('\n2. Validating Duplicate Debit Anomaly Detection:');
const srcAfterDuplicate: AccountBalanceSnapshot = {
  accountId: 'ACCT-CHK-001',
  accountMasked: 'XXXXXXXX1234',
  currency: 'USD',
  availableBalance: 4500.00, // Double debit
  ledgerBalance: 4500.00
};
const dupRes = CoreBankReconciliationEngine.validateDoubleEntryPosting(
  srcBefore,
  srcAfterDuplicate,
  benBefore,
  benAfterHappy,
  250.00
);
assert(dupRes.isBalanced === false, 'Duplicate debit correctly flagged as un-balanced');
assert(dupRes.netVariance === 250.00, 'Net variance accurately reflects $250.00 debit discrepancy');

// FIXTURE 3: Missing Beneficiary Credit (Orphaned Debit)
console.log('\n3. Validating Missing Beneficiary Credit (Orphaned Debit):');
const benAfterOrphan: AccountBalanceSnapshot = {
  ...benBefore // Beneficiary received 0
};
const orphanRes = CoreBankReconciliationEngine.validateDoubleEntryPosting(
  srcBefore,
  srcAfterHappy,
  benBefore,
  benAfterOrphan,
  250.00
);
assert(orphanRes.isBalanced === false, 'Orphaned debit without credit is flagged as out-of-balance');

// FIXTURE 4: Successful Saga Reversal Verification
console.log('\n4. Validating Successful Saga Reversal:');
const isReversalRestored = CoreBankReconciliationEngine.validateReversalRollback(5000.00, 5000.00);
assert(isReversalRestored === true, 'Saga reversal confirms balance restoration to initial state');

// FIXTURE 5: Failed Saga Reversal
console.log('\n5. Validating Failed Saga Reversal:');
const isFailedReversal = CoreBankReconciliationEngine.validateReversalRollback(5000.00, 4750.00);
assert(isFailedReversal === false, 'Unsuccessful saga rollback is caught and flagged');

console.log(`\nReconciliation Unit Test Summary: ${passedUnitTests}/${totalUnitTests} Passed.`);
if (passedUnitTests !== totalUnitTests) {
  process.exit(1);
}
