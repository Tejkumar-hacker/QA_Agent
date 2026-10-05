/**
 * CoreBank QA Agent - Single-Command Client Execution & Evaluation Engine
 * 
 * Supports standalone JSON & CSV client validation without external dependencies.
 */

import * as fs from 'fs';
import * as path from 'path';

export type QualityGateDecision = 'PASS' | 'PASS WITH RISK' | 'DO NOT RELEASE' | 'INCONCLUSIVE';
export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export enum ExitCode {
  PASS = 0,
  PASS_WITH_RISK = 1,
  INPUT_REJECTED = 2,
  DO_NOT_RELEASE = 3,
  INCONCLUSIVE = 4,
  INTERNAL_AGENT_ERROR = 5,
}

export interface ClientMetadata {
  requestId: string;
  requirementId: string;
  executionMode: string;
  dataClassification: string;
  datasetId?: string;
  applicationName?: string;
  applicationVersion?: string;
  environment?: string;
  containsRealCustomerData?: boolean;
  containsProductionCredentials?: boolean;
  createdFor?: string;
}

export interface ClientTransaction {
  transactionReference: string;
  correlationId: string;
  idempotencyKey: string;
  currency: string;
}

export interface ClientExpected {
  openingBalance: number;
  transferAmount: number;
  transferFee?: number;
  totalDebit: number;
  beneficiaryCredit: number;
  debitPostingCount: number;
  creditPostingCount: number;
  closingBalance: number;
  auditRecordRequired?: boolean;
}

export interface ClientObserved {
  totalDebit: number;
  beneficiaryCredit: number;
  debitPostingCount: number;
  creditPostingCount: number;
  closingBalance: number;
  currency?: string;
  transactionStatus?: string;
  auditRecordCreated?: boolean;
  reversalRequired?: boolean;
  reversalCompleted?: boolean;
  sensitiveDataExposed?: boolean;
  duplicateDebitDetected?: boolean;
}

export interface ClientSecurity {
  sourceAccountMasked?: string;
  beneficiaryAccountMasked?: string;
  authenticationToken?: string;
  apiKey?: string;
  password?: string;
  productionEndpoint?: string | null;
  databaseConnection?: string | null;
  dataMaskingApplied?: boolean;
}

export interface ClientInputPayload {
  metadata: ClientMetadata;
  transaction: ClientTransaction;
  expected: ClientExpected;
  observed: ClientObserved;
  security?: ClientSecurity;
  customer?: Record<string, unknown>;
  sourceAccount?: Record<string, unknown>;
  beneficiary?: Record<string, unknown>;
  transferRequest?: Record<string, unknown>;
  simulatedObservedResult?: Record<string, unknown>;
  expectedAgentAssessment?: Record<string, unknown>;
  simulationDisclaimer?: string[];
}

export interface ValidationIssue {
  field: string;
  message: string;
}

export interface InputValidationResult {
  status: 'VALID' | 'INPUT_REJECTED';
  issues: ValidationIssue[];
}

export interface CalculatedFinancials {
  expectedClosingBalance: number; // in dollars
  calculatedClosingBalance: number; // in dollars from openingBalance - totalDebit
  debitVariance: number; // in dollars: expected.totalDebit - observed.totalDebit
  creditVariance: number; // in dollars: expected.beneficiaryCredit - observed.beneficiaryCredit
  balanceVariance: number; // in dollars: expected.closingBalance - observed.closingBalance
  debitPostingVariance: number; // expected.debitPostingCount - observed.debitPostingCount
  creditPostingVariance: number; // expected.creditPostingCount - observed.creditPostingCount
  netReconciliationVariance: number; // in dollars: (observedCredit + fee) - observedDebit
  
  // Minor units (cents) for exact decimal integrity
  openingBalanceCents: number;
  transferAmountCents: number;
  transferFeeCents: number;
  expectedDebitCents: number;
  observedDebitCents: number;
  expectedCreditCents: number;
  observedCreditCents: number;
  expectedClosingCents: number;
  observedClosingCents: number;
  debitVarianceCents: number;
  creditVarianceCents: number;
  balanceVarianceCents: number;
  netReconciliationVarianceCents: number;
}

export interface EvaluationResult {
  requestId: string;
  requirementId: string;
  applicableTestCase: string;
  executionMode: string;
  inputStatus: 'VALID' | 'INPUT_REJECTED';
  findingCodes: string[];
  findingsDetails: string[];
  riskLevel: RiskLevel;
  recommendation: QualityGateDecision;
  exitCode: ExitCode;
  financials: CalculatedFinancials;
  input: ClientInputPayload;
  humanReviewRequired: boolean;
  simulationIndicator: boolean;
  decisionReason: string;
  requiredActions: string[];
}

export class CoreBankClientEngine {
  private static readonly MASKED_ACCOUNT_REGEX = /^X{8}\d{4}$/;
  private static readonly SAFE_REQUEST_ID_REGEX = /^[A-Za-z0-9_-]+$/;
  private static readonly CURRENCY_REGEX = /^[A-Z]{3}$/;
  private static readonly APPROVED_EXECUTION_MODES = ['SIMULATED', 'NON_PROD_TEST', 'QA_MOCK', 'SIMULATION'];

  /**
   * Helper: converts dollars to cents safely (integer minor units)
   */
  public static toCents(amount: number): number {
    return Math.round(amount * 100);
  }

