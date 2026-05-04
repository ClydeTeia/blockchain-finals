'use client';

import { useState } from 'react';

export function AnswerIntegrityVerifier({ answerId }: { answerId: string }) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<{
    verified: boolean;
    message: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const verifyIntegrity = async () => {
    setIsVerifying(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await fetch(`/api/admin/answers/${answerId}/verify-integrity`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Verification failed');
      }
      
      const data = await response.json();
      setResult({
        verified: data.integrityVerified,
        message: data.integrityVerified
          ? 'Answer integrity verified. The off-chain answer matches the on-chain proof.'
          : 'Integrity mismatch. The off-chain answer no longer matches the on-chain proof.'
      });
    } catch (err) {
      console.error('Failed to verify integrity:', err);
      setError('Failed to verify answer integrity. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  if (isVerifying) {
    return <p>Verifying integrity...</p>;
  }

  if (result) {
    return (
      <div style={{ 
        padding: '1rem', 
        borderRadius: '4px', 
        backgroundColor: result.verified ? '#e6ffe6' : '#ffe6e6',
        border: `1px solid ${result.verified ? '#4caf50' : '#f44336'}`
      }}>
        <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>
          {result.verified ? '✓ Integrity Verified' : '✗ Integrity Mismatch'}
        </p>
        <p style={{ margin: '0' }}>{result.message}</p>
      </div>
    );
  }

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }

  return (
    <button onClick={verifyIntegrity}>
      Verify Answer Integrity
    </button>
  );
}