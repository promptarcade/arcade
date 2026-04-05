// ============================================================
// Claude Worker — spawns isolated claude CLI calls
// ============================================================
// Context isolation: runs from a clean temp directory so no
// CLAUDE.md or project context leaks into the worker.
//
// Provides both sync (callClaude) and async (callClaudeAsync)
// versions. Use async for parallel sprite/mechanic generation.

const { spawnSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const GIT_BASH = 'C:\\Utilities\\Git\\bin\\bash.exe';

// Fresh directory per run — prevents cross-run contamination
const RUN_ID = Date.now() + '_' + Math.random().toString(36).slice(2, 8);
const CLEAN_DIR = path.join(os.tmpdir(), 'blind-pipeline-' + RUN_ID);
fs.mkdirSync(CLEAN_DIR, { recursive: true });

let callCounter = 0;

function buildCmd({ prompt, systemPrompt, schema, model }) {
  const id = ++callCounter;
  const promptFile = path.join(CLEAN_DIR, `prompt-${id}.txt`);
  fs.writeFileSync(promptFile, prompt);

  let cmd = `cat "${promptFile}" | claude -p --output-format json --model ${model} --no-session-persistence`;
  cmd += ` --disallowed-tools "Agent,Edit,Write,Bash,Glob,Grep,Read,WebSearch,WebFetch,NotebookEdit"`;

  if (systemPrompt) {
    const sysFile = path.join(CLEAN_DIR, `system-${id}.txt`);
    fs.writeFileSync(sysFile, systemPrompt);
    cmd += ` --system-prompt-file "${sysFile}"`;
  }

  if (schema) {
    const schemaFile = path.join(CLEAN_DIR, `schema-${id}.json`);
    fs.writeFileSync(schemaFile, JSON.stringify(schema));
    cmd += ` --json-schema "$(cat '${schemaFile}')"`;
  }

  return { cmd, promptFile };
}

function parseResponse(stdout, schema) {
  const response = JSON.parse(stdout);

  if (response.is_error) {
    throw new Error(`Claude error: ${response.result}`);
  }

  if (schema && response.structured_output) {
    return { data: response.structured_output, cost: response.total_cost_usd || 0 };
  }

  const text = response.result || '';
  let data;
  try {
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    data = JSON.parse(jsonMatch ? jsonMatch[1].trim() : text.trim());
  } catch {
    data = text;
  }
  return { data, cost: response.total_cost_usd || 0 };
}

// Synchronous version
function callClaude({ prompt, systemPrompt, schema, model = 'sonnet', maxRetries = 3, budgetUsd = 0.50 }) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { cmd, promptFile } = buildCmd({ prompt, systemPrompt, schema, model });
      const env = { ...process.env, CLAUDE_CODE_GIT_BASH_PATH: GIT_BASH };

      const result = spawnSync('bash', ['-c', cmd], {
        encoding: 'utf8', maxBuffer: 10 * 1024 * 1024,
        timeout: 300_000, env, cwd: CLEAN_DIR,
      });

      try { fs.unlinkSync(promptFile); } catch {}
      if (result.error) throw result.error;

      const stdout = (result.stdout || '').trim();
      if (!stdout) throw new Error(`Empty output. stderr: ${(result.stderr || '').slice(0, 200)}`);

      const parsed = parseResponse(stdout, schema);
      return { ...parsed, model };
    } catch (err) {
      console.error(`  [worker:${model}] attempt ${attempt}/${maxRetries} failed: ${err.message.slice(0, 200)}`);
      if (attempt === maxRetries) throw new Error(`Worker failed after ${maxRetries} attempts: ${err.message}`);
    }
  }
}

// Async version — spawns bash without blocking the event loop
function callClaudeAsync({ prompt, systemPrompt, schema, model = 'sonnet', maxRetries = 3 }) {
  return new Promise((resolve, reject) => {
    let attempt = 0;

    function tryOnce() {
      attempt++;
      const { cmd, promptFile } = buildCmd({ prompt, systemPrompt, schema, model });
      const env = { ...process.env, CLAUDE_CODE_GIT_BASH_PATH: GIT_BASH };

      const proc = spawn('bash', ['-c', cmd], {
        env, cwd: CLEAN_DIR, stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stdout = '', stderr = '';
      proc.stdout.on('data', d => stdout += d);
      proc.stderr.on('data', d => stderr += d);

      const timeoutMs = 180_000;
      const timer = setTimeout(() => {
        proc.kill('SIGTERM');
        reject(new Error(`Timeout after ${timeoutMs/1000}s (${model})`));
      }, timeoutMs);

      proc.on('close', (code) => {
        clearTimeout(timer);
        try { fs.unlinkSync(promptFile); } catch {}

        try {
          stdout = stdout.trim();
          if (!stdout) throw new Error(`Empty output. stderr: ${stderr.slice(0, 200)}`);
          const parsed = parseResponse(stdout, schema);
          resolve({ ...parsed, model });
        } catch (err) {
          console.error(`  [worker:${model}] attempt ${attempt}/${maxRetries} failed: ${err.message.slice(0, 150)}`);
          if (attempt < maxRetries) {
            tryOnce();
          } else {
            reject(new Error(`Worker failed after ${maxRetries} attempts: ${err.message}`));
          }
        }
      });
    }

    tryOnce();
  });
}

module.exports = { callClaude, callClaudeAsync };
