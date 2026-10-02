#!/usr/bin/env node
/**
 * Board check: BoosterSeat repos track work on the Dark Mechanicus board by default, and this
 * script is loud when the repo is not set up for it. It runs at agent session start, on
 * `npm install`, before `npm run dev`, on pre-commit, and in CI.
 *
 * It warns but never blocks (exit 0) unless `--strict` is passed. The markdown `/board` is an
 * explicit opt-out: `"board": "markdown"` in `.boosterseatrc.json`.
 *
 * The project.json rules mirror Dark Mechanicus' own `projectRecord` schema
 * (src/core/repo/portable.ts in davgor/DarkMechanicus).
 */
import { spawnSync } from 'node:child_process';
import {
  appendFileSync,
  existsSync,
  lstatSync,
  readdirSync,
  readFileSync,
  realpathSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const RC_FILE = '.boosterseatrc.json';
const RC_KEYS = ['board'];
const DM_DIR = '.darkmechanicus';
const DOC = 'docs/dark-mechanicus.md';
const BOARD_MODES = ['darkmechanicus', 'markdown'];
const OPEN_TICKET_DIRS = ['board/backlog', 'board/in-progress'];
const MAX_LISTED = 10;

const PROJECT_KEYS = ['format', 'formatVersion', 'projectId', 'name', 'keyPrefix', 'createdAt'];
const PROJECT_ID_PATTERN = /^pj_[0-9a-hjkmnp-tv-z]{26}$/;
const KEY_PREFIX_PATTERN = /^[A-Z][A-Z0-9]{0,11}$/;
// Same shape as zod's `z.iso.datetime({ offset: true })`: seconds required, Z or ±HH:MM offset.
const ISO_DATETIME_WITH_OFFSET =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/;
const MERGE_MARKER_PATTERN = /(?:^|\n)(?:<{7} |>{7} |\|{7} |={7}\r?(?:\n|$))/;
const MAX_NAME_LENGTH = 200;
const LOCAL_IGNORE_PATTERNS = ['local', 'local/', 'local/*', 'local/**'];
const LOCAL_NOT_IGNORED = `${DM_DIR}/.gitignore must ignore local/ so the working database (local/state.sqlite) is never committed.`;

const USAGE = `Usage: node scripts/check-darkmechanicus.mjs [--hook | --github] [--strict]

Checks that this repository is set up for the Dark Mechanicus board.

  --hook     Print Claude Code SessionStart hook JSON instead of text
  --github   Also print GitHub Actions warning annotations and append the step summary
  --strict   Exit 1 when Dark Mechanicus is required but not set up (default: warn, exit 0)
  --help     Show this message
`;

/** Repo-controlled text (file names, keys) goes out JSON-quoted: one line, no forged commands. */
const quote = (text) => JSON.stringify(String(text));
const oneLine = (text) => String(text).replace(/[\u0000-\u001f\u007f]+/g, ' ');

function quotedList(items) {
  const listed = items.slice(0, MAX_LISTED).map(quote).join(', ');
  return items.length > MAX_LISTED ? `${listed} and ${items.length - MAX_LISTED} more` : listed;
}

/** A real calendar date-time; Date.parse alone rolls 2026-02-30 forward instead of rejecting it. */
function isIsoDateTime(text) {
  const match = typeof text === 'string' ? ISO_DATETIME_WITH_OFFSET.exec(text) : null;
  if (match === null) {
    return false;
  }
  const [year, month, day, hour, minute, second] = match.slice(1).map(Number);
  if (month < 1 || month > 12) {
    return false;
  }
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return day >= 1 && day <= daysInMonth && hour <= 23 && minute <= 59 && second <= 59;
}

const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

function readBoardMode(root, warnings) {
  const rcPath = join(root, RC_FILE);
  if (!existsSync(rcPath)) {
    return 'darkmechanicus';
  }
  let rc;
  try {
    rc = JSON.parse(readFileSync(rcPath, 'utf8'));
  } catch {
    warnings.push(`${RC_FILE} is not valid JSON; using the default board (darkmechanicus).`);
    return 'darkmechanicus';
  }
  if (!isPlainObject(rc)) {
    warnings.push(`${RC_FILE} must be a JSON object; using the default board (darkmechanicus).`);
    return 'darkmechanicus';
  }
  const unknown = Object.keys(rc).filter((key) => !RC_KEYS.includes(key));
  if (unknown.length > 0) {
    warnings.push(`${RC_FILE} has unknown key(s) ${quotedList(unknown)}; only "board" is read.`);
  }
  const board = rc.board;
  if (board === undefined) {
    return 'darkmechanicus';
  }
  if (!BOARD_MODES.includes(board)) {
    warnings.push(
      `${RC_FILE} has "board": ${quote(board)}; expected one of ${BOARD_MODES.map((m) => `"${m}"`).join(', ')}. Using "darkmechanicus".`
    );
    return 'darkmechanicus';
  }
  return board;
}

/** Same rules as Dark Mechanicus' `projectRecord` (a zod strictObject). */
function projectFieldProblems(record) {
  const problems = [];
  const unknown = Object.keys(record).filter((key) => !PROJECT_KEYS.includes(key));
  if (unknown.length > 0) {
    problems.push(`unknown key(s) ${quotedList(unknown)}`);
  }
  if (record.format !== 'darkmechanicus.project') {
    problems.push('"format" must be "darkmechanicus.project"');
  }
  if (record.formatVersion !== 1) {
    problems.push('"formatVersion" must be 1');
  }
  if (typeof record.projectId !== 'string' || !PROJECT_ID_PATTERN.test(record.projectId)) {
    problems.push('"projectId" must be a Dark Mechanicus project id (pj_…)');
  }
  const nameLength = typeof record.name === 'string' ? [...record.name].length : 0;
  if (nameLength < 1 || nameLength > MAX_NAME_LENGTH) {
    problems.push(`"name" must be 1-${MAX_NAME_LENGTH} characters`);
  }
  if (typeof record.keyPrefix !== 'string' || !KEY_PREFIX_PATTERN.test(record.keyPrefix)) {
    problems.push('"keyPrefix" must be 1-12 uppercase letters or digits, starting with a letter');
  }
  if (!isIsoDateTime(record.createdAt)) {
    problems.push('"createdAt" must be an ISO date-time with seconds and a Z or ±HH:MM offset');
  }
  return problems;
}

/** Validates `.darkmechanicus/project.json`; returns the project or pushes problems. */
function readProject(root, problems) {
  const projectPath = join(root, DM_DIR, 'project.json');
  const stat = lstatSync(projectPath, { throwIfNoEntry: false });
  if (stat === undefined) {
    problems.push(`${DM_DIR}/project.json not found: the repository has not been initialized.`);
    return null;
  }
  if (stat.isSymbolicLink()) {
    problems.push(`${DM_DIR}/project.json is a symbolic link; Dark Mechanicus refuses to read it.`);
    return null;
  }
  if (!stat.isFile()) {
    problems.push(`${DM_DIR}/project.json could not be read (it is not a regular file).`);
    return null;
  }
  let text;
  try {
    text = readFileSync(projectPath, 'utf8');
  } catch (error) {
    problems.push(`${DM_DIR}/project.json could not be read (${error.code ?? 'read error'}).`);
    return null;
  }
  if (MERGE_MARKER_PATTERN.test(text)) {
    problems.push(`${DM_DIR}/project.json has unresolved merge conflict markers.`);
    return null;
  }
  let record;
  try {
    record = JSON.parse(text);
  } catch {
    problems.push(`${DM_DIR}/project.json is not valid JSON.`);
    return null;
  }
  if (!isPlainObject(record)) {
    problems.push(`${DM_DIR}/project.json must be a JSON object.`);
    return null;
  }
  const fieldProblems = projectFieldProblems(record);
  if (fieldProblems.length > 0) {
    problems.push(`${DM_DIR}/project.json is invalid: ${fieldProblems.join('; ')}.`);
    return null;
  }
  return { name: record.name, keyPrefix: record.keyPrefix };
}

/** Runs git in `root`; null when git is unavailable. */
function git(root, args) {
  const result = spawnSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  return result.error ? null : result;
}

/** Inside a git repository, ask git; it sees every ignore file and negation. */
function checkIgnoreRulesWithGit(root, problems) {
  // Confirm a working tree first, so a failing git shim's exit 1 is not read as "not ignored".
  const workTree = git(root, ['rev-parse', '--is-inside-work-tree']);
  if (workTree?.status !== 0 || workTree.stdout.trim() !== 'true') {
    return false;
  }
  const localIgnored = git(root, [
    'check-ignore',
    '-q',
    '--no-index',
    `${DM_DIR}/local/state.sqlite`,
  ]);
  if (localIgnored === null || ![0, 1].includes(localIgnored.status)) {
    return false;
  }
  if (localIgnored.status === 1) {
    problems.push(LOCAL_NOT_IGNORED);
  }
  const tracked = git(root, ['ls-files', '--', `${DM_DIR}/local`]);
  const trackedCount =
    tracked?.status === 0 ? tracked.stdout.split('\n').filter(Boolean).length : 0;
  if (trackedCount > 0) {
    problems.push(
      `${trackedCount} file(s) under ${DM_DIR}/local/ are tracked by git; untrack them with: git rm -r --cached ${DM_DIR}/local`
    );
  }
  const stateIgnored = git(root, ['check-ignore', '-q', '--no-index', `${DM_DIR}/project.json`]);
  if (stateIgnored?.status === 0) {
    problems.push(
      `${DM_DIR}/project.json is ignored by git, so plans and history never reach the repository; remove the rule that ignores ${DM_DIR}/.`
    );
  }
  return true;
}

/** Without git, read `.darkmechanicus/.gitignore` directly. */
function checkIgnoreFile(root, problems) {
  const gitignorePath = join(root, DM_DIR, '.gitignore');
  let text = '';
  try {
    text = readFileSync(gitignorePath, 'utf8');
  } catch {
    // Missing or unreadable: reported below like any .gitignore that does not ignore local/.
  }
  const ignoresLocal = text
    .split(/\r?\n/)
    .some((line) => LOCAL_IGNORE_PATTERNS.includes(line.trim().replace(/^\//, '')));
  if (!ignoresLocal) {
    problems.push(LOCAL_NOT_IGNORED);
  }
}

function openMarkdownTickets(root) {
  return OPEN_TICKET_DIRS.flatMap((dir) => {
    const full = join(root, dir);
    if (lstatSync(full, { throwIfNoEntry: false })?.isDirectory() !== true) {
      return [];
    }
    return readdirSync(full)
      .filter((name) => name.endsWith('.md'))
      .sort()
      .map((name) => `${dir}/${name}`);
  });
}

/**
 * Inspects the repository at `root`.
 * `ready` is true when the markdown board is opted into, or Dark Mechanicus is fully set up.
 * `problems` are setup gaps that make Dark Mechanicus unusable; `warnings` need attention but
 * do not stop the board from working. Repo-controlled text in either is JSON-quoted.
 */
export function checkBoard(root) {
  const problems = [];
  const warnings = [];
  const mode = readBoardMode(root, warnings);
  if (mode === 'markdown') {
    return { mode, ready: true, problems, warnings, project: null };
  }

  let project = null;
  const dmStat = lstatSync(join(root, DM_DIR), { throwIfNoEntry: false });
  if (dmStat === undefined) {
    problems.push(
      `${DM_DIR}/ not found: this repository has not been initialized for Dark Mechanicus.`
    );
  } else if (dmStat.isSymbolicLink()) {
    problems.push(`${DM_DIR} is a symbolic link; Dark Mechanicus requires a real directory.`);
  } else if (!dmStat.isDirectory()) {
    problems.push(`${DM_DIR} exists but is not a directory.`);
  } else {
    project = readProject(root, problems);
    if (!checkIgnoreRulesWithGit(root, problems)) {
      checkIgnoreFile(root, problems);
    }
  }

  const leftovers = openMarkdownTickets(root);
  if (leftovers.length > 0) {
    warnings.push(
      `${leftovers.length} markdown ticket(s) are still open on the legacy /board and are not tracked by Dark Mechanicus: ${quotedList(leftovers)}. Move them into Dark Mechanicus, or opt out with "board": "markdown" in ${RC_FILE}.`
    );
  }

  return {
    mode,
    ready: problems.length === 0,
    problems,
    warnings,
    project: problems.length === 0 ? project : null,
  };
}

function readyLine(result) {
  if (result.mode === 'markdown') {
    return `Board: markdown /board (Dark Mechanicus opted out via ${RC_FILE}).`;
  }
  const { name, keyPrefix } = result.project;
  return `Dark Mechanicus board: ready (project ${quote(name)}, ticket keys ${keyPrefix}-<n>).`;
}

const bullets = (items) => items.map((item) => `  - ${item}`).join('\n');

export function renderText(result, { color = false } = {}) {
  const paint = (code, text) => (color ? `\u001b[${code}m${text}\u001b[0m` : text);
  const warningBlock =
    result.warnings.length > 0
      ? `${paint('33;1', 'Board warnings:')}\n${bullets(result.warnings)}\n`
      : '';
  if (result.ready) {
    return `${readyLine(result)}\n${warningBlock}`;
  }
  const rule = '#'.repeat(78);
  return [
    paint('31;1', rule),
    paint('31;1', '##  DARK MECHANICUS IS NOT SET UP FOR THIS REPO'),
    paint('31;1', rule),
    'BoosterSeat repos track work on the Dark Mechanicus board, and this repository is not ready:',
    bullets(result.problems),
    '',
    warningBlock,
    'Fix it:',
    '  1. Open the Dark Mechanicus desktop app, press + and track this folder.',
    '  2. Initialize the repository, then commit .darkmechanicus/ (local/ stays ignored).',
    '  3. Connect your agent over MCP (snippet on the setup screen) and press "Install agent skills".',
    `  Details: ${DOC}`,
    '',
    `To use the legacy markdown /board instead, set "board": "markdown" in ${RC_FILE}.`,
    paint('31;1', rule),
    '',
  ]
    .filter((line, index, lines) => !(line === '' && lines[index - 1] === ''))
    .join('\n');
}

export function renderHook(result) {
  const warningText =
    result.warnings.length > 0 ? `\n\nBoard warnings:\n${bullets(result.warnings)}` : '';
  let additionalContext;
  let systemMessage;
  if (!result.ready) {
    additionalContext = [
      'DARK MECHANICUS IS NOT SET UP FOR THIS REPO.',
      'This repository tracks work on the Dark Mechanicus board (the BoosterSeat default). Problems:',
      bullets(result.problems),
      '',
      `Before any implementation or board work: tell the user, at the top of your reply, that Dark Mechanicus is not set up, list the problems above, and point them to ${DOC}.`,
      'Do not fall back to the markdown /board, do not invent ticket ids, and do not hand-write .darkmechanicus/ files.',
      `Continue without board tracking only if the user explicitly says so, or after they opt out with "board": "markdown" in ${RC_FILE}.`,
      `Only the user opts this repo out or sets it up: never edit ${RC_FILE}, call initialize_repository, or change --strict yourself to quiet this warning. Offer to, and act only on their explicit go-ahead.`,
    ].join('\n');
    systemMessage = `⚠️ Dark Mechanicus is not set up for this repo; board work is blocked until it is. ${result.problems.join(' ')} See ${DOC}.`;
  } else if (result.mode === 'markdown') {
    additionalContext = `${readyLine(result)} Follow the markdown board flow in the complete-ticket skill.`;
  } else {
    additionalContext = `${readyLine(result)} Track work through the Dark Mechanicus MCP tools, and confirm with get_capabilities that the server is connected to this repository and reports initialized. If those tools are missing, tell the user the Dark Mechanicus MCP server is not connected (${DOC}) before doing board work.`;
  }
  if (result.warnings.length > 0) {
    additionalContext += warningText;
    systemMessage = [systemMessage, `Board warnings: ${result.warnings.join(' ')}`]
      .filter(Boolean)
      .join(' ');
  }
  return {
    ...(systemMessage === undefined ? {} : { systemMessage }),
    hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext },
  };
}

const escapeAnnotation = (text) =>
  text.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');

export function renderGithub(result) {
  const annotations = [
    ...result.problems.map(
      (p) => `::warning title=Dark Mechanicus not set up::${escapeAnnotation(p)}`
    ),
    ...result.warnings.map((w) => `::warning title=Board::${escapeAnnotation(w)}`),
  ];
  if (annotations.length === 0) {
    return { annotations: '', summary: '' };
  }
  const heading = result.ready ? '### ⚠️ Board warnings' : '### ⚠️ Dark Mechanicus is not set up';
  const summary = [
    heading,
    '',
    ...[...result.problems, ...result.warnings].map((item) => `- ${item}`),
    '',
    `Setup and opt-out: [\`${DOC}\`](${DOC})`,
    '',
  ].join('\n');
  return { annotations: `${annotations.join('\n')}\n`, summary };
}

function parseArgs(argv) {
  const options = { hook: false, github: false, strict: false, help: false };
  for (const arg of argv) {
    const key = { '--hook': 'hook', '--github': 'github', '--strict': 'strict', '--help': 'help' }[
      arg
    ];
    if (key === undefined) {
      return { error: `Unknown option: ${arg}` };
    }
    options[key] = true;
  }
  if (options.hook && options.github) {
    return { error: '--hook and --github cannot be combined' };
  }
  return { options };
}

/** CLI entry point; returns the exit code. */
export function run(
  argv,
  { root = DEFAULT_ROOT, env = process.env, stdout = process.stdout, stderr = process.stderr } = {}
) {
  const { options, error } = parseArgs(argv);
  if (error !== undefined) {
    stderr.write(`${error}\n\n${USAGE}`);
    return 2;
  }
  if (options.help) {
    stdout.write(USAGE);
    return 0;
  }

  let result;
  try {
    result = checkBoard(root);
  } catch (error) {
    // Report rather than crash, so every mode (including the hook's JSON) still says something.
    result = {
      mode: 'darkmechanicus',
      ready: false,
      problems: [`The board check itself failed (${oneLine(error?.message ?? error)}).`],
      warnings: [],
      project: null,
    };
  }
  if (options.hook) {
    stdout.write(`${JSON.stringify(renderHook(result))}\n`);
  } else {
    const text = renderText(result, { color: Boolean(stderr.isTTY) && env.NO_COLOR === undefined });
    if (result.ready && result.warnings.length === 0) {
      stdout.write(text);
    } else {
      stderr.write(text);
    }
    if (options.github) {
      const { annotations, summary } = renderGithub(result);
      stdout.write(annotations);
      if (summary !== '' && env.GITHUB_STEP_SUMMARY) {
        appendFileSync(env.GITHUB_STEP_SUMMARY, summary);
      }
    }
  }
  return options.strict && !result.ready ? 1 : 0;
}

/** True when run as a script, including through a symlinked path (argv[1] is not resolved). */
function isMain() {
  try {
    return (
      Boolean(process.argv[1]) &&
      realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))
    );
  } catch {
    return false;
  }
}

if (isMain()) {
  const strict = process.argv.includes('--strict');
  try {
    process.exitCode = run(process.argv.slice(2));
  } catch (error) {
    // A bug in this check must never break npm install, dev, or commits unless --strict asked for it.
    process.stderr.write(`Dark Mechanicus board check crashed: ${error?.stack ?? error}\n`);
    process.exitCode = strict ? 1 : 0;
  }
}
