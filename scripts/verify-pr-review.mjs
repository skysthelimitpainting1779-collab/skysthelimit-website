#!/usr/bin/env node
const TRUSTED_ASSOCIATIONS = new Set(['OWNER', 'MEMBER', 'COLLABORATOR']);

export function approvedReviewers(reviews, { headSha, author }) {
  const latestByReviewer = new Map();
  for (const review of Array.isArray(reviews) ? reviews : []) {
    if (!['APPROVED', 'CHANGES_REQUESTED', 'DISMISSED'].includes(review?.state)) {
      continue;
    }
    const login = String(review?.user?.login || '').toLowerCase();
    if (!login || login === String(author || '').toLowerCase()) continue;
    const previous = latestByReviewer.get(login);
    const order = Date.parse(review.submitted_at || '') || Number(review.id) || 0;
    const previousOrder =
      Date.parse(previous?.submitted_at || '') || Number(previous?.id) || 0;
    if (!previous || order >= previousOrder) latestByReviewer.set(login, review);
  }
  return [...latestByReviewer.values()]
    .filter(
      (review) =>
        review.state === 'APPROVED' &&
        review.commit_id === headSha &&
        TRUSTED_ASSOCIATIONS.has(review.author_association)
    )
    .map((review) => review.user.login);
}

async function main() {
  const token = process.env.GITHUB_TOKEN;
  const repository = process.env.PR_REPOSITORY;
  const pullRequest = process.env.PR_NUMBER;
  const headSha = process.env.PR_HEAD_SHA;
  const author = process.env.PR_AUTHOR;
  if (!token || !repository || !pullRequest || !headSha || !author) {
    throw new Error('PR review verification environment is incomplete');
  }
  const reviews = [];
  for (let page = 1; ; page += 1) {
    const response = await fetch(
      `https://api.github.com/repos/${repository}/pulls/${pullRequest}/reviews?per_page=100&page=${page}`,
      {
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
          'X-GitHub-Api-Version': '2026-03-10',
        },
      },
    );
    if (!response.ok) {
      throw new Error(`GitHub review API returned ${response.status}`);
    }
    const pageReviews = await response.json();
    if (!Array.isArray(pageReviews)) {
      throw new Error('GitHub review API returned an invalid response');
    }
    reviews.push(...pageReviews);
    if (pageReviews.length < 100) break;
  }
  const reviewers = approvedReviewers(reviews, { headSha, author });
  if (reviewers.length === 0) {
    throw new Error('exact PR head has no independent trusted approval');
  }
  console.log(`[Lifecycle] independent PR approval: ${reviewers.join(', ')}`);
}

if (process.argv[1]?.endsWith('verify-pr-review.mjs')) {
  main().catch((error) => {
    console.error(`[Lifecycle] ${error.message}`);
    process.exitCode = 1;
  });
}
