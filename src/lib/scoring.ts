export interface EvaluationRaw {
  team_id: string;
  team_name: string;
  project_name?: string;
  jury_name: string;
  total_score: number;
  comments: string | null;
  categories?: { category: string; score: number }[];
}

export interface JuryBreakdown {
  jury_name: string;
  total_score: number;
  comments: string | null;
  categories?: { category: string; score: number }[];
}

export interface LeaderboardEntry {
  team_id: string;
  team_name: string;
  project_name?: string;
  evaluations_count: number;
  combined_score: number;
  jury_breakdown: JuryBreakdown[];
}

export function calculateLeaderboard(evaluations: EvaluationRaw[]): LeaderboardEntry[] {
  const teamMap = new Map<string, LeaderboardEntry>();

  for (const evalRaw of evaluations) {
    if (!teamMap.has(evalRaw.team_id)) {
      teamMap.set(evalRaw.team_id, {
        team_id: evalRaw.team_id,
        team_name: evalRaw.team_name,
        project_name: evalRaw.project_name,
        evaluations_count: 0,
        combined_score: 0,
        jury_breakdown: [],
      });
    }

    const entry = teamMap.get(evalRaw.team_id)!;
    entry.evaluations_count += 1;
    // ensure score is treated as number
    const score = Number(evalRaw.total_score);
    entry.combined_score += (isNaN(score) ? 0 : score);
    
    entry.jury_breakdown.push({
      jury_name: evalRaw.jury_name,
      total_score: score,
      comments: evalRaw.comments,
      categories: evalRaw.categories,
    });
  }

  const results = Array.from(teamMap.values());

  // Sort by combined_score descending
  results.sort((a, b) => {
    return b.combined_score - a.combined_score;
  });

  return results;
}
