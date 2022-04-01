import { RequestError } from '@octokit/request-error';
import { Octokit } from 'octokit';

export async function parseStars(
  octokit: Octokit,
  owner: string,
  repo: string,
): Promise<{
  stars: number;
} | null> {
  try {
    const res = await octokit.rest.repos.get({ owner, repo });
    return { stars: res.data.stargazers_count };
  } catch (err) {
    if (err instanceof RequestError) {
      console.warn(`${err.status}: ${err.message}`);
    }
  }
  return null;
}
