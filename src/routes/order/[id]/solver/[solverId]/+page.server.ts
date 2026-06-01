import { execSync } from 'node:child_process';
import type { PageServerLoad } from './$types';

export type CommitInfo = {
  hash: string;
  shortHash: string;
  message: string;
  author: string;
  refs: string;
  isHead: boolean;
};

function runGit(args: string, cwd?: string): string {
  try {
    return execSync(`git ${args}`, {
      cwd: cwd ?? process.cwd(),
      encoding: 'utf-8',
      timeout: 5000
    }).trim();
  } catch {
    return '';
  }
}

function parseCommits(raw: string): CommitInfo[] {
  return raw.split('\n').filter(Boolean).map(line => {
    const [hash, shortHash, ...rest] = line.split('|');
    const restStr = rest.join('|');
    const lastPipe = restStr.lastIndexOf('|');
    const message = restStr.slice(0, lastPipe);
    const restAfterMsg = restStr.slice(lastPipe + 1);
    const [author, ...refParts] = restAfterMsg.split('|');
    const refs = refParts.join('|') || '';
    return {
      hash,
      shortHash,
      message,
      author,
      refs,
      isHead: refs.includes('HEAD ->')
    };
  });
}

export const load: PageServerLoad = async ({ params }) => {
  const orderId = params.id;
  const solverId = params.solverId;

  const gitRoot = process.cwd();
  const rawLog = runGit('log --pretty=format:"%H|%h|%s|%an|%D" -30', gitRoot);
  const currentBranch = runGit('branch --show-current', gitRoot);
  const rawBranches = runGit('branch -a', gitRoot);
  const branches = rawBranches
    ? rawBranches.split('\n').map(b => b.trim().replace(/^\* /, '')).filter(Boolean)
    : [];

  const commits = parseCommits(rawLog);

  return {
    orderId,
    solverId,
    commits,
    currentBranch,
    branches
  };
};