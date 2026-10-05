import { Page, Locator, expect } from '@playwright/test';

export class FundTransferPage {
  readonly page: Page;
  readonly sourceAccountSelect: Locator;
  readonly beneficiarySelect: Locator;
  readonly amountInput: Locator;
  readonly noteInput: Locator;
  readonly submitButton: Locator;
  readonly confirmModalButton: Locator;
  readonly successBanner: Locator;
  readonly transactionReferenceLabel: Locator;
  readonly errorMessageAlert: Locator;
  readonly availableBalanceLabel: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sourceAccountSelect = page.getByRole('combobox', { name: /source account/i });
    this.beneficiarySelect = page.getByRole('combobox', { name: /beneficiary/i });
    this.amountInput = page.getByRole('textbox', { name: /transfer amount/i });
    this.noteInput = page.getByRole('textbox', { name: /payment note/i });
    this.submitButton = page.getByRole('button', { name: /transfer funds/i });
    this.confirmModalButton = page.getByRole('button', { name: /confirm transfer/i });
    this.successBanner = page.getByTestId('transfer-success-alert');
    this.transactionReferenceLabel = page.getByTestId('transaction-reference-value');
    this.errorMessageAlert = page.getByRole('alert');
    this.availableBalanceLabel = page.getByTestId('available-balance-display');
  }

  async navigate(): Promise<void> {
    await this.page.goto('/payments/transfer');
    await expect(this.page).toHaveTitle(/Domestic Fund Transfer/i);
  }

  async initiateTransfer(sourceMasked: string, beneficiaryName: string, amount: string, note: string = 'QA Automated Payment'): Promise<void> {
    await this.sourceAccountSelect.selectOption({ label: sourceMasked });
    await this.beneficiarySelect.selectOption({ label: beneficiaryName });
    await this.amountInput.fill(amount);
    await this.noteInput.fill(note);
    await this.submitButton.click();
  }

  async confirmTransaction(): Promise<string> {
    await expect(this.confirmModalButton).toBeVisible();
    await this.confirmModalButton.click();
    await expect(this.successBanner).toBeVisible({ timeout: 10000 });
    const ref = await this.transactionReferenceLabel.innerText();
    return ref.trim();
  }

  async verifyErrorMessage(expectedSnippet: string): Promise<void> {
    await expect(this.errorMessageAlert).toContainText(expectedSnippet);
  }

  async verifySubmitDisabled(): Promise<void> {
    await expect(this.submitButton).toBeDisabled();
  }
}
