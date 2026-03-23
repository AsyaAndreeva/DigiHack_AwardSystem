import { describe, it, expect } from 'vitest';
import { calculateLeaderboard, EvaluationRaw } from './scoring';

describe('Scoring Logic - calculateLeaderboard', () => {

  it('should return an empty array if there are no evaluations', () => {
    const result = calculateLeaderboard([]);
    expect(result).toEqual([]);
  });

  it('should correctly aggregate scores for a single team with multiple evaluations', () => {
    const evaluations: EvaluationRaw[] = [
      { team_id: 't1', team_name: 'Team Alpha', jury_name: 'Jury A', total_score: 50, comments: 'Good' },
      { team_id: 't1', team_name: 'Team Alpha', jury_name: 'Jury B', total_score: 30, comments: 'Okayish' }
    ];

    const result = calculateLeaderboard(evaluations);

    expect(result).toHaveLength(1);
    expect(result[0].team_id).toBe('t1');
    expect(result[0].team_name).toBe('Team Alpha');
    expect(result[0].evaluations_count).toBe(2);
    expect(result[0].combined_score).toBe(80);
    expect(result[0].jury_breakdown).toHaveLength(2);
  });

  it('should sort teams in descending order of their total combined_score', () => {
    const evaluations: EvaluationRaw[] = [
      { team_id: 't1', team_name: 'Team Alpha', jury_name: 'Jury A', total_score: 50, comments: null },
      { team_id: 't2', team_name: 'Team Beta', jury_name: 'Jury A', total_score: 90, comments: null },
      { team_id: 't3', team_name: 'Team Gamma', jury_name: 'Jury B', total_score: 75, comments: null },
    ];

    const result = calculateLeaderboard(evaluations);

    expect(result).toHaveLength(3);
    
    // Top should be Beta (90)
    expect(result[0].team_id).toBe('t2');
    // Middle should be Gamma (75)
    expect(result[1].team_id).toBe('t3');
    // Bottom should be Alpha (50)
    expect(result[2].team_id).toBe('t1');
  });

  it('should gracefully handle stringified scores by converting them to numbers', () => {
    const evaluations: any[] = [
      { team_id: 't1', team_name: 'Team Str', jury_name: 'Jury A', total_score: '20', comments: '' },
      { team_id: 't1', team_name: 'Team Str', jury_name: 'Jury B', total_score: '30.5', comments: '' }
    ];

    const result = calculateLeaderboard(evaluations as EvaluationRaw[]);

    expect(result[0].combined_score).toBe(50.5);
  });

  it('should handle NaN or undefined scores gracefully by treating them as 0', () => {
    const evaluations: any[] = [
      { team_id: 't-nan', team_name: 'Team NaN', jury_name: 'Jury Weird', total_score: undefined, comments: 'Broken' },
      { team_id: 't-nan', team_name: 'Team NaN', jury_name: 'Jury Normal', total_score: 10, comments: 'Fine' }
    ];

    const result = calculateLeaderboard(evaluations as EvaluationRaw[]);

    expect(result[0].combined_score).toBe(10);
    expect(result[0].evaluations_count).toBe(2);
  });

  it('should maintain the integrity of jury breakdown data', () => {
    const evaluations: EvaluationRaw[] = [
      { team_id: 't1', team_name: 'Team Data', jury_name: 'Jury Strict', total_score: 10, comments: 'Too little code' }
    ];

    const result = calculateLeaderboard(evaluations);
    const breakdown = result[0].jury_breakdown[0];

    expect(breakdown.jury_name).toBe('Jury Strict');
    expect(breakdown.total_score).toBe(10);
    expect(breakdown.comments).toBe('Too little code');
  });

});
