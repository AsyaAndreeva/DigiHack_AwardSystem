import { expect, test, describe } from 'vitest';
import { calculateLeaderboard, EvaluationRaw } from './scoring';

describe('calculateLeaderboard', () => {
  test('groups evaluations by team correctly', () => {
    const raw: EvaluationRaw[] = [
      { team_id: 't1', team_name: 'Team Alpha', jury_name: 'Jury 1', total_score: 80, comments: 'Good' },
      { team_id: 't1', team_name: 'Team Alpha', jury_name: 'Jury 2', total_score: 90, comments: 'Great' },
      { team_id: 't2', team_name: 'Team Beta', jury_name: 'Jury 1', total_score: 85, comments: null }
    ];

    const results = calculateLeaderboard(raw);

    // Alpha: 80 + 90 = 170. Beta: 85.
    expect(results.length).toBe(2);
    expect(results[0].team_name).toBe('Team Alpha');
    expect(results[0].combined_score).toBe(170);
    expect(results[0].evaluations_count).toBe(2);
    expect(results[0].jury_breakdown.length).toBe(2);

    expect(results[1].team_name).toBe('Team Beta');
    expect(results[1].combined_score).toBe(85);
    expect(results[1].evaluations_count).toBe(1);
  });

  test('sorts teams by combined_score correctly', () => {
    const raw: EvaluationRaw[] = [
      { team_id: 't1', team_name: 'Team Last', jury_name: 'Jury 1', total_score: 10, comments: null },
      { team_id: 't2', team_name: 'Team First', jury_name: 'Jury 1', total_score: 99, comments: null },
      { team_id: 't3', team_name: 'Team Middle', jury_name: 'Jury 1', total_score: 50, comments: null }
    ];

    const results = calculateLeaderboard(raw);
    
    expect(results[0].team_id).toBe('t2'); // 99
    expect(results[1].team_id).toBe('t3'); // 50
    expect(results[2].team_id).toBe('t1'); // 10
  });

  test('handles empty evaluations', () => {
    const results = calculateLeaderboard([]);
    expect(results).toEqual([]);
  });

  test('handles string-based numeric scores gracefully', () => {
    const raw: any[] = [
      { team_id: 't1', team_name: 'Team String', jury_name: 'Jury 1', total_score: '50.5', comments: null },
      { team_id: 't1', team_name: 'Team String', jury_name: 'Jury 2', total_score: '49.5', comments: null }
    ];

    const results = calculateLeaderboard(raw);
    expect(results[0].combined_score).toBe(100);
  });
});
