import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../utils/api';
import type { Test, User } from '../types';

interface TestWithAttempt extends Test {
  hasAttempted?: boolean;
  lastScore?: number;
  lastAttemptDate?: string;
}

export default function StudentDashboard() {
  const [tests, setTests] = useState<TestWithAttempt[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'NEET' | 'JEE'>('ALL');
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      fetchTests();
    } else {
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchTests();
    }
  }, [selectedFilter, user]);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const filter = selectedFilter === 'ALL' ? undefined : selectedFilter;
      const response = await apiClient.getTests(filter);

      // Fetch attempt history for each test
      const testsWithAttempts = await Promise.all(
        (response.tests || []).map(async (test: Test) => {
          try {
            const attemptResponse = await apiClient.getTestResults(test.id);
            return {
              ...test,
              hasAttempted: true,
              lastScore: attemptResponse.attempt.score,
              lastAttemptDate: attemptResponse.attempt.end_time
            };
          } catch (error) {
            // No attempt found for this test
            return { ...test, hasAttempted: false };
          }
        })
      );

      setTests(testsWithAttempts);
    } catch (error) {
      console.error('Error fetching tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    apiClient.setToken(null);
    navigate('/');
  };

  const handleStartTest = (testId: number) => {
    navigate(`/student/test/${testId}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getPercentage = (score: number, total: number) => {
    return ((score / total) * 100).toFixed(1);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f9ff' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#1e40af', color: 'white', padding: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                Chemistry Toppers
              </h1>
              <p style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                Daily Chemistry Test Platform
              </p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem' }}>
                Welcome, {user?.name}
              </span>
              <button
                onClick={handleLogout}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  borderRadius: '0.375rem',
                  border: '1px solid rgba(255,255,255,0.3)',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Welcome Message */}
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', marginBottom: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1e40af', marginBottom: '0.5rem' }}>
            Welcome to Your Test Portal
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            Access all your chemistry tests in one place. Take tests daily, track your progress, and improve your performance.
          </p>
        </div>

        {/* Filter Buttons */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setSelectedFilter('ALL')}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: selectedFilter === 'ALL' ? '#1e40af' : '#e5e7eb',
              color: selectedFilter === 'ALL' ? 'white' : '#374151',
              fontWeight: '600',
              borderRadius: '0.375rem',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            All Tests
          </button>
          <button
            onClick={() => setSelectedFilter('NEET')}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: selectedFilter === 'NEET' ? '#dc2626' : '#e5e7eb',
              color: selectedFilter === 'NEET' ? 'white' : '#374151',
              fontWeight: '600',
              borderRadius: '0.375rem',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            NEET Tests
          </button>
          <button
            onClick={() => setSelectedFilter('JEE')}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: selectedFilter === 'JEE' ? '#059669' : '#e5e7eb',
              color: selectedFilter === 'JEE' ? 'white' : '#374151',
              fontWeight: '600',
              borderRadius: '0.375rem',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            JEE Tests
          </button>
        </div>

        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem', color: '#1f2937' }}>
          {selectedFilter === 'ALL' ? 'All Tests' : `${selectedFilter} Tests`}
        </h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'white', borderRadius: '0.5rem' }}>
            <p style={{ color: '#6b7280' }}>Loading tests...</p>
          </div>
        ) : tests.length === 0 ? (
          <div style={{ backgroundColor: 'white', padding: '3rem', borderRadius: '0.5rem', textAlign: 'center', color: '#6b7280', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>No tests available</p>
            <p style={{ fontSize: '0.875rem' }}>Your teacher hasn't created any tests yet. Check back later!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {tests.map((test) => (
              <div
                key={test.id}
                style={{
                  backgroundColor: 'white',
                  padding: '1.5rem',
                  borderRadius: '0.5rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  border: test.hasAttempted ? '2px solid #10b981' : '2px solid #e5e7eb',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  position: 'relative'
                }}
              >
                {/* Status Badge */}
                {test.hasAttempted && (
                  <div style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    backgroundColor: '#10b981',
                    color: 'white',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}>
                    Completed
                  </div>
                )}

                <div style={{ marginTop: test.hasAttempted ? '1.5rem' : '0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0, color: '#1e40af' }}>
                      {test.title}
                    </h3>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      backgroundColor: test.exam_type === 'NEET' ? '#fef2f2' : '#f0fdf4',
                      color: test.exam_type === 'NEET' ? '#dc2626' : '#059669',
                      fontSize: '0.625rem',
                      fontWeight: '700',
                      borderRadius: '0.25rem',
                      border: `1px solid ${test.exam_type === 'NEET' ? '#fecaca' : '#bbf7d0'}`,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      {test.exam_type}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem', lineHeight: '1.5' }}>
                    {test.description || 'No description available'}
                  </p>
                </div>

                {/* Test Info */}
                <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
                  <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.875rem', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#6b7280' }}>Duration:</span>
                      <span style={{ fontWeight: '500', color: '#1f2937' }}>{test.duration_minutes} minutes</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#6b7280' }}>Total Marks:</span>
                      <span style={{ fontWeight: '500', color: '#1f2937' }}>{test.total_marks}</span>
                    </div>

                    {/* Show last attempt info if exists */}
                    {test.hasAttempted && test.lastScore !== undefined && (
                      <>
                        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ color: '#6b7280' }}>Last Score:</span>
                            <span style={{ fontWeight: '600', color: '#10b981' }}>
                              {test.lastScore}/{test.total_marks} ({getPercentage(test.lastScore, test.total_marks)}%)
                            </span>
                          </div>
                          {test.lastAttemptDate && (
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: '#6b7280' }}>Attempted:</span>
                              <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                {formatDate(test.lastAttemptDate)}
                              </span>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {test.hasAttempted ? (
                    <button
                      onClick={() => navigate(`/test/${test.id}/results`)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        backgroundColor: '#10b981',
                        color: 'white',
                        fontWeight: '600',
                        borderRadius: '0.375rem',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#059669';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = '#10b981';
                      }}
                    >
                      View Results
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStartTest(test.id)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        backgroundColor: '#10b981',
                        color: 'white',
                        fontWeight: '600',
                        borderRadius: '0.375rem',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#059669';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = '#10b981';
                      }}
                    >
                      Start Test
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
