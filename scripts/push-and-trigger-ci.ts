/**
 * push-and-trigger-ci.ts
 *
 * After a local agent evaluation completes, this module:
 *   1. Reads GitHub credentials from .env (GITHUB_TOKEN, GITHUB_OWNER,
 *      GITHUB_REPO, GITHUB_BRANCH, GITHUB_WORKFLOW_FILE).
 *   2. Commits the evaluated input file + generated results folder via the
 *      GitHub Contents API (no local git required).
 *   3. Dispatches a workflow_dispatch event against the configured workflow
 *      so GitHub Actions re-runs the full CI pipeline on the new data.
 *
 * If any env var is missing the function logs a warning and returns without
 * error — the agent evaluation result is always written locally regardless.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

// Load .env file manually (no third-party dotenv needed at runtime)
function loadEnv(): void {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (key && !(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function githubRequest(
  method: string,
  urlPath: string,
  token: string,
  body?: object
): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : undefined;
    const options: https.RequestOptions = {
      hostname: 'api.github.com',
      path: urlPath,
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'CoreBankQAAgent/1.0',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {})
      }
    };

    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode ?? 0, data: raw ? JSON.parse(raw) : {} });
        } catch {
          resolve({ status: res.statusCode ?? 0, data: raw });
        }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function upsertFile(
  token: string, owner: string, repo: string, branch: string,
  filePath: string, content: string, message: string
): Promise<void> {
  const apiPath = `/repos/${owner}/${repo}/contents/${filePath}`;

  // Check if file already exists to get its SHA (required for updates)
  const existing = await githubRequest('GET', `${apiPath}?ref=${branch}`, token);
  const sha: string | undefined = existing.status === 200 ? existing.data?.sha : undefined;

  const body: any = {
    message,
    content: Buffer.from(content).toString('base64'),
    branch
  };
  if (sha) body.sha = sha;

  const result = await githubRequest('PUT', apiPath, token, body);
  if (result.status !== 200 && result.status !== 201) {
    console.warn(`[CI] Warning: Failed to upsert ${filePath} (HTTP ${result.status})`);
  }
}

export interface CiTriggerOptions {
  inputFilePath: string;
  resultsFolderPath: string;
  executionLabel: string;
}

export async function pushAndTriggerCi(opts: CiTriggerOptions): Promise<void> {
  loadEnv();

  const token = process.env['GITHUB_TOKEN'];
  const owner = process.env['GITHUB_OWNER'];
  const repo = process.env['GITHUB_REPO'];
  const branch = process.env['GITHUB_BRANCH'] ?? 'main';
  const workflowFile = process.env['GITHUB_WORKFLOW_FILE'] ?? 'corebank-qa-agent.yml';

  if (!token || !owner || !repo ||
      token === 'REPLACE_WITH_YOUR_PERSONAL_ACCESS_TOKEN') {
    console.log('[CI] Skipping auto CI/CD push — GITHUB_TOKEN / GITHUB_OWNER / GITHUB_REPO not configured in .env');
    return;
  }

  console.log(`[CI] Pushing evaluation artifacts to ${owner}/${repo} and triggering GitHub Actions...`);

  try {
    // 1. Push the input file that was evaluated
    const inputRelative = path.relative(process.cwd(), opts.inputFilePath).replace(/\\/g, '/');
    const inputContent = fs.readFileSync(opts.inputFilePath, 'utf-8');
    await upsertFile(token, owner, repo, branch, inputRelative, inputContent,
      `ci: update input file for ${opts.executionLabel}`);

    // 2. Push generated result files (only JSON + md, skip large binaries)
    if (fs.existsSync(opts.resultsFolderPath)) {
      const files = fs.readdirSync(opts.resultsFolderPath, { withFileTypes: true });
      for (const f of files) {
        if (!f.isFile()) continue;
        if (!/\.(json|md|txt|xml)$/.test(f.name)) continue;
        const fullPath = path.join(opts.resultsFolderPath, f.name);
        const relPath = path.relative(process.cwd(), fullPath).replace(/\\/g, '/');
        const content = fs.readFileSync(fullPath, 'utf-8');
        await upsertFile(token, owner, repo, branch, relPath, content,
          `ci: results for ${opts.executionLabel} [${f.name}]`);
      }
    }

    // 3. Dispatch workflow_dispatch to trigger the CI pipeline
    const dispatchPath = `/repos/${owner}/${repo}/actions/workflows/${workflowFile}/dispatches`;
    const dispatchResult = await githubRequest('POST', dispatchPath, token, {
      ref: branch,
      inputs: {
        input_file: inputRelative,
        execution_label: opts.executionLabel
      }
    });

    if (dispatchResult.status === 204) {
      console.log(`[CI] ✅ GitHub Actions workflow dispatched successfully for "${opts.executionLabel}"`);
      console.log(`[CI] Monitor at: https://github.com/${owner}/${repo}/actions`);
    } else {
      console.warn(`[CI] Warning: Workflow dispatch returned HTTP ${dispatchResult.status}`);
    }
  } catch (err: any) {
    // Non-fatal — local results are always written regardless
    console.warn(`[CI] Warning: Auto CI/CD push failed: ${err?.message ?? err}`);
  }
}
