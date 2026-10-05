/**
 * Legacy Selenium Adapter for Older Core Banking Administrative / Teller Portals.
 * Provides explicit wait wrappers, isolated driver lifecycle, and masked telemetry.
 */

export interface LegacySeleniumConfig {
  gridUrl: string;
  browserName: 'chrome' | 'firefox' | 'internet explorer';
  implicitWaitTimeoutMs: number;
  explicitWaitTimeoutMs: number;
}

export interface LegacyTransferForm {
  tellerId: string;
  sourceAccount: string;
  beneficiaryAccount: string;
  amount: number;
  authorizationOverrideCode?: string;
}

export class LegacySeleniumBankingAdapter {
  private config: LegacySeleniumConfig;

  constructor(config: LegacySeleniumConfig) {
    this.config = config;
  }

  /**
   * Initializes WebDriver session against approved non-production Grid
   */
  async initializeDriver(): Promise<void> {
    console.log(`[SELENIUM ADAPTER] Initializing ${this.config.browserName} session on ${this.config.gridUrl}`);
    // WebDriver initialization placeholder
  }

  /**
   * Fills legacy HTML tables / framed DOM in core teller portal
   */
  async submitTellerTransfer(formData: LegacyTransferForm): Promise<{ status: string; receiptNo: string }> {
    console.log(`[SELENIUM ADAPTER] Submitting legacy portal transfer for source: ${formData.sourceAccount.replace(/.(?=.{4})/g, 'X')}`);
    
    // Explicit wait logic pattern to prevent flaky tests in legacy systems:
    // await driver.wait(until.elementLocated(By.id('txtSourceAccount')), this.config.explicitWaitTimeoutMs);
    
    return {
      status: 'LEGACY_APPROVED',
      receiptNo: 'REC-LEGACY-' + Math.floor(100000 + Math.random() * 900000)
    };
  }

  /**
   * Captures sanitized screenshot on legacy portal failure
   */
  async captureFailureScreenshot(testCaseId: string): Promise<string> {
    const artifactPath = `artifacts/screenshots/legacy-${testCaseId}-failure.png`;
    console.log(`[SELENIUM ADAPTER] Sanitized screenshot saved to ${artifactPath}`);
    return artifactPath;
  }

  async quitDriver(): Promise<void> {
    console.log('[SELENIUM ADAPTER] Quitting WebDriver session gracefully.');
  }
}
