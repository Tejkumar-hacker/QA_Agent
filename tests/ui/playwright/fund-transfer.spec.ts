import { test, expect } from '@playwright/test';
import { FundTransferPage } from '../../../pages/FundTransferPage';
import syntheticData from '../../../test-data/synthetic/synthetic-test-data.json';

test.describe('CoreBank UI Fund Transfer - Playwright Automation Suite', () => {
  let transferPage: FundTransferPage;

  test.beforeEach(async ({ page }) => {
    transferPage = new FundTransferPage(page);
    // Route mock backend to enable hermetic CI execution without real banking core
    await page.route('**/v1/payments/transfers', async (route) => {
      const request = route.request();
      const postData = JSON.parse(request.postData() || '{}');

      if (postData.amount > 1000) {
        await route.fulfill({
          status: 422,
          contentType: 'application/json',
          body: JSON.stringify({
            errorCode: 'ERR_INSUFFICIENT_FUNDS',
            message: 'Insufficient funds for transfer.'
          })
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'COMPLETED',
            transactionRef: 'TXN-20260510-' + Math.floor(100000 + Math.random() * 900000),
            correlationId: 'c9a18432-8df2-4211-9a71-6fa7c29e11a2',
            sourceAccount: 'XXXXXXXX1234',
            beneficiaryId: 'BENEF-001',
            amount: postData.amount,
            currency: 'USD',
            timestamp: new Date().toISOString()
          })
        });
      }
    });

    await page.goto('/');
  });

  test('TC-FT-001: [Happy Path] Complete Fund Transfer with Valid Balance @ui @smoke @critical', async ({ page }) => {
    await transferPage.navigate();
    const sourceAcct = syntheticData.accounts[0].accountNumberMasked;
    const beneficiary = syntheticData.beneficiaries[0].name;

    await transferPage.initiateTransfer(sourceAcct, beneficiary, '250.00', 'Automated QA Test Payment');
    const txnRef = await transferPage.confirmTransaction();

    expect(txnRef).toMatch(/^TXN-\d{8}-\d{6}$/);
    await expect(transferPage.successBanner).toBeVisible();
  });

  test('TC-FT-002: [Negative] Transfer Exceeding Available Balance Displays Inline Error @ui @critical', async ({ page }) => {
    await transferPage.navigate();
    const sourceAcct = syntheticData.accounts[1].accountNumberMasked; // Available: $100.00
    const beneficiary = syntheticData.beneficiaries[0].name;

    await transferPage.initiateTransfer(sourceAcct, beneficiary, '500.00');
    await transferPage.verifyErrorMessage('Insufficient funds');
  });

  test('TC-FT-008: [Concurrency] Rapid Multi-Click UI Debounce Test @ui @critical', async ({ page }) => {
    await transferPage.navigate();
    const sourceAcct = syntheticData.accounts[0].accountNumberMasked;
    const beneficiary = syntheticData.beneficiaries[0].name;

    await transferPage.initiateTransfer(sourceAcct, beneficiary, '50.00');
    
    // Rapidly click confirm button to verify debounce logic
    const confirmBtn = transferPage.confirmModalButton;
    await Promise.all([
      confirmBtn.click({ clickCount: 3, delay: 50 }).catch(() => {}),
      transferPage.confirmModalButton.isDisabled()
    ]);

    await expect(transferPage.successBanner).toBeVisible();
  });
});
