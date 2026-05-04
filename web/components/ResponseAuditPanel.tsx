'use client';

import { useEffect, useState } from 'react';
import { useAdmin } from '@/hooks/useAdmin';

export function ResponseAuditPanel() {
  const { 
    flagAnswer, 
    addAuditNote, 
    isActing,
    error 
  } = useAdmin();
  const [answers, setAnswers] = useState<Array<any>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnswers = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/admin/answers'); // We need to create this endpoint
        if (!response.ok) {
          throw new Error('Failed to fetch answers');
        }
        const data = await response.json();
        setAnswers(data.answers || []); // Assuming the API returns { answers: [...] }
      } catch (err) {
        console.error('Failed to fetch admin answers:', err);
        setError('Failed to load answers for audit');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnswers();
  }, [flagAnswer, addAuditNote]); // Re-fetch when actions are redefined (though they are stable)

  if (isLoading) return <p>Loading answers...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div>
      <h1>Admin Response Audit Panel</h1>
      {answers.length === 0 ? (
        <p>No responses found.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #ddd' }}>Wallet</th>
              <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #ddd' }}>Survey ID</th>
              <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #ddd' }}>Status</th>
              <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #ddd' }}>Validation Score</th>
              <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #ddd' }}>Flagged</th>
              <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #ddd' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {answers.map((answer) => (
              <tr key={answer.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '0.5rem' }}>{answer.respondentWallet}</td>
                <td style={{ padding: '0.5rem' }}>{answer.surveyId}</td>
                <td style={{ padding: '0.5rem' }}>{answer.status}</td>
                <td style={{ padding: '0.5rem' }}>{answer.validationScore ?? 'N/A'}</td>
                <td style={{ padding: '0.5rem' }}>{answer.flagged ? 'Yes' : 'No'}</td>
                <td style={{ padding: '0.5rem' }}>
                  {!answer.flagged && (
                    <button
                      onClick={() => flagAnswer(answer.id)}
                      disabled={isActing}
                    >
                      {isActing ? 'Flagging...' : 'Flag Response'}
                    </button>
                  )}
                  {answer.flagged && (
                    <span style={{ color: 'orange' }}>Flagged</span>
                  )}
                  <br />
                  <input
                    type="text"
                    placeholder="Add audit note"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.target.value.trim()) {
                        addAuditNote(answer.id, e.target.value.trim());
                        e.target.value = '';
                      }
                    }}
                    style={{ marginTop: '0.25rem', padding: '0.25rem' }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}