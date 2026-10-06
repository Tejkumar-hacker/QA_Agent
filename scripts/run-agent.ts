#!/usr/bin/env ts-node
/**
 * CoreBank QA Agent - Single-Command Client CLI Entrypoint
 *
 * Usage:
 *   npm run agent -- --input ./input/test-data.json
 *   npm run agent -- --input ./input/test-data.csv
 *   npm run agent -- --input ./input/test-data.json --output ./custom-results --overwrite
 *
 * Auto CI/CD:
 *   After evaluation the agent automatically git-commits the input file and
 *   generated results, pushes to origin, and triggers the GitHub Actions
 *   workflow — provided GITHUB_TOKEN, GITHUB_OWNER, and GITHUB_REPO are set
 *   in .env (copy from .env.example).
 */

import * as fs from 'fs';
import * as path from 'path';
import { CoreBankClientEngine, EvaluationResult, ExitCode } from './CoreBankClientEngine';
import { pushAndTriggerCi } from './push-and-trigger-ci';

interface ParsedArgs {
  inputPath?: string;
  outputPath: string;
  overwrite: boolean;
  skipCi: boolean;
}

function parseCliArgs(args: string[]): ParsedArgs {
  let inputPath: string | undefined;
  let outputPath = './results';
  let overwrite = false;
  let skipCi = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--input' || arg === '-i') {
      inputPath = args[i + 1];
      i++;
    } else if (arg === '--output' || arg === '-o') {
      outputPath = args[i + 1];
      i++;
    } else if (arg === '--overwrite') {
      overwrite = true;
    } else if (arg === '--skip-ci') {
      skipCi = true;
    }
  }

  return { inputPath, outputPath, overwrite, skipCi };
}

function printConsoleSummary(result: EvaluationResult, outputFolder: string): void {
  console.log('\n==================================================');
  console.log('              COREBANK QA AGENT                   ');
  console.log('==================================================');
  console.log(`Request:          ${result.requestId}`);
  console.log(`Requirement:      ${result.requirementId}`);
  console.log(`Input:            ${result.inputStatus}`);
  console.log(`Mode:             ${result.executionMode}`);
  console.log(`Test Scenario:    ${result.applicableTestCase}`);
  console.log('--------------------------------------------------');
  console.log(`Expected debit:       ${CoreBankClientEngine.toDollars(result.financials.expectedDebitCents)}`);
  console.log(`Observed debit:       ${CoreBankClientEngine.toDollars(result.financials.observedDebitCents)}`);
  console.log(`Debit variance:       ${CoreBankClientEngine.toDollars(result.financials.debitVarianceCents)}`);
  console.log(`Expected credit:      ${CoreBankClientEngine.toDollars(result.financials.expectedCreditCents)}`);
  console.log(`Observed credit:      ${CoreBankClientEngine.toDollars(result.financials.observedCreditCents)}`);
  console.log(`Closing balance:      ${CoreBankClientEngine.toDollars(result.financials.observedClosingCents)} (Expected: ${CoreBankClientEngine.toDollars(result.financials.expectedClosingCents)})`);
  console.log(`Net ledger variance:  ${CoreBankClientEngine.toDollars(result.financials.netReconciliationVarianceCents)}`);
  console.log('--------------------------------------------------');
  console.log(`Expected postings:    ${result.input.expected?.debitPostingCount ?? 0} Debit / ${result.input.expected?.creditPostingCount ?? 0} Credit`);
  console.log(`Observed postings:    ${result.input.observed?.debitPostingCount ?? 0} Debit / ${result.input.observed?.creditPostingCount ?? 0} Credit`);
  console.log('--------------------------------------------------');
  console.log('Findings:');
  if (result.findingCodes.length === 0) {
    console.log('  - NONE (All financial invariants satisfied)');
  } else {
    result.findingCodes.forEach(code => console.log(`  - ${code}`));
  }
  console.log('--------------------------------------------------');
  console.log(`Risk:             ${result.riskLevel}`);
  console.log(`Decision:         >>> ${result.recommendation} <<<`);
  console.log(`Reason:           ${result.decisionReason}`);
  console.log(`Reports:          ${outputFolder}`);
  console.log('==================================================');
  console.log('                SIMULATED RESULT                  ');
  console.log(' No real banking system or customer data was used.');
  console.log(' Final release approval remains human-controlled. ');
  console.log('==================================================\n');
}

