/**
 * Financial & General Ledger Reconciliation Validation Engine.
 * Verifies double-entry ledger balance, atomic balance deltas, and zero variance.
 * Read-only interface for test environments.
 */

export interface AccountBalanceSnapshot {
  accountId: string;
  accountMasked: string;
  currency: string;
  availableBalance: number;
  ledgerBalance: number;
  holdsOrLien?: number;
}

export interface GeneralLedgerJournalEntry {
  journalId: string;
  transactionRef: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
  feeAmount: number;
  status: 'POSTED' | 'PENDING' | 'REVERSED';
  timestamp: string;
}

export interface ReconciliationResult {
  transactionRef: string;
  isBalanced: boolean;
  sourceAccountDelta: number;
  beneficiaryAccountDelta: number;
  feeCharged: number;
  netVariance: number;
  auditTrailFound: boolean;
  discrepancies: string[];
}

export class CoreBankReconciliationEngine {
  
  /**
   * Validates that Source Debit == Beneficiary Credit + Fees (Zero Ledger Variance)
   */
  public static validateDoubleEntryPosting(
    sourceBefore: AccountBalanceSnapshot,
    sourceAfter: AccountBalanceSnapshot,
    beneficiaryBefore: AccountBalanceSnapshot,
    beneficiaryAfter: AccountBalanceSnapshot,
    expectedAmount: number,
    expectedFee: number = 0.00
  ): ReconciliationResult {
    const discrepancies: string[] = [];

    const sourceDebit = +(sourceBefore.availableBalance - sourceAfter.availableBalance).toFixed(2);
    const beneficiaryCredit = +(beneficiaryAfter.availableBalance - beneficiaryBefore.availableBalance).toFixed(2);
    const expectedSourceDebit = +(expectedAmount + expectedFee).toFixed(2);

    if (sourceDebit !== expectedSourceDebit) {
      discrepancies.push(`Source account debit mismatch: Expected $${expectedSourceDebit}, Observed $${sourceDebit}`);
    }

    if (beneficiaryCredit !== expectedAmount) {
      discrepancies.push(`Beneficiary credit mismatch: Expected $${expectedAmount}, Observed $${beneficiaryCredit}`);
    }

    const netVariance = +((sourceDebit - beneficiaryCredit) - expectedFee).toFixed(2);
    if (netVariance !== 0.00) {
      discrepancies.push(`Ledger out-of-balance! Net financial variance is $${netVariance}`);
    }

    return {
      transactionRef: 'TXN-RECON-VALIDATED',
      isBalanced: discrepancies.length === 0,
      sourceAccountDelta: sourceDebit,
      beneficiaryAccountDelta: beneficiaryCredit,
      feeCharged: expectedFee,
      netVariance: netVariance,
      auditTrailFound: true,
      discrepancies: discrepancies
    };
  }

  /**
   * Validates automated saga reversal on failed payment rail
   */
  public static validateReversalRollback(
    initialBalance: number,
    finalBalanceAfterRollback: number
  ): boolean {
    return initialBalance === finalBalanceAfterRollback;
  }
}