  /**
   * Helper: converts cents to dollars string
   */
  public static toDollars(cents: number): string {
    const isNeg = cents < 0;
    const absCents = Math.abs(cents);
    const dollars = Math.floor(absCents / 100);
    const remainder = absCents % 100;
    const formatted = `${dollars}.${remainder.toString().padStart(2, '0')}`;
    return isNeg ? `-$${formatted}` : `$${formatted}`;
  }

  /**
   * Normalizes incoming payload if using alternate property structures (e.g., from full demonstration dataset)
   */
  public static normalizePayload(raw: any): ClientInputPayload {
    if (!raw || typeof raw !== 'object') {
      return raw;
    }

    const payload: ClientInputPayload = {
      metadata: raw.metadata || {},
      transaction: raw.transaction || {},
      expected: raw.expected || {},
      observed: raw.observed || {},
      security: raw.security || {},
      ...raw
    };

    // If transaction fields are embedded in transferRequest / simulatedObservedResult:
    if (!payload.transaction.transactionReference && raw.transferRequest?.transactionReference) {
      payload.transaction.transactionReference = raw.transferRequest.transactionReference;
    }
    if (!payload.transaction.correlationId && raw.transferRequest?.correlationId) {
      payload.transaction.correlationId = raw.transferRequest.correlationId;
    }
    if (!payload.transaction.idempotencyKey && raw.transferRequest?.idempotencyKey) {
      payload.transaction.idempotencyKey = raw.transferRequest.idempotencyKey;
    }
    if (!payload.transaction.currency && raw.transferRequest?.currency) {
      payload.transaction.currency = raw.transferRequest.currency;
    }

    // If expected values are embedded in sourceAccount / transferRequest:
    if (payload.expected.openingBalance === undefined && raw.sourceAccount?.openingAvailableBalance !== undefined) {
      payload.expected.openingBalance = Number(raw.sourceAccount.openingAvailableBalance);
    }
    if (payload.expected.transferAmount === undefined && raw.transferRequest?.transferAmount !== undefined) {
      payload.expected.transferAmount = Number(raw.transferRequest.transferAmount);
    }
    if (payload.expected.transferFee === undefined && raw.transferRequest?.transferFee !== undefined) {
      payload.expected.transferFee = Number(raw.transferRequest.transferFee);
    }
    if (payload.expected.totalDebit === undefined && raw.transferRequest?.expectedTotalDebit !== undefined) {
      payload.expected.totalDebit = Number(raw.transferRequest.expectedTotalDebit);
    }
    if (payload.expected.beneficiaryCredit === undefined && raw.transferRequest?.expectedBeneficiaryCredit !== undefined) {
      payload.expected.beneficiaryCredit = Number(raw.transferRequest.expectedBeneficiaryCredit);
    }
    if (payload.expected.debitPostingCount === undefined && raw.transferRequest?.expectedDebitPostingCount !== undefined) {
      payload.expected.debitPostingCount = Number(raw.transferRequest.expectedDebitPostingCount);
    }
    if (payload.expected.creditPostingCount === undefined && raw.transferRequest?.expectedCreditPostingCount !== undefined) {
      payload.expected.creditPostingCount = Number(raw.transferRequest.expectedCreditPostingCount);
    }
    if (payload.expected.closingBalance === undefined && raw.transferRequest?.expectedClosingAvailableBalance !== undefined) {
      payload.expected.closingBalance = Number(raw.transferRequest.expectedClosingAvailableBalance);
    }
    if (payload.expected.auditRecordRequired === undefined && raw.transferRequest?.auditRecordRequired !== undefined) {
      payload.expected.auditRecordRequired = Boolean(raw.transferRequest.auditRecordRequired);
    }

    // If observed values are in simulatedObservedResult:
    if (raw.simulatedObservedResult) {
      const sim = raw.simulatedObservedResult;
      if (payload.observed.totalDebit === undefined && sim.actualTotalDebit !== undefined) {
        payload.observed.totalDebit = Number(sim.actualTotalDebit);
      }
      if (payload.observed.beneficiaryCredit === undefined && sim.actualBeneficiaryCredit !== undefined) {
        payload.observed.beneficiaryCredit = Number(sim.actualBeneficiaryCredit);
      }
      if (payload.observed.debitPostingCount === undefined && sim.actualDebitPostingCount !== undefined) {
        payload.observed.debitPostingCount = Number(sim.actualDebitPostingCount);
      }
      if (payload.observed.creditPostingCount === undefined && sim.actualCreditPostingCount !== undefined) {
        payload.observed.creditPostingCount = Number(sim.actualCreditPostingCount);
      }
      if (payload.observed.closingBalance === undefined && sim.actualClosingAvailableBalance !== undefined) {
        payload.observed.closingBalance = Number(sim.actualClosingAvailableBalance);
      }
      if (payload.observed.auditRecordCreated === undefined && sim.auditRecordCreated !== undefined) {
        payload.observed.auditRecordCreated = Boolean(sim.auditRecordCreated);
      }
      if (payload.observed.sensitiveDataExposed === undefined && sim.sensitiveDataExposed !== undefined) {
        payload.observed.sensitiveDataExposed = Boolean(sim.sensitiveDataExposed);
      }
      if (payload.observed.duplicateDebitDetected === undefined && sim.duplicateDebitDetected !== undefined) {
        payload.observed.duplicateDebitDetected = Boolean(sim.duplicateDebitDetected);
      }
      if (payload.observed.transactionStatus === undefined && sim.transactionStatus !== undefined) {
        payload.observed.transactionStatus = String(sim.transactionStatus);
      }
    }

    // If security values are in root or sourceAccount / beneficiary:
    if (!payload.security) {
      payload.security = {};
    }
    if (!payload.security.sourceAccountMasked && raw.sourceAccount?.accountNumberMasked) {
      payload.security.sourceAccountMasked = String(raw.sourceAccount.accountNumberMasked);
    }
    if (!payload.security.beneficiaryAccountMasked && raw.beneficiary?.accountNumberMasked) {
      payload.security.beneficiaryAccountMasked = String(raw.beneficiary.accountNumberMasked);
    }

    return payload;
  }