async function main(): Promise<void> {
  const { inputPath, outputPath, overwrite, skipCi } = parseCliArgs(process.argv.slice(2));

  if (!inputPath) {
    console.error('Error: Missing required --input argument.\n');
    console.error('Usage:');
    console.error('  npm run agent -- --input ./input/test-data.json');
    console.error('  npm run agent -- --input ./input/test-data.csv [--output ./results] [--overwrite]');
    process.exit(ExitCode.INPUT_REJECTED);
  }

  const resolvedInput = path.resolve(process.cwd(), inputPath);
  if (!fs.existsSync(resolvedInput)) {
    console.error(`Error: Input file does not exist at path: ${resolvedInput}`);
    process.exit(ExitCode.INPUT_REJECTED);
  }

  const resolvedOutput = path.resolve(process.cwd(), outputPath);
  fs.mkdirSync(resolvedOutput, { recursive: true });

  const isCsv = resolvedInput.toLowerCase().endsWith('.csv');
  const fileContent = fs.readFileSync(resolvedInput, 'utf-8');

  if (isCsv) {
    const records = CoreBankClientEngine.parseCsv(fileContent);
    if (records.length === 0) {
      console.error('Error: CSV file contains no valid data rows or headers.');
      process.exit(ExitCode.INPUT_REJECTED);
    }

    console.log(`[COREBANK AGENT] Processing batch CSV with ${records.length} record(s)...`);

    const results: EvaluationResult[] = [];
    let worstExitCode: ExitCode = ExitCode.PASS;

    for (const record of records) {
      const evaluation = CoreBankClientEngine.evaluate(record);
      const outFolder = CoreBankClientEngine.writeOutputArtifacts(evaluation, resolvedOutput, overwrite);
      results.push(evaluation);
      printConsoleSummary(evaluation, outFolder);

      if (evaluation.exitCode > worstExitCode) {
        worstExitCode = evaluation.exitCode;
      }
    }

    // Write batch summary
    const batchSummary = {
      evaluatedAt: new Date().toISOString(),
      totalRecords: records.length,
      passedCount: results.filter(r => r.recommendation === 'PASS').length,
      doNotReleaseCount: results.filter(r => r.recommendation === 'DO NOT RELEASE').length,
      passWithRiskCount: results.filter(r => r.recommendation === 'PASS WITH RISK').length,
      rejectedCount: results.filter(r => r.inputStatus === 'INPUT_REJECTED').length,
      batchExitCode: worstExitCode,
      batchRecommendation: worstExitCode === ExitCode.DO_NOT_RELEASE ? 'DO NOT RELEASE' : (worstExitCode === ExitCode.INPUT_REJECTED ? 'INPUT_REJECTED' : 'PASS'),
      records: results.map(r => ({
        requestId: r.requestId,
        recommendation: r.recommendation,
        findingCodes: r.findingCodes,
        exitCode: r.exitCode
      }))
    };
    fs.writeFileSync(path.join(resolvedOutput, 'batch-summary.json'), JSON.stringify(batchSummary, null, 2));
    console.log(`[COREBANK AGENT] Batch summary written to: ${path.join(resolvedOutput, 'batch-summary.json')}`);

    if (!skipCi) {
      const label = results[0]?.requestId ?? path.basename(resolvedInput, path.extname(resolvedInput));
      await pushAndTriggerCi({ inputFilePath: resolvedInput, resultsFolderPath: resolvedOutput, executionLabel: label });
    }

    process.exit(worstExitCode);
  } else {
    let rawJson: any;
    try {
      rawJson = JSON.parse(fileContent);
    } catch (e) {
      console.error('Error: Failed to parse input JSON file. Ensure valid JSON format.');
      process.exit(ExitCode.INPUT_REJECTED);
    }

    const evaluation = CoreBankClientEngine.evaluate(rawJson);
    const outFolder = CoreBankClientEngine.writeOutputArtifacts(evaluation, resolvedOutput, overwrite);
    printConsoleSummary(evaluation, outFolder);

    if (!skipCi) {
      await pushAndTriggerCi({
        inputFilePath: resolvedInput,
        resultsFolderPath: path.resolve(outFolder),
        executionLabel: evaluation.requestId,
      });
    }

    process.exit(evaluation.exitCode);
  }
}

if (require.main === module) {
  main().catch((err: any) => {
    console.error(`Internal Agent Error: ${err?.message || 'Unexpected failure'}`);
    process.exit(ExitCode.INTERNAL_AGENT_ERROR);
  });
}
