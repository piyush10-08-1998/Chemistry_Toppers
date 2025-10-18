import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../utils/api';
import type { Test, User } from '../types';

export default function TeacherDashboard() {
  const [tests, setTests] = useState<Test[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [showCreateTest, setShowCreateTest] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'NEET' | 'JEE'>('ALL');
  const navigate = useNavigate();

  const [newTest, setNewTest] = useState({
    title: '',
    description: '',
    duration_minutes: 30,
    exam_type: 'NEET' as 'NEET' | 'JEE'
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      fetchTests();
    } else {
      navigate('/');
    }
  }, [navigate]);

  const fetchTests = async (filter?: 'NEET' | 'JEE') => {
    try {
      const response = await apiClient.getTests(filter);
      setTests(response.tests || []);
    } catch (error) {
      console.error('Error fetching tests:', error);
    }
  };

  useEffect(() => {
    if (user) {
      if (selectedFilter === 'ALL') {
        fetchTests();
      } else {
        fetchTests(selectedFilter);
      }
    }
  }, [selectedFilter, user]);

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await apiClient.createTest(
        newTest.title,
        newTest.description,
        newTest.duration_minutes,
        newTest.exam_type
      );
      setNewTest({ title: '', description: '', duration_minutes: 30, exam_type: 'NEET' });
      setShowCreateTest(false);
      if (selectedFilter === 'ALL') {
        fetchTests();
      } else {
        fetchTests(selectedFilter);
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create test');
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

  const handleDeleteTest = async (testId: number, testTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete "${testTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await apiClient.deleteTest(testId);
      // Refresh the test list
      if (selectedFilter === 'ALL') {
        fetchTests();
      } else {
        fetchTests(selectedFilter);
      }
      alert('Test deleted successfully');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete test');
    }
  };

  const handleTogglePublish = async (testId: number) => {
    try {
      const response = await apiClient.togglePublishTest(testId);
      alert(response.message);
      // Refresh the test list
      if (selectedFilter === 'ALL') {
        fetchTests();
      } else {
        fetchTests(selectedFilter);
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update test status');
    }
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
                Teacher Dashboard - Manage Tests & Students
              </p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate('/teacher/students')}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  borderRadius: '0.375rem',
                  border: '1px solid rgba(255,255,255,0.3)',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                View Students Analytics
              </button>
              <span style={{ fontSize: '0.875rem' }}>
                {user?.name}
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

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1f2937' }}>
            {selectedFilter === 'ALL' ? 'All Tests' : `${selectedFilter} Tests`}
          </h2>
          <button
            onClick={() => setShowCreateTest(!showCreateTest)}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#10b981',
              color: 'white',
              fontWeight: '600',
              borderRadius: '0.375rem',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            {showCreateTest ? 'Cancel' : '+ Create New Test'}
          </button>
        </div>

        {/* Create Test Form */}
        {showCreateTest && (
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Create New Test</h3>
            <form onSubmit={handleCreateTest}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>
                  Test Title
                </label>
                <input
                  type="text"
                  required
                  value={newTest.title}
                  onChange={(e) => setNewTest({ ...newTest, title: e.target.value })}
                  placeholder="e.g., Chemical Bonding Test"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>
                  Description
                </label>
                <textarea
                  value={newTest.description}
                  onChange={(e) => setNewTest({ ...newTest, description: e.target.value })}
                  placeholder="Brief description of the test"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '1rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>
                  Exam Type
                </label>
                <select
                  value={newTest.exam_type}
                  onChange={(e) => setNewTest({ ...newTest, exam_type: e.target.value as 'NEET' | 'JEE' })}
                  style={{
                    width: '200px',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '1rem',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="NEET">NEET</option>
                  <option value="JEE">JEE</option>
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  required
                  min="5"
                  max="180"
                  value={newTest.duration_minutes}
                  onChange={(e) => setNewTest({ ...newTest, duration_minutes: parseInt(e.target.value) })}
                  style={{
                    width: '200px',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <button
                type="submit"
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
                {loading ? 'Creating...' : 'Create Test'}
              </button>
            </form>
          </div>
        )}

        {/* Tests List */}
        <div style={{ display: 'grid', gap: '1rem' }}>
          {tests.length === 0 ? (
            <div style={{ backgroundColor: 'white', padding: '3rem', borderRadius: '0.5rem', textAlign: 'center', color: '#6b7280' }}>
              <p style={{ fontSize: '1.125rem' }}>No tests created yet</p>
              <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Click "Create New Test" to get started</p>
            </div>
          ) : (
            tests.map((test) => (
              <div
                key={test.id}
                style={{
                  backgroundColor: 'white',
                  padding: '1.5rem',
                  borderRadius: '0.5rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>
                      {test.title}
                    </h3>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      backgroundColor: test.exam_type === 'NEET' ? '#fef2f2' : '#f0fdf4',
                      color: test.exam_type === 'NEET' ? '#dc2626' : '#059669',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      borderRadius: '0.375rem',
                      border: `1px solid ${test.exam_type === 'NEET' ? '#fecaca' : '#bbf7d0'}`
                    }}>
                      {test.exam_type}
                    </span>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      backgroundColor: test.is_published ? '#ecfdf5' : '#fef3c7',
                      color: test.is_published ? '#059669' : '#d97706',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      borderRadius: '0.375rem',
                      border: `1px solid ${test.is_published ? '#bbf7d0' : '#fde68a'}`
                    }}>
                      {test.is_published ? '✓ Published' : '⚠ Draft'}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                    {test.description}
                  </p>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#4b5563' }}>
                    <span>Duration: {test.duration_minutes} minutes</span>
                    <span>Total Marks: {test.total_marks}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '180px' }}>
                  <button
                    onClick={() => navigate(`/teacher/test/${test.id}`)}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      fontWeight: '500',
                      borderRadius: '0.375rem',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    Add Questions
                  </button>
                  <button
                    onClick={() => handleTogglePublish(test.id)}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: test.is_published ? '#f59e0b' : '#10b981',
                      color: 'white',
                      fontWeight: '500',
                      borderRadius: '0.375rem',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    {test.is_published ? 'Unpublish' : 'Send to Students'}
                  </button>
                  <button
                    onClick={() => handleDeleteTest(test.id, test.title)}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      fontWeight: '500',
                      borderRadius: '0.375rem',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    Delete Test
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
