import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../utils/api';

export default function TestResults() {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResults();
  }, [testId]);

  const loadResults = async () => {
    try {
      const data = await apiClient.getTestResults(parseInt(testId!));
      setResults(data);
    } catch (error) {
      console.error('Error loading results:', error);
      alert('Failed to load test results');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading results...</p>
      </div>
    );
  }

  if (!results) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>No results found</p>
      </div>
    );
  }

  const stats = results.statistics;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f9ff' }}>
      {/* Header */}
      <div style={{ backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '1rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e40af' }}>
            Test Results
          </h1>
          <button
            onClick={() => navigate('/student')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#6b7280',
              color: 'white',
              borderRadius: '0.375rem',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        {/* Test Info */}
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            {results.test.title}
          </h2>
          {results.test.description && (
            <p style={{ color: '#6b7280', marginBottom: '1rem' }}>{results.test.description}</p>
          )}
        </div>

        {/* Statistics Card */}
        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
            Your Performance
          </h3>

          {/* Score and Percentage */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f0f9ff', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#1e40af' }}>
                {stats.score}/{stats.total_marks}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
                Total Score
              </div>
            </div>

            <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: stats.percentage >= 60 ? '#dcfce7' : '#fee2e2', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: stats.percentage >= 60 ? '#166534' : '#991b1b' }}>
                {stats.percentage}%
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
                Percentage
              </div>
            </div>
          </div>

          {/* Statistics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
            <div style={{ padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#374151' }}>
                {stats.total_questions}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                Total Questions
              </div>
            </div>

            <div style={{ padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#3b82f6' }}>
                {stats.attempted}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                Attempted
              </div>
            </div>

            <div style={{ padding: '1rem', backgroundColor: '#dcfce7', borderRadius: '0.5rem', border: '1px solid #86efac' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#166534' }}>
                {stats.correct}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#166534', marginTop: '0.25rem' }}>
                Correct
              </div>
            </div>

            <div style={{ padding: '1rem', backgroundColor: '#fee2e2', borderRadius: '0.5rem', border: '1px solid #fca5a5' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#991b1b' }}>
                {stats.incorrect}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#991b1b', marginTop: '0.25rem' }}>
                Incorrect
              </div>
            </div>

            <div style={{ padding: '1rem', backgroundColor: '#f3f4f6', borderRadius: '0.5rem', border: '1px solid #d1d5db' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#6b7280' }}>
                {stats.unattempted}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                Not Attempted
              </div>
            </div>
          </div>
        </div>

        {/* Question-by-Question Review */}
        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
            Detailed Review
          </h3>

          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {results.questions.map((q: any, index: number) => (
              <div key={q.id} style={{
                padding: '1.5rem',
                backgroundColor: q.is_correct === true ? '#f0fdf4' :
                               q.is_correct === false ? '#fef2f2' : '#f9fafb',
                borderRadius: '0.5rem',
                border: '2px solid',
                borderColor: q.is_correct === true ? '#86efac' :
                            q.is_correct === false ? '#fca5a5' : '#e5e7eb'
              }}>
                {/* Question Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: '600', flex: 1 }}>
                    Question {index + 1}: {q.question_text}
                  </h4>
                  <div style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    backgroundColor: q.is_correct === true ? '#86efac' :
                                   q.is_correct === false ? '#fca5a5' : '#d1d5db',
                    color: q.is_correct === true ? '#166534' :
                          q.is_correct === false ? '#991b1b' : '#6b7280'
                  }}>
                    {q.is_correct === true ? 'Correct' :
                     q.is_correct === false ? 'Incorrect' : 'Not Attempted'}
                  </div>
                </div>

                {/* Question Image */}
                {q.image_url && (
                  <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
                    <img
                      src={q.image_url}
                      alt="Question diagram"
                      style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '0.375rem' }}
                    />
                  </div>
                )}

                {/* Options */}
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {['a', 'b', 'c', 'd'].map((opt) => {
                    const isCorrect = q.correct_answer === opt;
                    const isSelected = q.selected_answer === opt;

                    return (
                      <div key={opt} style={{
                        padding: '0.75rem',
                        borderRadius: '0.375rem',
                        border: '2px solid',
                        borderColor: isCorrect ? '#10b981' : isSelected ? '#ef4444' : '#e5e7eb',
                        backgroundColor: isCorrect ? '#d1fae5' : isSelected && !isCorrect ? '#fee2e2' : 'white',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                      }}>
                        <span style={{
                          fontWeight: '700',
                          fontSize: '0.875rem',
                          color: '#374151',
                          minWidth: '1.5rem'
                        }}>
                          {opt.toUpperCase()}.
                        </span>
                        <span style={{ flex: 1 }}>{q[`option_${opt}`]}</span>
                        {isCorrect && (
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            backgroundColor: '#10b981',
                            color: 'white',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}>
                            Correct Answer
                          </span>
                        )}
                        {isSelected && !isCorrect && (
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}>
                            Your Answer
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Not Attempted Message */}
                {!q.selected_answer && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '0.75rem',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '0.375rem',
                    color: '#6b7280',
                    fontSize: '0.875rem',
                    fontStyle: 'italic'
                  }}>
                    You did not attempt this question
                  </div>
                )}

                {/* Marks */}
                <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                  Marks: {q.marks} {q.is_correct === true ? `(Earned: ${q.marks})` : '(Earned: 0)'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
