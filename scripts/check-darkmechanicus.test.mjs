import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { checkBoard, renderGithub, renderHook, renderText, run } from './check-darkmechanicus.mjs';

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), 'check-darkmechanicus.mjs');
const HAS_GIT = spawnSync('git', ['--version']).status === 0;
const CAN_SYMLINK = process.platform !== 'win32';

const VALID_PROJECT = {
  createdAt: '2026-10-01T05:07:52.325Z',
  format: 'darkmechanicus.project',
  formatVersion: 1,
  keyPrefix: 'BS',
  name: 'Demo',
  projectId: 'pj_01m3txs8c4mvznc219cqssvdvd',
};

const tempDirs = [];
afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function tempDir() {
  const dir = mkdtempSync(join(tmpdir(), 'board-check-'));
  tempDirs.push(dir);
  return dir;
}

function git(root, ...args) {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  if (result.status !== 0) {
    throw new Error(`git ${args.join(' ')} failed: ${result.stderr}`);
  }
}

function makeRepo({ rc, project = VALID_PROJECT, gitignore = 'local/\n', dm = true } = {}) {
  const root = tempDir();
  if (rc !== undefined) {
    writeFileSync(
      join(root, '.boosterseatrc.json'),
      typeof rc === 'string' ? rc : JSON.stringify(rc)
    );
  }
  if (dm) {
    mkdirSync(join(root, '.darkmechanicus'));
    if (project !== null) {
      const text = typeof project === 'string' ? project : `${JSON.stringify(project, null, 2)}\n`;
      writeFileSync(join(root, '.darkmechanicus', 'project.json'), text);
    }
    if (gitignore !== null) {
      writeFileSync(join(root, '.darkmechanicus', '.gitignore'), gitignore);
    }
  }
  return root;
}

function capture() {
  let text = '';
  return {
    write(chunk) {
      text += chunk;
      return true;
    },
    get text() {
      return text;
    },
  };
}

function runIn(root, argv = [], env = {}) {
  const stdout = capture();
  const stderr = capture();
  const code = run(argv, { root, env, stdout, stderr });
  return { code, stdout: stdout.text, stderr: stderr.text };
}

describe('checkBoard: board mode', () => {
  it('defaults to darkmechanicus when there is no .boosterseatrc.json', () => {
    const result = checkBoard(makeRepo());
    expect(result.mode).toBe('darkmechanicus');
    expect(result.ready).toBe(true);
    expect(result.problems).toEqual([]);
    expect(result.warnings).toEqual([]);
    expect(result.project).toEqual({ name: 'Demo', keyPrefix: 'BS' });
  });

  it('honours an explicit markdown opt-out without requiring .darkmechanicus/', () => {
    const result = checkBoard(makeRepo({ rc: { board: 'markdown' }, dm: false }));
    expect(result.mode).toBe('markdown');
    expect(result.ready).toBe(true);
    expect(result.problems).toEqual([]);
    expect(result.project).toBeNull();
  });

  it('falls back to darkmechanicus and warns on an unknown board value', () => {
    const result = checkBoard(makeRepo({ rc: { board: 'markdwon' }, dm: false }));
    expect(result.mode).toBe('darkmechanicus');
    expect(result.ready).toBe(false);
    expect(result.warnings.join('\n')).toMatch(/"markdwon"/);
  });

  it('warns about unknown keys in .boosterseatrc.json (a typo must not silently become the default)', () => {
    const result = checkBoard(makeRepo({ rc: { Board: 'markdown' } }));
    expect(result.mode).toBe('darkmechanicus');
    expect(result.warnings.join('\n')).toMatch(/unknown key.*"Board"/);
  });

  it('warns when .boosterseatrc.json is not a JSON object', () => {
    const result = checkBoard(makeRepo({ rc: '"markdown"' }));
    expect(result.mode).toBe('darkmechanicus');
    expect(result.warnings.join('\n')).toMatch(/must be a JSON object/);
  });

  it('falls back to darkmechanicus and warns when .boosterseatrc.json is not valid JSON', () => {
    const result = checkBoard(makeRepo({ rc: '{ board: markdown' }));
    expect(result.mode).toBe('darkmechanicus');
    expect(result.ready).toBe(true);
    expect(result.warnings.join('\n')).toMatch(/\.boosterseatrc\.json.*not valid JSON/);
  });
});

