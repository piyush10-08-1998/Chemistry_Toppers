import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient } from '../utils/api';
import type { Test, Question } from '../types';

export default function TakeTest() {
  const { testId } = useParams<{ testId: string }>();
  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: string }>({});
  const [confirmedAnswers, setConfirmedAnswers] = useState<{ [key: number]: string }>({});
  const [pendingAnswer, setPendingAnswer] = useState<{ [key: number]: string }>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [testStarted, setTestStarted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (testId && !testStarted) {
      fetchTest();
    }
  }, [testId, testStarted]);

  useEffect(() => {
    if (testStarted && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [testStarted, timeLeft]);

  const fetchTest = async () => {
    try {
      const response = await apiClient.getTest(parseInt(testId!));
      setTest(response.test);
      setQuestions(response.questions || []);
    } catch (error) {
      console.error('Error fetching test:', error);
      alert('Failed to load test');
      navigate('/student');
    }
  };

  const handleStartTest = async () => {
    setLoading(true);
    try {
      const response = await apiClient.startTest(parseInt(testId!));
      setAttemptId(response.attempt.id);
      setTimeLeft(test!.duration_minutes * 60);
      setTestStarted(true);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to start test');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnswer = (questionId: number, answer: string) => {
    // Just select the answer temporarily, don't save yet
    setPendingAnswer({ ...pendingAnswer, [questionId]: answer });
  };

  const handleConfirmAnswer = async (questionId: number) => {
    const answer = pendingAnswer[questionId];
    if (!answer) {
      alert('Please select an answer first');
      return;
    }

    setLoading(true);
    try {
      await apiClient.submitAnswer(attemptId!, questionId, answer);
      // Mark as confirmed and saved
      setConfirmedAnswers({ ...confirmedAnswers, [questionId]: answer });
      setSelectedAnswers({ ...selectedAnswers, [questionId]: answer });
      alert('Answer confirmed and saved!');
    } catch (error) {
      console.error('Error saving answer:', error);
      alert('Failed to save answer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!window.confirm('Are you sure you want to submit the test?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.submitTest(attemptId!);
      alert(`Test submitted! Score: ${response.score}/${response.total_marks}`);
      navigate('/student');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to submit test');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!testStarted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f9ff' }}>
        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', maxWidth: '600px', width: '100%' }}>
          {test && (
            <>
              <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1e40af' }}>
                {test.title}
              </h1>
              <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
                {test.description}
              </p>

              <div style={{ backgroundColor: '#f3f4f6', padding: '1rem', borderRadius: '0.375rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: '500' }}>Duration:</span>
                    <span>{test.duration_minutes} minutes</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: '500' }}>Total Questions:</span>
                    <span>{questions.length}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: '500' }}>Total Marks:</span>
                    <span>{test.total_marks}</span>
                  </div>
                </div>
              </div>

              <div style={{ backgroundColor: '#fef3c7', padding: '1rem', borderRadius: '0.375rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                <strong>Instructions:</strong>
                <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                  <li>Click on an option to select your answer</li>
                  <li>Click "Confirm Answer" button to save your selection</li>
                  <li>You can change and re-confirm your answer anytime</li>
                  <li>You can navigate between questions</li>
                  <li>Timer will start when you click "Start Test"</li>
                  <li>Test will auto-submit when time runs out</li>
                </ul>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={handleStartTest}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    backgroundColor: loading ? '#9ca3af' : '#10b981',
                    color: 'white',
                    fontWeight: '600',
                    borderRadius: '0.375rem',
                    border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '1rem'
                  }}
                >
                  {loading ? 'Starting...' : 'Start Test'}
                </button>
                <button
                  onClick={() => navigate('/student')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#6b7280',
                    color: 'white',
                    fontWeight: '600',
                    borderRadius: '0.375rem',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1rem'
                  }}
                >
                  Back
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f9ff' }}>
      {/* Header with Timer */}
      <div style={{ backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '1rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e40af' }}>
            {test?.title}
          </h1>
          <div style={{
            padding: '0.5rem 1rem',
            backgroundColor: timeLeft < 300 ? '#fee2e2' : '#dbeafe',
            color: timeLeft < 300 ? '#991b1b' : '#1e40af',
            borderRadius: '0.375rem',
            fontWeight: '600',
            fontSize: '1.125rem'
          }}>
            Time Left: {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        {/* Question Navigation */}
        <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '1.5rem' }}>
          <div style={{ marginBottom: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>
            <span style={{ fontWeight: '600' }}>Question Status:</span>{' '}
            <span style={{ color: '#10b981' }}>■ Confirmed</span>{' '}
            <span style={{ color: '#f59e0b' }}>■ Selected</span>{' '}
            <span style={{ color: '#3b82f6' }}>■ Current</span>{' '}
            <span style={{ color: '#6b7280' }}>■ Unanswered</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {questions.map((q, index) => {
              const isConfirmed = confirmedAnswers[q.id];
              const isPending = pendingAnswer[q.id] && !isConfirmed;
              const isCurrent = currentQuestionIndex === index;

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(index)}
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.375rem',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '500',
                    backgroundColor: isConfirmed
                      ? '#10b981'
                      : isPending
                      ? '#f59e0b'
                      : isCurrent
                      ? '#3b82f6'
                      : '#e5e7eb',
                    color: isConfirmed || isPending || isCurrent ? 'white' : '#374151'
                  }}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Current Question */}
        {currentQuestion && (
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>
                Question {currentQuestionIndex + 1} of {questions.length}
              </h2>
              <span style={{ fontSize: '0.875rem', color: '#4b5563' }}>
                {currentQuestion.marks} mark(s)
              </span>
            </div>

            <p style={{ fontSize: '1.125rem', marginBottom: '1.5rem', lineHeight: '1.6' }}>
              {currentQuestion.question_text}
            </p>

            {/* Display question image if available */}
            {currentQuestion.image_url && (
              <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                <img
                  src={`http://localhost:5001${currentQuestion.image_url}`}
                  alt="Question diagram"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '400px',
                    borderRadius: '0.5rem',
                    border: '2px solid #e5e7eb',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                />
              </div>
            )}

            <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
              {[
                { key: 'a', text: currentQuestion.option_a },
                { key: 'b', text: currentQuestion.option_b },
                { key: 'c', text: currentQuestion.option_c },
                { key: 'd', text: currentQuestion.option_d }
              ].map((option) => {
                const isConfirmed = confirmedAnswers[currentQuestion.id] === option.key;
                const isPending = pendingAnswer[currentQuestion.id] === option.key;

                return (
                  <button
                    key={option.key}
                    onClick={() => handleSelectAnswer(currentQuestion.id, option.key)}
                    style={{
                      padding: '1rem',
                      textAlign: 'left',
                      borderRadius: '0.375rem',
                      border: '2px solid',
                      borderColor: isConfirmed ? '#10b981' : isPending ? '#f59e0b' : '#e5e7eb',
                      backgroundColor: isConfirmed ? '#d1fae5' : isPending ? '#fef3c7' : 'white',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      transition: 'all 0.2s',
                      position: 'relative'
                    }}
                  >
                    <span style={{ fontWeight: '600', marginRight: '0.5rem' }}>
                      {option.key.toUpperCase()}.
                    </span>
                    {option.text}
                    {isConfirmed && (
                      <span style={{
                        position: 'absolute',
                        right: '1rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#10b981',
                        fontWeight: 'bold',
                        fontSize: '1.25rem'
                      }}>
                        ✓ Confirmed
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Confirm Answer Button */}
            <div style={{
              backgroundColor: '#f3f4f6',
              padding: '1rem',
              borderRadius: '0.375rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem'
            }}>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                {confirmedAnswers[currentQuestion.id] ? (
                  <span style={{ color: '#10b981', fontWeight: '600' }}>
                    ✓ Answer confirmed! You can change it anytime.
                  </span>
                ) : pendingAnswer[currentQuestion.id] ? (
                  <span style={{ color: '#f59e0b', fontWeight: '600' }}>
                    ⚠ Click "Confirm Answer" to save your selection
                  </span>
                ) : (
                  <span>Select an option above, then confirm your answer</span>
                )}
              </div>
              <button
                onClick={() => handleConfirmAnswer(currentQuestion.id)}
                disabled={!pendingAnswer[currentQuestion.id] || loading}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: !pendingAnswer[currentQuestion.id] || loading ? '#9ca3af' : '#10b981',
                  color: 'white',
                  fontWeight: '600',
                  borderRadius: '0.375rem',
                  border: 'none',
                  cursor: !pendingAnswer[currentQuestion.id] || loading ? 'not-allowed' : 'pointer',
                  fontSize: '1rem'
                }}
              >
                {loading ? 'Saving...' : 'Confirm Answer'}
              </button>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
          <button
            onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
            disabled={currentQuestionIndex === 0}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: currentQuestionIndex === 0 ? '#e5e7eb' : '#6b7280',
              color: currentQuestionIndex === 0 ? '#9ca3af' : 'white',
              fontWeight: '600',
              borderRadius: '0.375rem',
              border: 'none',
              cursor: currentQuestionIndex === 0 ? 'not-allowed' : 'pointer',
              fontSize: '1rem'
            }}
          >
            Previous
          </button>

          <div style={{ display: 'flex', gap: '1rem' }}>
            {currentQuestionIndex < questions.length - 1 ? (
              <button
                onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  fontWeight: '600',
                  borderRadius: '0.375rem',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: loading ? '#9ca3af' : '#10b981',
                  color: 'white',
                  fontWeight: '600',
                  borderRadius: '0.375rem',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '1rem'
                }}
              >
                {loading ? 'Submitting...' : 'Submit Test'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
