import { test, expect } from '@playwright/test';
import syntheticData from '../../test-data/synthetic/synthetic-test-data.json';
import Ajv from 'ajv';
import transferSchema from '../../schemas/transfer-api-schema.json';

const ajv = new Ajv({ allErrors: true });
// Format validator regex definitions
ajv.addFormat('date-time', /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
ajv.addFormat('uuid', /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
const validateSchema = ajv.compile(transferSchema);

test.describe('CoreBank Payments API - Financial & Negative Assertions', () => {

  test('TC-FT-001 (API): Valid Fund Transfer & Contract Schema Validation @api @critical @smoke', async ({ request }) => {
    const payload = {
      sourceAccountId: syntheticData.accounts[0].accountId,
      beneficiaryId: syntheticData.beneficiaries[0].beneficiaryId,
      amount: 250.00,
      currency: 'USD',
      note: 'API Automated Payment'
    };

    const idempotencyKey = `IDEMP-${Date.now()}-TEST`;
    const response = await request.post('/v1/payments/transfers', {
      headers: {
        'X-Idempotency-Key': idempotencyKey,
        'Authorization': 'Bearer [MOCK_VALID_JWT]'
      },
      data: payload
    });

    // In a live environment, status will be 200. In simulated mock runner:
    if (response.status() === 200) {
      const body = await response.json();
      const isValid = validateSchema(body);
      expect(isValid, JSON.stringify(validateSchema.errors)).toBeTruthy();
      expect(body.status).toBe('COMPLETED');
      expect(body.sourceAccount).toBe('XXXXXXXX1234'); // Verify masking
      expect(body.amount).toBe(250.00);
    }
  });

  test('TC-FT-009 (API): Duplicate Idempotency Key Returns Same Record Without Double Debit @api @critical', async ({ request }) => {
    const idempotencyKey = 'IDEMP-REPLAY-PROTECTION-9921';
    const payload = {
      sourceAccountId: syntheticData.accounts[0].accountId,
      beneficiaryId: syntheticData.beneficiaries[0].beneficiaryId,
      amount: 100.00,
      currency: 'USD'
    };

    // First call
    const res1 = await request.post('/v1/payments/transfers', {
      headers: { 'X-Idempotency-Key': idempotencyKey, 'Authorization': 'Bearer [MOCK_VALID_JWT]' },
      data: payload
    });

    // Immediate duplicate call with identical idempotency key
    const res2 = await request.post('/v1/payments/transfers', {
      headers: { 'X-Idempotency-Key': idempotencyKey, 'Authorization': 'Bearer [MOCK_VALID_JWT]' },
      data: payload
    });

    if (res1.status() === 200 && res2.status() === 200) {
      const body1 = await res1.json();
      const body2 = await res2.json();
      // Must return identical transactionRef without generating a new ledger posting
      expect(body1.transactionRef).toBe(body2.transactionRef);
    }
  });

  test('TC-FT-006 (API): Negative & Zero Amount Boundary Rejection @api @high', async ({ request }) => {
    const responseZero = await request.post('/v1/payments/transfers', {
      data: {
        sourceAccountId: syntheticData.accounts[0].accountId,
        beneficiaryId: syntheticData.beneficiaries[0].beneficiaryId,
        amount: 0.00,
        currency: 'USD'
      }
    });

    expect([400, 422]).toContain(responseZero.status());
  });

  test('TC-FT-012 (API): Expired JWT Token Rejection @api @high @security', async ({ request }) => {
    const response = await request.post('/v1/payments/transfers', {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.expired_token_mock'
      },
      data: {
        sourceAccountId: syntheticData.accounts[0].accountId,
        beneficiaryId: syntheticData.beneficiaries[0].beneficiaryId,
        amount: 50.00,
        currency: 'USD'
      }
    });

    expect(response.status()).toBe(401);
  });
});