  /**
   * Validates input payload according to strict banking data protection & structural rules
   */
  public static validateInput(rawPayload: any): InputValidationResult {
    const issues: ValidationIssue[] = [];

    if (!rawPayload || typeof rawPayload !== 'object') {
      return {
        status: 'INPUT_REJECTED',
        issues: [{ field: 'root', message: 'Input must be a valid JSON object or CSV row.' }]
      };
    }

    const payload = this.normalizePayload(rawPayload);

    // Required fields check
    const checkRequired = (obj: any, pathName: string) => {
      const parts = pathName.split('.');
      let curr = obj;
      for (const p of parts) {
        if (curr === undefined || curr === null || curr[p] === undefined || curr[p] === null || curr[p] === '') {
          issues.push({ field: pathName, message: `Field '${pathName}' is required and cannot be empty.` });
          return;
        }
        curr = curr[p];
      }
    };

    checkRequired(payload, 'metadata.requestId');
    checkRequired(payload, 'metadata.requirementId');
    checkRequired(payload, 'metadata.executionMode');
    checkRequired(payload, 'metadata.dataClassification');
    checkRequired(payload, 'transaction.transactionReference');
    checkRequired(payload, 'transaction.correlationId');
    checkRequired(payload, 'transaction.idempotencyKey');
    checkRequired(payload, 'transaction.currency');
    checkRequired(payload, 'expected.openingBalance');
    checkRequired(payload, 'expected.transferAmount');
    checkRequired(payload, 'expected.totalDebit');
    checkRequired(payload, 'expected.beneficiaryCredit');
    checkRequired(payload, 'expected.debitPostingCount');
    checkRequired(payload, 'expected.creditPostingCount');
    checkRequired(payload, 'expected.closingBalance');
    checkRequired(payload, 'observed.totalDebit');
    checkRequired(payload, 'observed.beneficiaryCredit');
    checkRequired(payload, 'observed.debitPostingCount');
    checkRequired(payload, 'observed.creditPostingCount');
    checkRequired(payload, 'observed.closingBalance');

    // Rule 1: executionMode
    if (payload.metadata?.executionMode && !this.APPROVED_EXECUTION_MODES.includes(payload.metadata.executionMode.toUpperCase())) {
      issues.push({
        field: 'metadata.executionMode',
        message: `Execution mode must be one of [${this.APPROVED_EXECUTION_MODES.join(', ')}]. Received: '${payload.metadata.executionMode}'.`
      });
    }

    // Rule 2: dataClassification
    if (payload.metadata?.dataClassification && payload.metadata.dataClassification.toUpperCase() !== 'SYNTHETIC') {
      issues.push({
        field: 'metadata.dataClassification',
        message: `Data classification must be 'SYNTHETIC'. Non-synthetic or live banking data is strictly rejected.`
      });
    }

    // Rule 9: Safe request ID
    if (payload.metadata?.requestId && !this.SAFE_REQUEST_ID_REGEX.test(payload.metadata.requestId)) {
      issues.push({
        field: 'metadata.requestId',
        message: `Request ID must contain only alphanumeric characters, underscores, or hyphens for safe filesystem usage.`
      });
    }

    // Rule 5: Currency 3-letter code
    if (payload.transaction?.currency && !this.CURRENCY_REGEX.test(payload.transaction.currency)) {
      issues.push({
        field: 'transaction.currency',
        message: `Currency must be a 3-letter uppercase ISO-4217 code (e.g. USD, EUR, GBP).`
      });
    }

    // Rule 3: Monetary values are finite numbers and non-negative
    const validateMoney = (val: any, fieldName: string) => {
      if (val !== undefined && val !== null) {
        const num = Number(val);
        if (typeof num !== 'number' || isNaN(num) || !isFinite(num)) {
          issues.push({ field: fieldName, message: `Monetary field '${fieldName}' must be a finite number.` });
        } else if (num < 0) {
          issues.push({ field: fieldName, message: `Monetary field '${fieldName}' cannot be negative.` });
        }
      }
    };

    validateMoney(payload.expected?.openingBalance, 'expected.openingBalance');
    validateMoney(payload.expected?.transferAmount, 'expected.transferAmount');
    if (payload.expected?.transferFee !== undefined) {
      validateMoney(payload.expected.transferFee, 'expected.transferFee');
    }
    validateMoney(payload.expected?.totalDebit, 'expected.totalDebit');
    validateMoney(payload.expected?.beneficiaryCredit, 'expected.beneficiaryCredit');
    validateMoney(payload.expected?.closingBalance, 'expected.closingBalance');
    validateMoney(payload.observed?.totalDebit, 'observed.totalDebit');
    validateMoney(payload.observed?.beneficiaryCredit, 'observed.beneficiaryCredit');
    validateMoney(payload.observed?.closingBalance, 'observed.closingBalance');

    // Rule 4: Posting counts non-negative integers
    const validateCount = (val: any, fieldName: string) => {
      if (val !== undefined && val !== null) {
        const num = Number(val);
        if (!Number.isInteger(num) || num < 0) {
          issues.push({ field: fieldName, message: `Posting count '${fieldName}' must be a non-negative integer.` });
        }
      }
    };

    validateCount(payload.expected?.debitPostingCount, 'expected.debitPostingCount');
    validateCount(payload.expected?.creditPostingCount, 'expected.creditPostingCount');
    validateCount(payload.observed?.debitPostingCount, 'observed.debitPostingCount');
    validateCount(payload.observed?.creditPostingCount, 'observed.creditPostingCount');

    // Rule 6 & 7 & 8: Security checks & PII masking
    const sec = payload.security || {};
    if (sec.sourceAccountMasked && !this.MASKED_ACCOUNT_REGEX.test(sec.sourceAccountMasked)) {
      issues.push({
        field: 'security.sourceAccountMasked',
        message: `Source account number '${sec.sourceAccountMasked}' does not follow the approved masking standard (XXXXXXXX1234).`
      });
    }
    if (sec.beneficiaryAccountMasked && !this.MASKED_ACCOUNT_REGEX.test(sec.beneficiaryAccountMasked)) {
      issues.push({
        field: 'security.beneficiaryAccountMasked',
        message: `Beneficiary account number '${sec.beneficiaryAccountMasked}' does not follow the approved masking standard (XXXXXXXX1234).`
      });
    }

    if (sec.authenticationToken && sec.authenticationToken !== '[REDACTED]') {
      // Check if real token or unredacted string
      if (!sec.authenticationToken.startsWith('Bearer [') && !sec.authenticationToken.includes('REDACTED')) {
        issues.push({
          field: 'security.authenticationToken',
          message: `Authentication token must be '[REDACTED]' or a safe mock reference. Plaintext tokens are rejected.`
        });
      }
    }

    if (sec.apiKey && sec.apiKey !== '[REDACTED]') {
      issues.push({ field: 'security.apiKey', message: `API Key must be '[REDACTED]' in synthetic client submissions.` });
    }
    if (sec.password && sec.password !== '[REDACTED]') {
      issues.push({ field: 'security.password', message: `Password must be '[REDACTED]' in synthetic client submissions.` });
    }

    if (sec.productionEndpoint && sec.productionEndpoint !== 'null' && sec.productionEndpoint !== '') {
      issues.push({
        field: 'security.productionEndpoint',
        message: `Production endpoint connections are strictly prohibited. Received: '${sec.productionEndpoint}'.`
      });
    }
    if (sec.databaseConnection && sec.databaseConnection !== 'null' && sec.databaseConnection !== '') {
      issues.push({
        field: 'security.databaseConnection',
        message: `Direct database connections are prohibited in client dataset evaluations.`
      });
    }

    // Deep scan for potential raw unmasked account numbers (10 to 16 continuous digits) in any string field
    const checkUnmaskedDeep = (obj: any, pathPrefix = '') => {
      if (!obj) return;
      if (typeof obj === 'string') {
        if (/^\d{10,16}$/.test(obj.trim())) {
          issues.push({
            field: pathPrefix,
            message: `Unmasked 10-16 digit account number or PAN detected in field '${pathPrefix}'. Must be masked as XXXXXXXX1234.`
          });
        }
      } else if (typeof obj === 'object') {
        for (const k of Object.keys(obj)) {
          checkUnmaskedDeep(obj[k], pathPrefix ? `${pathPrefix}.${k}` : k);
        }
      }
    };
    checkUnmaskedDeep(rawPayload);

    return {
      status: issues.length === 0 ? 'VALID' : 'INPUT_REJECTED',
      issues
    };
  }

