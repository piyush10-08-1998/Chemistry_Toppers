import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient } from '../utils/api';
import type { Test, Question } from '../types';

export default function AddQuestions() {
  const { testId } = useParams<{ testId: string }>();
  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [newQuestion, setNewQuestion] = useState({
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'a' as 'a' | 'b' | 'c' | 'd',
    marks: 1
  });

  useEffect(() => {
    if (testId) {
      fetchTestAndQuestions();
    }
  }, [testId]);

  const fetchTestAndQuestions = async () => {
    try {
      const response = await apiClient.getTest(parseInt(testId!));
      setTest(response.test);
      setQuestions(response.questions || []);
    } catch (error) {
      console.error('Error fetching test:', error);
      alert('Failed to load test');
      navigate('/teacher');
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await apiClient.addQuestion(parseInt(testId!), newQuestion);

      // Clear form
      setNewQuestion({
        question_text: '',
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        correct_answer: 'a',
        marks: 1
      });

      // Refresh questions
      fetchTestAndQuestions();
      alert('Question added successfully!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to add question');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f9ff' }}>
      {/* Header */}
      <div style={{ backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '1rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e40af' }}>
            Add Questions
          </h1>
          <button
            onClick={() => navigate('/teacher')}
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
        {test && (
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>
              {test.title}
            </h2>
            <p style={{ color: '#6b7280', marginBottom: '0.5rem' }}>{test.description}</p>
            <div style={{ display: 'flex', gap: '2rem', fontSize: '0.875rem', color: '#4b5563' }}>
              <span><strong>Duration:</strong> {test.duration_minutes} minutes</span>
              <span><strong>Total Questions:</strong> {questions.length}</span>
              <span><strong>Total Marks:</strong> {test.total_marks}</span>
            </div>
          </div>
        )}

        {/* Add Question Form */}
        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
            Add New Question
          </h3>

          <form onSubmit={handleAddQuestion}>
            {/* Question Text */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                Question
              </label>
              <textarea
                required
                value={newQuestion.question_text}
                onChange={(e) => setNewQuestion({ ...newQuestion, question_text: e.target.value })}
                placeholder="Enter your chemistry question here..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '1rem',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Options */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                  Option A
                </label>
                <input
                  type="text"
                  required
                  value={newQuestion.option_a}
                  onChange={(e) => setNewQuestion({ ...newQuestion, option_a: e.target.value })}
                  placeholder="First option"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                  Option B
                </label>
                <input
                  type="text"
                  required
                  value={newQuestion.option_b}
                  onChange={(e) => setNewQuestion({ ...newQuestion, option_b: e.target.value })}
                  placeholder="Second option"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                  Option C
                </label>
                <input
                  type="text"
                  required
                  value={newQuestion.option_c}
                  onChange={(e) => setNewQuestion({ ...newQuestion, option_c: e.target.value })}
                  placeholder="Third option"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                  Option D
                </label>
                <input
                  type="text"
                  required
                  value={newQuestion.option_d}
                  onChange={(e) => setNewQuestion({ ...newQuestion, option_d: e.target.value })}
                  placeholder="Fourth option"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '1rem'
                  }}
                />
              </div>
            </div>

            {/* Correct Answer and Marks */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                  Correct Answer
                </label>
                <select
                  value={newQuestion.correct_answer}
                  onChange={(e) => setNewQuestion({ ...newQuestion, correct_answer: e.target.value as 'a' | 'b' | 'c' | 'd' })}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '1rem'
                  }}
                >
                  <option value="a">A</option>
                  <option value="b">B</option>
                  <option value="c">C</option>
                  <option value="d">D</option>
                </select>
              </div>

              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                  Marks
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="10"
                  value={newQuestion.marks}
                  onChange={(e) => setNewQuestion({ ...newQuestion, marks: parseInt(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '1rem'
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.75rem 2rem',
                backgroundColor: loading ? '#9ca3af' : '#10b981',
                color: 'white',
                fontWeight: '600',
                borderRadius: '0.375rem',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '1rem'
              }}
            >
              {loading ? 'Adding Question...' : '+ Add Question'}
            </button>
          </form>
        </div>

        {/* Questions List */}
        {questions.length > 0 && (
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
              Questions Added ({questions.length})
            </h3>

            <div style={{ display: 'grid', gap: '1.5rem' }}>
              {questions.map((q, index) => (
                <div key={q.id} style={{ padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.375rem', border: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <strong style={{ fontSize: '1rem' }}>Q{index + 1}. {q.question_text}</strong>
                    <span style={{ fontSize: '0.875rem', color: '#4b5563' }}>{q.marks} mark(s)</span>
                  </div>
                  <div style={{ display: 'grid', gap: '0.5rem', paddingLeft: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{
                        backgroundColor: q.correct_answer === 'a' ? '#10b981' : '#e5e7eb',
                        color: q.correct_answer === 'a' ? 'white' : '#374151',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.875rem',
                        fontWeight: '500'
                      }}>A</span>
                      <span>{q.option_a}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{
                        backgroundColor: q.correct_answer === 'b' ? '#10b981' : '#e5e7eb',
                        color: q.correct_answer === 'b' ? 'white' : '#374151',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.875rem',
                        fontWeight: '500'
                      }}>B</span>
                      <span>{q.option_b}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{
                        backgroundColor: q.correct_answer === 'c' ? '#10b981' : '#e5e7eb',
                        color: q.correct_answer === 'c' ? 'white' : '#374151',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.875rem',
                        fontWeight: '500'
                      }}>C</span>
                      <span>{q.option_c}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{
                        backgroundColor: q.correct_answer === 'd' ? '#10b981' : '#e5e7eb',
                        color: q.correct_answer === 'd' ? 'white' : '#374151',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.875rem',
                        fontWeight: '500'
                      }}>D</span>
                      <span>{q.option_d}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