describe('checkBoard: Dark Mechanicus setup problems', () => {
  it('flags a repository that was never initialized', () => {
    const result = checkBoard(makeRepo({ dm: false }));
    expect(result.ready).toBe(false);
    expect(result.problems).toHaveLength(1);
    expect(result.problems[0]).toMatch(/\.darkmechanicus\/ not found/);
    expect(result.project).toBeNull();
  });

  it.skipIf(!CAN_SYMLINK)('flags a symlinked .darkmechanicus/', () => {
    const root = makeRepo({ dm: false });
    const elsewhere = makeRepo();
    symlinkSync(join(elsewhere, '.darkmechanicus'), join(root, '.darkmechanicus'));
    const result = checkBoard(root);
    expect(result.ready).toBe(false);
    expect(result.problems.join('\n')).toMatch(/symbolic link/);
  });

  it('flags a missing project.json', () => {
    const result = checkBoard(makeRepo({ project: null }));
    expect(result.ready).toBe(false);
    expect(result.problems.join('\n')).toMatch(/project\.json not found/);
  });

  it('flags a project.json that cannot be read as a file', () => {
    const root = makeRepo({ project: null });
    mkdirSync(join(root, '.darkmechanicus', 'project.json'));
    const result = checkBoard(root);
    expect(result.ready).toBe(false);
    expect(result.problems.join('\n')).toMatch(/project\.json could not be read/);
  });

  it('flags a project.json that is not valid JSON', () => {
    const result = checkBoard(makeRepo({ project: '{"format": ' }));
    expect(result.ready).toBe(false);
    expect(result.problems.join('\n')).toMatch(/project\.json is not valid JSON/);
  });

  it('flags unresolved merge conflict markers in project.json', () => {
    const conflicted = `{\n<<<<<<< HEAD\n  "name": "A"\n=======\n  "name": "B"\n>>>>>>> other\n}\n`;
    const result = checkBoard(makeRepo({ project: conflicted }));
    expect(result.ready).toBe(false);
    expect(result.problems.join('\n')).toMatch(/merge conflict/);
  });

  it('flags a project.json that is JSON but not an object', () => {
    const result = checkBoard(makeRepo({ project: '[]' }));
    expect(result.ready).toBe(false);
    expect(result.problems.join('\n')).toMatch(/project\.json must be a JSON object/);
  });

  it.each([
    ['format', { format: 'something.else' }],
    ['formatVersion', { formatVersion: 2 }],
    ['projectId', { projectId: 'ep_01m3txs8c4mvznc219cqssvdvd' }],
    ['projectId', { projectId: 'pj_short' }],
    ['name', { name: '' }],
    ['name', { name: 'x'.repeat(201) }],
    ['keyPrefix', { keyPrefix: 'bs' }],
    ['keyPrefix', { keyPrefix: '1BS' }],
    ['createdAt', { createdAt: 'yesterday' }],
    ['createdAt', { createdAt: '2026-10-01' }],
    ['createdAt', { createdAt: '2026-10-01T05:07:52' }],
    ['createdAt', { createdAt: '2026-10-01T05:07Z' }],
    ['createdAt', { createdAt: '2026-13-01T05:07:52Z' }],
    ['createdAt', { createdAt: '2026-02-30T00:00:00Z' }],
    ['createdAt', { createdAt: '2026-02-29T00:00:00Z' }],
    ['createdAt', { createdAt: '2026-10-01T24:00:00Z' }],
    ['createdAt', { createdAt: '2026-10-01T05:07:60Z' }],
    ['createdAt', { createdAt: '2026-10-01T05:07:52+24:00' }],
  ])('flags an invalid %s', (field, override) => {
    const result = checkBoard(makeRepo({ project: { ...VALID_PROJECT, ...override } }));
    expect(result.ready).toBe(false);
    expect(result.problems).toHaveLength(1);
    expect(result.problems[0]).toContain(`"${field}"`);
    expect(result.project).toBeNull();
  });

  it('flags unknown keys in project.json, which Dark Mechanicus rejects', () => {
    const result = checkBoard(makeRepo({ project: { ...VALID_PROJECT, owner: 'me' } }));
    expect(result.ready).toBe(false);
    expect(result.problems.join('\n')).toMatch(/unknown key.*"owner"/);
  });

  it('accepts what Dark Mechanicus accepts: offset times, long fractions, names counted in code points', () => {
    for (const override of [
      { createdAt: '2026-10-01T05:07:52+02:00' },
      { createdAt: '2026-10-01T05:07:52.1234567Z' },
      { createdAt: '2028-02-29T23:59:59-05:30' },
      { name: '😀'.repeat(101) },
    ]) {
      expect(checkBoard(makeRepo({ project: { ...VALID_PROJECT, ...override } })).problems).toEqual(
        []
      );
    }
  });

  it.skipIf(!CAN_SYMLINK)('flags a symlinked project.json', () => {
    const root = makeRepo({ project: null });
    const outside = join(tempDir(), 'project.json');
    writeFileSync(outside, JSON.stringify(VALID_PROJECT));
    symlinkSync(outside, join(root, '.darkmechanicus', 'project.json'));
    const result = checkBoard(root);
    expect(result.ready).toBe(false);
    expect(result.problems.join('\n')).toMatch(/project\.json is a symbolic link/);
  });

  it('reports an unreadable .darkmechanicus/.gitignore instead of crashing', () => {
    const root = makeRepo({ gitignore: null });
    mkdirSync(join(root, '.darkmechanicus', '.gitignore'));
    const result = checkBoard(root);
    expect(result.ready).toBe(false);
    expect(result.problems.join('\n')).toMatch(/\.gitignore/);
  });

  it('flags a missing .darkmechanicus/.gitignore', () => {
    const result = checkBoard(makeRepo({ gitignore: null }));
    expect(result.ready).toBe(false);
    expect(result.problems.join('\n')).toMatch(/\.gitignore.*local\//);
  });

  it('flags a .darkmechanicus/.gitignore that does not ignore local/', () => {
    const result = checkBoard(makeRepo({ gitignore: '# nothing here\nlocalstuff/\n' }));
    expect(result.ready).toBe(false);
    expect(result.problems.join('\n')).toMatch(/\.gitignore.*local\//);
  });

  it('accepts the equivalent ways of ignoring local/ outside a git repository', () => {
    for (const gitignore of [
      '# db\r\nlocal/\r\n',
      '/local/\n',
      'local\n',
      '/local\n',
      'local/*\n',
    ]) {
      expect(checkBoard(makeRepo({ gitignore })).ready).toBe(true);
    }
  });
});

describe.skipIf(!HAS_GIT)('checkBoard: inside a git repository', () => {
  function gitRepo(options) {
    const root = makeRepo(options);
    git(root, 'init', '-q');
    return root;
  }

  it('asks git, so an ignore rule in the root .gitignore also counts', () => {
    const root = gitRepo({ gitignore: null });
    writeFileSync(join(root, '.gitignore'), '.darkmechanicus/local/\n');
    expect(checkBoard(root).problems).toEqual([]);
  });

  it('flags local/ that a later rule un-ignores', () => {
    const root = gitRepo({ gitignore: 'local/\n!local/\n' });
    expect(checkBoard(root).problems.join('\n')).toMatch(/must ignore local\//);
  });

  it('flags working-database files that are already committed', () => {
    const root = gitRepo();
    mkdirSync(join(root, '.darkmechanicus', 'local'));
    writeFileSync(join(root, '.darkmechanicus', 'local', 'state.sqlite'), 'db');
    git(root, 'add', '-f', '.darkmechanicus/local/state.sqlite');
    const problems = checkBoard(root).problems.join('\n');
    expect(problems).toMatch(/tracked by git/);
    expect(problems).toContain('git rm -r --cached .darkmechanicus/local');
  });

  it('flags a repository that ignores .darkmechanicus/ itself, so plans never reach Git', () => {
    const root = gitRepo();
    writeFileSync(join(root, '.gitignore'), '.darkmechanicus/\n');
    expect(checkBoard(root).problems.join('\n')).toMatch(/project\.json is ignored by git/);
  });
});

describe('checkBoard: leftover markdown tickets', () => {
  function withTickets(root) {
    mkdirSync(join(root, 'board', 'backlog'), { recursive: true });
    mkdirSync(join(root, 'board', 'in-progress'), { recursive: true });
    mkdirSync(join(root, 'board', 'done'), { recursive: true });
    writeFileSync(join(root, 'board', 'backlog', '.gitkeep'), '');
    writeFileSync(join(root, 'board', 'backlog', '004-thing.md'), '# EPIC: Thing\n');
    writeFileSync(join(root, 'board', 'in-progress', '004.1-sub.md'), '# 004.1 Sub\n');
    writeFileSync(join(root, 'board', 'done', '001-old.md'), '# EPIC: Old\n');
    return root;
  }

  it('warns about open markdown tickets in Dark Mechanicus mode without blocking', () => {
    const result = checkBoard(withTickets(makeRepo()));
    expect(result.ready).toBe(true);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toMatch(/2 markdown ticket/);
    expect(result.warnings[0]).toContain('board/backlog/004-thing.md');
    expect(result.warnings[0]).toContain('board/in-progress/004.1-sub.md');
    expect(result.warnings[0]).not.toContain('001-old.md');
  });

  it('quotes ticket filenames and caps the list so repo content cannot forge output lines', () => {
    const root = makeRepo();
    mkdirSync(join(root, 'board', 'backlog'), { recursive: true });
    const forged = '\n::error title=Forged::pwned.md';
    writeFileSync(join(root, 'board', 'backlog', forged), '');
    for (let i = 0; i < 12; i += 1) {
      writeFileSync(join(root, 'board', 'backlog', `0${String(i).padStart(2, '0')}-t.md`), '');
    }
    const [warning] = checkBoard(root).warnings;
    expect(warning).not.toContain('\n');
    expect(warning).toContain(JSON.stringify(`board/backlog/${forged}`).slice(1, -1));
    expect(warning).toMatch(/13 markdown ticket/);
    expect(warning).toMatch(/and 3 more/);
  });

  it('ignores a board/backlog that is a file rather than a directory', () => {
    const root = makeRepo();
    mkdirSync(join(root, 'board'));
    writeFileSync(join(root, 'board', 'backlog'), 'not a dir');
    expect(checkBoard(root).warnings).toEqual([]);
  });

  it('does not warn about markdown tickets once the repo opts into the markdown board', () => {
    const result = checkBoard(withTickets(makeRepo({ rc: { board: 'markdown' }, dm: false })));
    expect(result.warnings).toEqual([]);
  });
});

describe('renderers', () => {
  const notReady = {
    mode: 'darkmechanicus',
    ready: false,
    problems: ['.darkmechanicus/ not found: this repository has not been initialized.'],
    warnings: ['2 markdown tickets are still open'],
    project: null,
  };
  const ready = {
    mode: 'darkmechanicus',
    ready: true,
    problems: [],
    warnings: [],
    project: { name: 'Demo', keyPrefix: 'BS' },
  };
  const markdown = { mode: 'markdown', ready: true, problems: [], warnings: [], project: null };

  it('renders a loud text banner with problems, warnings, fix steps and the opt-out', () => {
    const text = renderText(notReady);
    expect(text).toContain('DARK MECHANICUS IS NOT SET UP FOR THIS REPO');
    expect(text).toContain(notReady.problems[0]);
    expect(text).toContain(notReady.warnings[0]);
    expect(text).toContain('docs/dark-mechanicus.md');
    expect(text).toContain('"board": "markdown"');
    expect(text).not.toMatch(/\u001b\[/);
  });

  it('colours the banner only when asked', () => {
    expect(renderText(notReady, { color: true })).toMatch(/\u001b\[/);
  });

  it('renders a one-line ready message naming the ticket key prefix', () => {
    const text = renderText(ready);
    expect(text.trim().split('\n')).toHaveLength(1);
    expect(text).toMatch(/ready.*Demo.*BS-<n>/);
  });

  it('renders the markdown opt-out as a single quiet line', () => {
    const text = renderText(markdown);
    expect(text.trim().split('\n')).toHaveLength(1);
    expect(text).toMatch(/markdown/);
  });

  it('renders SessionStart hook output that tells the agent to stop and warn the user', () => {
    const output = renderHook(notReady);
    expect(output.hookSpecificOutput.hookEventName).toBe('SessionStart');
    expect(output.hookSpecificOutput.additionalContext).toContain(notReady.problems[0]);
    expect(output.hookSpecificOutput.additionalContext).toMatch(/tell the user/i);
    expect(output.hookSpecificOutput.additionalContext).toMatch(/do not fall back/i);
    expect(output.hookSpecificOutput.additionalContext).toMatch(
      /only the user.*\.boosterseatrc\.json.*initialize_repository/is
    );
    expect(output.systemMessage).toMatch(/Dark Mechanicus is not set up/);
  });

  it('renders quiet SessionStart context with the key prefix when ready', () => {
    const output = renderHook(ready);
    expect(output.systemMessage).toBeUndefined();
    expect(output.hookSpecificOutput.additionalContext).toContain('BS-<n>');
    expect(output.hookSpecificOutput.additionalContext).toContain('get_capabilities');
  });

  it('surfaces warnings to the user even when the board is ready', () => {
    const output = renderHook({ ...ready, warnings: ['2 markdown tickets are still open'] });
    expect(output.systemMessage).toContain('2 markdown tickets are still open');
    expect(output.hookSpecificOutput.additionalContext).toContain(
      '2 markdown tickets are still open'
    );
  });

  it('renders markdown-mode SessionStart context without a user-facing warning', () => {
    const output = renderHook(markdown);
    expect(output.systemMessage).toBeUndefined();
    expect(output.hookSpecificOutput.additionalContext).toMatch(/markdown/);
  });

  it('renders one GitHub warning annotation per problem and warning, escaped', () => {
    const { annotations, summary } = renderGithub({
      ...notReady,
      problems: ['50% done\nnext line'],
    });
    const lines = annotations.trim().split('\n');
    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe('::warning title=Dark Mechanicus not set up::50%25 done%0Anext line');
    expect(lines[1]).toMatch(/^::warning title=Board::2 markdown tickets/);
    expect(summary).toContain('Dark Mechanicus is not set up');
    expect(summary).toContain('docs/dark-mechanicus.md');
  });

  it('titles the step summary as board warnings when the board is ready', () => {
    const { summary } = renderGithub({ ...ready, warnings: ['2 markdown tickets are still open'] });
    expect(summary).toMatch(/^### ⚠️ Board warnings/);
  });

  it('renders no GitHub annotations when ready with nothing to warn about', () => {
    expect(renderGithub(ready)).toEqual({ annotations: '', summary: '' });
  });
});

describe('run', () => {
  it('is noisy on stderr but exits 0 when Dark Mechanicus is not set up', () => {
    const { code, stdout, stderr } = runIn(makeRepo({ dm: false }));
    expect(code).toBe(0);
    expect(stdout).toBe('');
    expect(stderr).toContain('DARK MECHANICUS IS NOT SET UP FOR THIS REPO');
  });

  it('exits 1 with --strict when Dark Mechanicus is not set up', () => {
    expect(runIn(makeRepo({ dm: false }), ['--strict']).code).toBe(1);
  });

  it('prints the ready line on stdout and exits 0 (also with --strict) when set up', () => {
    const root = makeRepo();
    const plain = runIn(root);
    expect(plain.code).toBe(0);
    expect(plain.stdout).toMatch(/ready/);
    expect(plain.stderr).toBe('');
    expect(runIn(root, ['--strict']).code).toBe(0);
  });

  it('prints warnings on stderr when ready but something still needs attention', () => {
    const { code, stderr } = runIn(makeRepo({ rc: { board: 'nope' } }));
    expect(code).toBe(0);
    expect(stderr).toMatch(/"nope"/);
  });

  it('emits SessionStart hook JSON on stdout with --hook', () => {
    const { code, stdout, stderr } = runIn(makeRepo({ dm: false }), ['--hook']);
    expect(code).toBe(0);
    expect(stderr).toBe('');
    const output = JSON.parse(stdout);
    expect(output.hookSpecificOutput.hookEventName).toBe('SessionStart');
    expect(output.systemMessage).toMatch(/not set up/);
  });

  it('emits annotations and appends the step summary with --github', () => {
    const root = makeRepo({ dm: false });
    const summaryPath = join(root, 'summary.md');
    writeFileSync(summaryPath, '# Earlier step\n');
    const { code, stdout, stderr } = runIn(root, ['--github'], {
      GITHUB_STEP_SUMMARY: summaryPath,
    });
    expect(code).toBe(0);
    expect(stdout).toMatch(/^::warning title=Dark Mechanicus not set up::/);
    expect(stderr).toContain('DARK MECHANICUS IS NOT SET UP FOR THIS REPO');
    const summary = readFileSync(summaryPath, 'utf8');
    expect(summary.startsWith('# Earlier step\n')).toBe(true);
    expect(summary).toContain('Dark Mechanicus is not set up');
  });

  it('exits 1 with --strict in --hook and --github modes too', () => {
    const root = makeRepo({ dm: false });
    expect(runIn(root, ['--hook', '--strict']).code).toBe(1);
    expect(runIn(root, ['--github', '--strict']).code).toBe(1);
  });

  it('does not need GITHUB_STEP_SUMMARY to emit annotations', () => {
    const { code, stdout } = runIn(makeRepo({ dm: false }), ['--github']);
    expect(code).toBe(0);
    expect(stdout).toMatch(/^::warning /);
  });

  it('never lets repo content start a workflow command line on stdout or stderr', () => {
    const root = makeRepo({ dm: false });
    mkdirSync(join(root, 'board', 'backlog'), { recursive: true });
    writeFileSync(join(root, 'board', 'backlog', 'x\n::error title=Forged::pwned.md'), '');
    const { stdout, stderr } = runIn(root, ['--github']);
    const commandLines = `${stdout}\n${stderr}`.split('\n').filter((line) => line.startsWith('::'));
    expect(commandLines.length).toBeGreaterThan(0);
    expect(commandLines.every((line) => line.startsWith('::warning title='))).toBe(true);
  });

  it('still emits hook JSON when the check itself throws', () => {
    const { code, stdout } = runIn(join(tempDir(), 'missing\0dir'), ['--hook']);
    expect(code).toBe(0);
    const output = JSON.parse(stdout);
    expect(output.hookSpecificOutput.additionalContext).toMatch(/board check itself failed/);
  });

  it('rejects unknown and conflicting options with exit 2', () => {
    const root = makeRepo();
    const unknown = runIn(root, ['--loud']);
    expect(unknown.code).toBe(2);
    expect(unknown.stderr).toMatch(/Unknown option: --loud/);
    expect(runIn(root, ['--hook', '--github']).code).toBe(2);
  });

  it('prints usage and exits 0 with --help', () => {
    const { code, stdout } = runIn(makeRepo(), ['--help']);
    expect(code).toBe(0);
    expect(stdout).toMatch(/Usage: node scripts\/check-darkmechanicus\.mjs/);
  });
});

describe.skipIf(!CAN_SYMLINK)('CLI entry point', () => {
  function installedCopy() {
    const repo = tempDir();
    mkdirSync(join(repo, 'scripts'));
    copyFileSync(SCRIPT, join(repo, 'scripts', 'check-darkmechanicus.mjs'));
    const link = join(tempDir(), 'linked-repo');
    symlinkSync(repo, link);
    return { repo, link };
  }

  const cli = (path, ...args) =>
    spawnSync(process.execPath, [join(path, 'scripts', 'check-darkmechanicus.mjs'), ...args], {
      encoding: 'utf8',
      env: { ...process.env, NO_COLOR: '1' },
    });

  it('runs the check when started through its real path', () => {
    const { repo } = installedCopy();
    const result = cli(repo, '--strict');
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('DARK MECHANICUS IS NOT SET UP FOR THIS REPO');
  });

  it('runs the check when started through a symlinked path (as the SessionStart hook can be)', () => {
    const { link } = installedCopy();
    const strict = cli(link, '--strict');
    expect(strict.status).toBe(1);
    expect(strict.stderr).toContain('DARK MECHANICUS IS NOT SET UP FOR THIS REPO');
    const hook = cli(link, '--hook');
    expect(hook.status).toBe(0);
    expect(JSON.parse(hook.stdout).hookSpecificOutput.hookEventName).toBe('SessionStart');
  });

  it('does nothing when imported as a module', () => {
    const result = spawnSync(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        `await import(${JSON.stringify(SCRIPT)}); console.log('imported');`,
      ],
      { encoding: 'utf8' }
    );
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe('imported');
    expect(result.stderr).toBe('');
  });
});