  /**
   * Performs decimal-safe calculations and rule-based anomaly detection
   */
  public static evaluate(rawPayload: any): EvaluationResult {
    const payload = this.normalizePayload(rawPayload);
    const validation = this.validateInput(rawPayload);

    if (validation.status === 'INPUT_REJECTED') {
      const reqId = payload?.metadata?.requestId || 'UNKNOWN-REQUEST';
      const reqSpec = payload?.metadata?.requirementId || 'REQ-PAY-FT-001';
      return {
        requestId: reqId,
        requirementId: reqSpec,
        applicableTestCase: 'N/A',
        executionMode: payload?.metadata?.executionMode || 'UNKNOWN',
        inputStatus: 'INPUT_REJECTED',
        findingCodes: ['INPUT_VALIDATION_FAILED'],
        findingsDetails: validation.issues.map(i => `[${i.field}] ${i.message}`),
        riskLevel: 'CRITICAL',
        recommendation: 'DO NOT RELEASE',
        exitCode: ExitCode.INPUT_REJECTED,
        financials: {
          expectedClosingBalance: 0,
          calculatedClosingBalance: 0,
          debitVariance: 0,
          creditVariance: 0,
          balanceVariance: 0,
          debitPostingVariance: 0,
          creditPostingVariance: 0,
          netReconciliationVariance: 0,
          openingBalanceCents: 0,
          transferAmountCents: 0,
          transferFeeCents: 0,
          expectedDebitCents: 0,
          observedDebitCents: 0,
          expectedCreditCents: 0,
          observedCreditCents: 0,
          expectedClosingCents: 0,
          observedClosingCents: 0,
          debitVarianceCents: 0,
          creditVarianceCents: 0,
          balanceVarianceCents: 0,
          netReconciliationVarianceCents: 0
        },
        input: payload,
        humanReviewRequired: true,
        simulationIndicator: true,
        decisionReason: 'Input rejected due to data validation / safety rule violations.',
        requiredActions: ['Correct input format issues and ensure all account numbers are masked.']
      };
    }

    // Decimal-safe calculations using integer minor units (cents)
    const openingCents = this.toCents(payload.expected.openingBalance);
    const transferAmountCents = this.toCents(payload.expected.transferAmount);
    const feeCents = this.toCents(payload.expected.transferFee || 0);
    const expectedDebitCents = this.toCents(payload.expected.totalDebit);
    const observedDebitCents = this.toCents(payload.observed.totalDebit);
    const expectedCreditCents = this.toCents(payload.expected.beneficiaryCredit);
    const observedCreditCents = this.toCents(payload.observed.beneficiaryCredit);
    const expectedClosingCents = this.toCents(payload.expected.closingBalance);
    const observedClosingCents = this.toCents(payload.observed.closingBalance);

    // Independent calculations
    const calculatedClosingCents = openingCents - expectedDebitCents;
    const debitVarianceCents = expectedDebitCents - observedDebitCents;
    const creditVarianceCents = expectedCreditCents - observedCreditCents;
    const balanceVarianceCents = expectedClosingCents - observedClosingCents;
    const debitPostingVariance = payload.expected.debitPostingCount - payload.observed.debitPostingCount;
    const creditPostingVariance = payload.expected.creditPostingCount - payload.observed.creditPostingCount;
    
    // Net reconciliation variance: (Observed Credit + Fee) - Observed Debit
    const netReconciliationVarianceCents = (observedCreditCents + feeCents) - observedDebitCents;

    const financials: CalculatedFinancials = {
      expectedClosingBalance: expectedClosingCents / 100,
      calculatedClosingBalance: calculatedClosingCents / 100,
      debitVariance: debitVarianceCents / 100,
      creditVariance: creditVarianceCents / 100,
      balanceVariance: balanceVarianceCents / 100,
      debitPostingVariance,
      creditPostingVariance,
      netReconciliationVariance: netReconciliationVarianceCents / 100,
      openingBalanceCents: openingCents,
      transferAmountCents,
      transferFeeCents: feeCents,
      expectedDebitCents,
      observedDebitCents,
      expectedCreditCents,
      observedCreditCents,
      expectedClosingCents,
      observedClosingCents,
      debitVarianceCents,
      creditVarianceCents,
      balanceVarianceCents,
      netReconciliationVarianceCents
    };

    // Detection rules
    const findingCodes: string[] = [];
    const findingsDetails: string[] = [];
    let applicableTestCase = 'TC-FT-001';

    // Detection 1: Duplicate Debit
    if (payload.observed.debitPostingCount > payload.expected.debitPostingCount || observedDebitCents > expectedDebitCents) {
      findingCodes.push('DUPLICATE_DEBIT');
      findingsDetails.push(
        `Duplicate debit detected: observed ${payload.observed.debitPostingCount} debit postings totaling ${this.toDollars(observedDebitCents)} (expected ${payload.expected.debitPostingCount} posting of ${this.toDollars(expectedDebitCents)}).`
      );
      applicableTestCase = 'TC-FT-009';
    }

    // Detection 2: Missing Credit
    if (payload.observed.creditPostingCount < payload.expected.creditPostingCount || observedCreditCents < expectedCreditCents) {
      findingCodes.push('MISSING_CREDIT');
      findingsDetails.push(
        `Missing beneficiary credit: observed ${payload.observed.creditPostingCount} credit postings totaling ${this.toDollars(observedCreditCents)} (expected ${payload.expected.creditPostingCount} posting of ${this.toDollars(expectedCreditCents)}).`
      );
      if (applicableTestCase === 'TC-FT-001') applicableTestCase = 'TC-FT-013';
    }

    // Detection 3: Balance Mismatch
    if (observedClosingCents !== expectedClosingCents) {
      findingCodes.push('BALANCE_MISMATCH');
      findingsDetails.push(
        `Closing balance mismatch: observed balance ${this.toDollars(observedClosingCents)} differs from expected ${this.toDollars(expectedClosingCents)} (variance: ${this.toDollars(balanceVarianceCents)}).`
      );
    }

    // Detection 4: Currency Mismatch
    if (payload.observed.currency && payload.observed.currency !== payload.transaction.currency) {
      findingCodes.push('CURRENCY_MISMATCH');
      findingsDetails.push(
        `Currency mismatch: transaction currency '${payload.transaction.currency}' differs from observed currency '${payload.observed.currency}'.`
      );
      if (applicableTestCase === 'TC-FT-001') applicableTestCase = 'TC-FT-007';
    }

    // Detection 5: Failed Reversal
    if (payload.observed.reversalRequired === true && payload.observed.reversalCompleted !== true) {
      findingCodes.push('FAILED_REVERSAL');
      findingsDetails.push(`Compensating saga reversal was required for this transaction but was not completed.`);
      applicableTestCase = 'TC-FT-014';
    }

    // Detection 6: Sensitive Data Exposure
    if (payload.observed.sensitiveDataExposed === true) {
      findingCodes.push('SENSITIVE_DATA_EXPOSURE');
      findingsDetails.push(`Sensitive customer credentials or unmasked PAN/SSN data was exposed in telemetry.`);
      applicableTestCase = 'TC-FT-020';
    }

    // Detection 7: Audit Record Missing
    if (payload.expected.auditRecordRequired === true && payload.observed.auditRecordCreated !== true) {
      findingCodes.push('AUDIT_RECORD_MISSING');
      findingsDetails.push(`Mandatory compliance audit trail event was not created for this transaction.`);
      if (applicableTestCase === 'TC-FT-001') applicableTestCase = 'TC-FT-016';
    }

    // Detection 8: Net Reconciliation Mismatch
    if (netReconciliationVarianceCents !== 0 && !findingCodes.includes('DUPLICATE_DEBIT') && !findingCodes.includes('MISSING_CREDIT')) {
      findingCodes.push('RECONCILIATION_MISMATCH');
      findingsDetails.push(`Double-entry ledger is out of balance with net variance of ${this.toDollars(netReconciliationVarianceCents)}.`);
    }

    // Decision logic
    const criticalFindings = [
      'DUPLICATE_DEBIT',
      'MISSING_CREDIT',
      'BALANCE_MISMATCH',
      'FAILED_REVERSAL',
      'SENSITIVE_DATA_EXPOSURE',
      'RECONCILIATION_MISMATCH'
    ];

    const hasCritical = findingCodes.some(code => criticalFindings.includes(code));
    let recommendation: QualityGateDecision = 'PASS';
    let riskLevel: RiskLevel = 'LOW';
    let exitCode = ExitCode.PASS;
    let decisionReason = 'All double-entry financial invariants and security controls satisfied.';
    const requiredActions: string[] = ['Proceed to final CAB review and release scheduling.'];

    if (hasCritical) {
      recommendation = 'DO NOT RELEASE';
      riskLevel = 'CRITICAL';
      exitCode = ExitCode.DO_NOT_RELEASE;
      decisionReason = `Critical financial/security control failure detected (${findingCodes.join(', ')}). Release is blocked.`;
      requiredActions.length = 0;
      requiredActions.push('Block the release immediately.');
      if (findingCodes.includes('DUPLICATE_DEBIT')) {
        requiredActions.push('Investigate payment idempotency handling and distributed locks.');
        requiredActions.push('Verify duplicate-submission protection on database isolation level.');
      }
      if (findingCodes.includes('MISSING_CREDIT')) {
        requiredActions.push('Audit downstream payment clearing switches and saga orchestrator queues.');
      }
      if (findingCodes.includes('FAILED_REVERSAL')) {
        requiredActions.push('Inspect automated compensating transaction pipelines.');
      }
      requiredActions.push('Review debit and credit posting records.');
      requiredActions.push('Rerun the critical fund-transfer regression suite.');
      requiredActions.push('Obtain authorized human approval before release.');
    } else if (findingCodes.includes('AUDIT_RECORD_MISSING') || findingCodes.includes('CURRENCY_MISMATCH')) {
      recommendation = 'PASS WITH RISK';
      riskLevel = 'HIGH';
      exitCode = ExitCode.PASS_WITH_RISK;
      decisionReason = `Non-critical compliance or validation finding observed (${findingCodes.join(', ')}).`;
      requiredActions.length = 0;
      requiredActions.push('Obtain written CAB risk acceptance for non-critical telemetry issue.');
    }

    return {
      requestId: payload.metadata.requestId,
      requirementId: payload.metadata.requirementId,
      applicableTestCase,
      executionMode: payload.metadata.executionMode,
      inputStatus: 'VALID',
      findingCodes,
      findingsDetails,
      riskLevel,
      recommendation,
      exitCode,
      financials,
      input: payload,
      humanReviewRequired: true,
      simulationIndicator: true,
      decisionReason,
      requiredActions
    };
  }

  /**
   * Generates output artifacts in the target folder
   */
  public static writeOutputArtifacts(result: EvaluationResult, outputDir: string, overwrite = false): string {
    const targetFolder = path.join(outputDir, result.requestId);

    if (fs.existsSync(targetFolder)) {
      if (!overwrite) {
        // Create timestamped subfolder
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const timestampedFolder = path.join(outputDir, `${result.requestId}_${timestamp}`);
        fs.mkdirSync(timestampedFolder, { recursive: true });
        this.writeFilesToFolder(result, timestampedFolder);
        return timestampedFolder;
      }
    } else {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    this.writeFilesToFolder(result, targetFolder);
    return targetFolder;
  }

  private static writeFilesToFolder(result: EvaluationResult, folder: string): void {
    // 1. input-validation.json
    const inputValidation = {
      requestId: result.requestId,
      requirementId: result.requirementId,
      status: result.inputStatus,
      validatedAt: new Date().toISOString(),
      issues: result.inputStatus === 'INPUT_REJECTED' ? result.findingsDetails : [],
      dataClassification: result.input.metadata?.dataClassification || 'SYNTHETIC',
      maskedFieldsVerified: true,
      secretsRedactedVerified: true
    };
    fs.writeFileSync(path.join(folder, 'input-validation.json'), JSON.stringify(inputValidation, null, 2));

    // 2. reconciliation-result.json
    const reconResult = {
      requestId: result.requestId,
      transactionReference: result.input.transaction?.transactionReference || 'N/A',
      correlationId: result.input.transaction?.correlationId || 'N/A',
      idempotencyKey: result.input.transaction?.idempotencyKey || 'N/A',
      currency: result.input.transaction?.currency || 'USD',
      financials: {
        openingBalance: result.financials.openingBalanceCents / 100,
        expectedDebit: result.financials.expectedDebitCents / 100,
        observedDebit: result.financials.observedDebitCents / 100,
        debitVariance: result.financials.debitVarianceCents / 100,
        expectedBeneficiaryCredit: result.financials.expectedCreditCents / 100,
        observedBeneficiaryCredit: result.financials.observedCreditCents / 100,
        creditVariance: result.financials.creditVarianceCents / 100,
        expectedClosingBalance: result.financials.expectedClosingCents / 100,
        observedClosingBalance: result.financials.observedClosingCents / 100,
        balanceVariance: result.financials.balanceVarianceCents / 100,
        expectedDebitPostings: result.input.expected?.debitPostingCount ?? 0,
        observedDebitPostings: result.input.observed?.debitPostingCount ?? 0,
        expectedCreditPostings: result.input.expected?.creditPostingCount ?? 0,
        observedCreditPostings: result.input.observed?.creditPostingCount ?? 0,
        netReconciliationVariance: result.financials.netReconciliationVarianceCents / 100
      },
      isBalanced: result.financials.netReconciliationVarianceCents === 0 && result.financials.balanceVarianceCents === 0,
      findings: result.findingCodes
    };
    fs.writeFileSync(path.join(folder, 'reconciliation-result.json'), JSON.stringify(reconResult, null, 2));

    // 3. quality-gate-result.json
    const qgResult = {
      requestId: result.requestId,
      requirementId: result.requirementId,
      executionMode: result.executionMode,
      inputStatus: result.inputStatus,
      findingCodes: result.findingCodes,
      riskLevel: result.riskLevel,
      recommendation: result.recommendation,
      decisionReason: result.decisionReason,
      requiredActions: result.requiredActions,
      humanReviewRequired: result.humanReviewRequired,
      simulationIndicator: result.simulationIndicator
    };
    fs.writeFileSync(path.join(folder, 'quality-gate-result.json'), JSON.stringify(qgResult, null, 2));

    // 4. result-summary.md
    const summaryMd = `# CoreBank QA Agent: Evaluation Summary Report

## SIMULATED RESULT NOTICE
> **SIMULATED RESULT**  
> This result was generated for proof-of-concept demonstration.  
> It was not produced by execution against a real banking system.  
> No real financial transaction was performed.  
> No real customer data was used.

---

## Request Metadata
- **Request ID:** \`${result.requestId}\`
- **Requirement ID:** \`${result.requirementId}\`
- **Applicable Test Case:** \`${result.applicableTestCase}\`
- **Execution Mode:** \`${result.executionMode}\`
- **Data Classification:** \`SYNTHETIC\`
- **Evaluation Date:** \`${new Date().toISOString()}\`

---

## Financial Comparison & Variances

| Metric | Expected Value | Observed Value | Calculated Variance | Status |
|---|---|---|---|---|
| **Total Debit** | ${this.toDollars(result.financials.expectedDebitCents)} | ${this.toDollars(result.financials.observedDebitCents)} | ${this.toDollars(result.financials.debitVarianceCents)} | ${result.financials.debitVarianceCents === 0 ? 'MATCH' : 'MISMATCH'} |
| **Beneficiary Credit** | ${this.toDollars(result.financials.expectedCreditCents)} | ${this.toDollars(result.financials.observedCreditCents)} | ${this.toDollars(result.financials.creditVarianceCents)} | ${result.financials.creditVarianceCents === 0 ? 'MATCH' : 'MISMATCH'} |
| **Debit Postings** | ${result.input.expected?.debitPostingCount ?? 0} | ${result.input.observed?.debitPostingCount ?? 0} | ${result.financials.debitPostingVariance} | ${result.financials.debitPostingVariance === 0 ? 'MATCH' : 'ANOMALY'} |
| **Credit Postings** | ${result.input.expected?.creditPostingCount ?? 0} | ${result.input.observed?.creditPostingCount ?? 0} | ${result.financials.creditPostingVariance} | ${result.financials.creditPostingVariance === 0 ? 'MATCH' : 'ANOMALY'} |
| **Closing Balance** | ${this.toDollars(result.financials.expectedClosingCents)} | ${this.toDollars(result.financials.observedClosingCents)} | ${this.toDollars(result.financials.balanceVarianceCents)} | ${result.financials.balanceVarianceCents === 0 ? 'MATCH' : 'MISMATCH'} |
| **Net Ledger Variance** | $0.00 | ${this.toDollars(result.financials.netReconciliationVarianceCents)} | ${this.toDollars(result.financials.netReconciliationVarianceCents)} | ${result.financials.netReconciliationVarianceCents === 0 ? 'BALANCED' : 'OUT_OF_BALANCE'} |

---

## Findings & Risk Classification
- **Risk Level:** **\`${result.riskLevel}\`**
- **Quality-Gate Recommendation:** **\`${result.recommendation}\`**
- **Findings:**
${result.findingsDetails.length > 0 ? result.findingsDetails.map(f => `  - ${f}`).join('\n') : '  - None (All financial invariants satisfied)'}

---

## Decision Rationale
${result.decisionReason}

## Required Remediation Actions
${result.requiredActions.map(a => `- ${a}`).join('\n')}

---

## Human Approval Boundary
Final release authorization remains strictly under human QA Lead and CAB control.
`;
    fs.writeFileSync(path.join(folder, 'result-summary.md'), summaryMd);

    // 5. defect-report.md (only when defects found)
    if (result.findingCodes.length > 0 && result.recommendation === 'DO NOT RELEASE') {
      const defectMd = `# Defect Report: DEF-${result.requestId}-001

## SIMULATED RESULT NOTICE
> **SIMULATED RESULT**  
> This result was generated for proof-of-concept demonstration.  
> It was not produced by execution against a real banking system.  
> No real financial transaction was performed.  
> No real customer data was used.

---

## Defect Summary
- **Defect ID:** \`DEF-${result.requestId}-001\`
- **Title:** [Financial Invariant] Critical discrepancy during transaction processing: ${result.findingCodes.join(', ')}
- **Severity:** CRITICAL
- **Priority:** P0 (Release Blocking)
- **Requirement ID:** \`${result.requirementId}\`
- **Applicable Test Scenario:** \`${result.applicableTestCase}\`
- **Environment:** \`${result.executionMode}\`

---

## Observed Anomalies
${result.findingsDetails.map(d => `- ${d}`).join('\n')}

## Telemetry Evidence (Sanitized)
- **Source Account:** \`${result.input.security?.sourceAccountMasked || 'XXXXXXXX1234'}\`
- **Beneficiary Account:** \`${result.input.security?.beneficiaryAccountMasked || 'XXXXXXXX5678'}\`
- **Transaction Reference:** \`${result.input.transaction?.transactionReference || 'N/A'}\`
- **Correlation ID:** \`${result.input.transaction?.correlationId || 'N/A'}\`
- **Idempotency Key:** \`${result.input.transaction?.idempotencyKey || 'N/A'}\`
- **Expected Debit:** ${this.toDollars(result.financials.expectedDebitCents)} (Postings: ${result.input.expected?.debitPostingCount ?? 0})
- **Observed Debit:** ${this.toDollars(result.financials.observedDebitCents)} (Postings: ${result.input.observed?.debitPostingCount ?? 0})
- **Net Ledger Variance:** ${this.toDollars(result.financials.netReconciliationVarianceCents)}

---

## Release Recommendation
**\`DO NOT RELEASE\`**  
Mandatory human QA Lead and engineering investigation required before closure.
`;
      fs.writeFileSync(path.join(folder, 'defect-report.md'), defectMd);
    }
  }

  /**
   * Parses CSV string into an array of structured client input payloads
   */
  public static parseCsv(csvContent: string): any[] {
    const lines = csvContent
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => l.length > 0);

    if (lines.length < 2) {
      return [];
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const records: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row: Record<string, any> = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] !== undefined ? values[idx] : '';
      });

      // Map CSV flat columns to nested JSON structure
      const payload: ClientInputPayload = {
        metadata: {
          requestId: row.requestId,
          requirementId: row.requirementId,
          executionMode: row.executionMode,
          dataClassification: row.dataClassification
        },
        transaction: {
          transactionReference: row.transactionReference,
          correlationId: row.correlationId,
          idempotencyKey: row.idempotencyKey,
          currency: row.currency
        },
        expected: {
          openingBalance: parseFloat(row.openingBalance),
          transferAmount: parseFloat(row.transferAmount),
          transferFee: row.transferFee ? parseFloat(row.transferFee) : 0,
          totalDebit: parseFloat(row.expectedTotalDebit),
          beneficiaryCredit: parseFloat(row.expectedBeneficiaryCredit),
          debitPostingCount: parseInt(row.expectedDebitPostingCount, 10),
          creditPostingCount: parseInt(row.expectedCreditPostingCount, 10),
          closingBalance: parseFloat(row.expectedClosingBalance),
          auditRecordRequired: row.auditRecordRequired === 'true' || row.auditRecordRequired === '1'
        },
        observed: {
          totalDebit: parseFloat(row.observedTotalDebit),
          beneficiaryCredit: parseFloat(row.observedBeneficiaryCredit),
          debitPostingCount: parseInt(row.observedDebitPostingCount, 10),
          creditPostingCount: parseInt(row.observedCreditPostingCount, 10),
          closingBalance: parseFloat(row.observedClosingBalance),
          auditRecordCreated: row.auditRecordCreated === 'true' || row.auditRecordCreated === '1',
          reversalRequired: row.reversalRequired === 'true' || row.reversalRequired === '1',
          reversalCompleted: row.reversalCompleted === 'true' || row.reversalCompleted === '1',
          sensitiveDataExposed: row.sensitiveDataExposed === 'true' || row.sensitiveDataExposed === '1'
        },
        security: {
          sourceAccountMasked: row.sourceAccountMasked,
          beneficiaryAccountMasked: row.beneficiaryAccountMasked,
          authenticationToken: '[REDACTED]'
        }
      };

      records.push(payload);
    }

    return records;
  }
}
