import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactCrop from 'react-image-crop';
import type { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { apiClient } from '../utils/api';
import type { Test, Question } from '../types';

export default function AddQuestions() {
  const { testId } = useParams<{ testId: string }>();
  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractedQuestions, setExtractedQuestions] = useState<any[]>([]);
  const navigate = useNavigate();

  const [newQuestion, setNewQuestion] = useState({
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'a' as 'a' | 'b' | 'c' | 'd',
    marks: 1,
    image_url: '',
    option_a_image: '',
    option_b_image: '',
    option_c_image: '',
    option_d_image: ''
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [optionImagePreviews, setOptionImagePreviews] = useState<{[key: string]: string}>({});
  const [uploadingOptionImage, setUploadingOptionImage] = useState<string | null>(null);

  // Crop modal state
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>({ unit: '%', width: 50, height: 50, x: 25, y: 25 });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [croppingImage, setCroppingImage] = useState(false);
  const [cropTarget, setCropTarget] = useState<'question' | 'option_a' | 'option_b' | 'option_c' | 'option_d'>('question');

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

      // Debug: Log image URLs
      response.questions?.forEach((q: any, index: number) => {
        if (q.image_url) {
          console.log(`Question ${index + 1} image_url:`, q.image_url?.substring(0, 50) + '...', 'Length:', q.image_url?.length);
        }
      });
    } catch (error) {
      console.error('Error fetching test:', error);
      alert('Failed to load test');
      navigate('/teacher');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    setUploadingImage(true);
    try {
      const response = await apiClient.uploadQuestionImage(file);
      setNewQuestion({ ...newQuestion, image_url: response.image_url });

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      alert('Image uploaded successfully!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setNewQuestion({ ...newQuestion, image_url: '' });
    setImagePreview(null);
  };

  const handleCropImage = async () => {
    if (!completedCrop || !imgRef.current) {
      alert('Please select a crop area first');
      return;
    }

    if (completedCrop.width === 0 || completedCrop.height === 0) {
      alert('Please select a valid crop area');
      return;
    }

    setCroppingImage(true);

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to create canvas context');
      }

      const image = imgRef.current;
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      canvas.width = completedCrop.width * scaleX;
      canvas.height = completedCrop.height * scaleY;

      ctx.drawImage(
        image,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0,
        0,
        canvas.width,
        canvas.height
      );

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Failed to create blob'));
          },
          'image/png',
          0.95
        );
      });

      const file = new File([blob], 'cropped-image.png', { type: 'image/png' });
      const response = await apiClient.uploadQuestionImage(file);

      // Update based on crop target
      if (cropTarget === 'question') {
        setNewQuestion(prev => ({ ...prev, image_url: response.image_url }));
        setImagePreview(response.image_url);
      } else {
        // For option images
        setNewQuestion(prev => ({ ...prev, [`${cropTarget}_image`]: response.image_url }));
        setOptionImagePreviews(prev => ({ ...prev, [cropTarget.replace('option_', '')]: response.image_url }));
      }

      setShowCropModal(false);
      setImageToCrop(null);
      alert('Cropped image uploaded successfully!');
    } catch (error: any) {
      console.error('Crop error:', error);
      alert(error.response?.data?.error || error.message || 'Failed to upload cropped image');
    } finally {
      setCroppingImage(false);
    }
  };

  const handleSkipCrop = () => {
    setShowCropModal(false);
    setImageToCrop(null);
  };

  const handleOptionImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, option: 'a' | 'b' | 'c' | 'd') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    setUploadingOptionImage(option);
    try {
      const response = await apiClient.uploadQuestionImage(file);
      setNewQuestion({ ...newQuestion, [`option_${option}_image`]: response.image_url });

      const reader = new FileReader();
      reader.onloadend = () => {
        setOptionImagePreviews(prev => ({ ...prev, [option]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to upload image');
    } finally {
      setUploadingOptionImage(null);
    }
  };

  const handleRemoveOptionImage = (option: 'a' | 'b' | 'c' | 'd') => {
    setNewQuestion({ ...newQuestion, [`option_${option}_image`]: '' });
    setOptionImagePreviews(prev => {
      const newPreviews = { ...prev };
      delete newPreviews[option];
      return newPreviews;
    });
  };

  const loadNextExtractedQuestion = () => {
    if (extractedQuestions.length > 0) {
      const nextQuestion = extractedQuestions[0];
      setNewQuestion({
        question_text: nextQuestion.question_text || '',
        option_a: nextQuestion.option_a || '',
        option_b: nextQuestion.option_b || '',
        option_c: nextQuestion.option_c || '',
        option_d: nextQuestion.option_d || '',
        correct_answer: nextQuestion.correct_answer || 'a',
        marks: nextQuestion.marks || 1,
        image_url: nextQuestion.image_url || '',
        option_a_image: '',
        option_b_image: '',
        option_c_image: '',
        option_d_image: ''
      });

      if (nextQuestion.image_url) {
        setImagePreview(nextQuestion.image_url);
      } else {
        setImagePreview(null);
      }

      setOptionImagePreviews({});
      setExtractedQuestions(extractedQuestions.slice(1));
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await apiClient.addQuestion(parseInt(testId!), newQuestion);

      // Refresh questions
      fetchTestAndQuestions();

      // If there are more extracted questions, load the next one
      if (extractedQuestions.length > 0) {
        loadNextExtractedQuestion();
        alert(`Question added! ${extractedQuestions.length} more extracted questions remaining.`);
      } else {
        // Clear form if no more extracted questions
        setNewQuestion({
          question_text: '',
          option_a: '',
          option_b: '',
          option_c: '',
          option_d: '',
          correct_answer: 'a',
          marks: 1,
          image_url: '',
          option_a_image: '',
          option_b_image: '',
          option_c_image: '',
          option_d_image: ''
        });
        setImagePreview(null);
        setOptionImagePreviews({});
        alert('Question added successfully!');
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to add question');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExtracting(true);
    setExtractedQuestions([]);

    try {
      const response = await apiClient.extractQuestions(file);
      console.log('Extraction response:', response);
      console.log('Questions with images:', response.questions);

      const questions = response.questions || [];
      if (questions.length > 0) {
        // Pre-fill the first extracted question into the manual form
        const firstQuestion = questions[0];
        setNewQuestion({
          question_text: firstQuestion.question_text || '',
          option_a: firstQuestion.option_a || '',
          option_b: firstQuestion.option_b || '',
          option_c: firstQuestion.option_c || '',
          option_d: firstQuestion.option_d || '',
          correct_answer: firstQuestion.correct_answer || 'a',
          marks: firstQuestion.marks || 1,
          image_url: firstQuestion.image_url || '',
          option_a_image: '',
          option_b_image: '',
          option_c_image: '',
          option_d_image: ''
        });

        // Set image preview if there's a question image - open crop modal
        if (firstQuestion.image_url) {
          setImageToCrop(firstQuestion.image_url);
          setShowCropModal(true);
        }

        // Store remaining questions for later
        setExtractedQuestions(questions.slice(1));

        if (firstQuestion.image_url) {
          alert(`Successfully extracted ${response.count} questions! First question loaded. Now crop the diagram/figure from the image.`);
        } else {
          alert(`Successfully extracted ${response.count} questions! First question loaded into form.`);
        }
      } else {
        alert('No questions found in the image.');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to extract questions';
      alert(errorMessage);
      console.error('Extraction error:', error);
    } finally {
      setExtracting(false);
    }
  };


  const handleDeleteQuestion = async (questionId: number) => {
    if (!confirm('Are you sure you want to delete this question?')) {
      return;
    }

    setLoading(true);
    try {
      await apiClient.deleteQuestion(questionId);
      fetchTestAndQuestions();
      alert('Question deleted successfully!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete question');
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

        {/* PDF/Image Question Extraction */}
        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#7c3aed' }}>
            AI Question Extraction from PDF/Image
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.5rem' }}>
            Upload a PDF or image of chemistry questions. AI will automatically extract questions, options, and answers.
          </p>

          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.gif,.webp"
            onChange={handleFileUpload}
            disabled={extracting}
            style={{
              marginBottom: '1rem',
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              width: '100%'
            }}
          />

          {extracting && (
            <div style={{ padding: '1rem', backgroundColor: '#eff6ff', borderRadius: '0.375rem', marginBottom: '1rem' }}>
              <p style={{ color: '#1e40af' }}>Extracting questions... This may take 10-30 seconds.</p>
            </div>
          )}

          {extractedQuestions.length > 0 && (
            <div style={{ padding: '1rem', backgroundColor: '#dcfce7', borderRadius: '0.375rem', border: '1px solid #86efac' }}>
              <p style={{ color: '#166534', fontWeight: '600', fontSize: '0.875rem' }}>
                ✓ {extractedQuestions.length} more extracted question(s) remaining. They will auto-load after you add each question.
              </p>
              <button
                onClick={loadNextExtractedQuestion}
                style={{
                  marginTop: '0.5rem',
                  padding: '0.5rem 1rem',
                  backgroundColor: '#16a34a',
                  color: 'white',
                  fontWeight: '500',
                  borderRadius: '0.375rem',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                Skip to Next Extracted Question
              </button>
            </div>
          )}
        </div>

        {/* Add Question Form */}
        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
            Add New Question Manually
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

            {/* Image Upload (Optional) */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                  Question Image (Optional - for diagrams, structures, etc.)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setNewQuestion({ ...newQuestion, image_url: '' });
                    setImagePreview(null);
                  }}
                  style={{
                    padding: '0.375rem 0.75rem',
                    backgroundColor: '#f59e0b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: '500'
                  }}
                >
                  Skip Image for this Question
                </button>
              </div>

              {!imagePreview ? (
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    style={{
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      width: '100%',
                      fontSize: '0.875rem'
                    }}
                  />
                  {uploadingImage && (
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
                      Uploading image...
                    </p>
                  )}
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
                    Upload chemical structures, diagrams, or any relevant image (max 5MB). Or click "Skip Image" above to continue without an image.
                  </p>
                </div>
              ) : (
                <div style={{ marginTop: '0.5rem' }}>
                  <div style={{
                    position: 'relative',
                    display: 'inline-block',
                    border: '2px solid #10b981',
                    borderRadius: '0.375rem',
                    padding: '0.5rem'
                  }}>
                    <img
                      src={imagePreview}
                      alt="Question preview"
                      style={{
                        maxWidth: '300px',
                        maxHeight: '200px',
                        borderRadius: '0.375rem'
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      style={{
                        position: 'absolute',
                        top: '0.25rem',
                        right: '0.25rem',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.25rem',
                        padding: '0.25rem 0.5rem',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <p style={{ fontSize: '0.875rem', color: '#10b981', fontWeight: '500' }}>
                      Image uploaded successfully!
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setCropTarget('question');
                        setImageToCrop(imagePreview);
                        setShowCropModal(true);
                      }}
                      style={{
                        padding: '0.25rem 0.75rem',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.25rem',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}
                    >
                      Crop Image
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Options */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>
                Answer Options (Text or Image)
              </label>

              {(['a', 'b', 'c', 'd'] as const).map((option) => (
                <div key={option} style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: '600', fontSize: '0.875rem', color: '#374151', textTransform: 'uppercase' }}>Option {option}</span>
                  </div>

                  <input
                    type="text"
                    required
                    value={newQuestion[`option_${option}`]}
                    onChange={(e) => setNewQuestion({ ...newQuestion, [`option_${option}`]: e.target.value })}
                    placeholder={`Enter option ${option.toUpperCase()} text`}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      marginBottom: '0.5rem'
                    }}
                  />

                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                    Optional: Add an image (e.g., chemical structure, diagram)
                  </div>

                  {!optionImagePreviews[option] ? (
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleOptionImageUpload(e, option)}
                        disabled={uploadingOptionImage === option}
                        style={{
                          padding: '0.25rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.375rem',
                          width: '100%',
                          fontSize: '0.75rem'
                        }}
                      />
                      {uploadingOptionImage === option && (
                        <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                          Uploading...
                        </p>
                      )}
                    </div>
                  ) : (
                    <div style={{ marginTop: '0.5rem' }}>
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <img
                          src={optionImagePreviews[option]}
                          alt={`Option ${option} preview`}
                          style={{
                            maxWidth: '150px',
                            maxHeight: '100px',
                            borderRadius: '0.375rem',
                            border: '1px solid #10b981'
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveOptionImage(option)}
                          style={{
                            position: 'absolute',
                            top: '-0.25rem',
                            right: '-0.25rem',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '9999px',
                            width: '20px',
                            height: '20px',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          ×
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setCropTarget(`option_${option}`);
                          setImageToCrop(optionImagePreviews[option]);
                          setShowCropModal(true);
                        }}
                        style={{
                          marginTop: '0.5rem',
                          padding: '0.25rem 0.75rem',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.25rem',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}
                      >
                        Crop Image
                      </button>
                    </div>
                  )}
                </div>
              ))}
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
                  {q.image_url && (
                    <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
                      <img
                        src={q.image_url}
                        alt="Question diagram"
                        onError={(e) => {
                          console.error('Image load error for question', q.id, 'URL length:', q.image_url?.length);
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.insertAdjacentHTML('afterend', '<p style="color: red; font-size: 0.875rem;">⚠️ Image failed to load</p>');
                        }}
                        onLoad={() => console.log('Image loaded successfully for question', q.id)}
                        style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '0.375rem', border: '1px solid #d1d5db' }}
                      />
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                    <strong style={{ fontSize: '1rem', flex: 1 }}>Q{index + 1}. {q.question_text}</strong>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.875rem', color: '#4b5563' }}>{q.marks} mark(s)</span>
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        disabled={loading}
                        style={{
                          padding: '0.25rem 0.5rem',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.25rem',
                          cursor: loading ? 'not-allowed' : 'pointer',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}
                      >
                        Delete
                      </button>
                    </div>
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

      {/* Crop Modal */}
      {showCropModal && imageToCrop && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '2rem'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            padding: '2rem',
            maxWidth: '900px',
            maxHeight: '90vh',
            overflow: 'auto',
            position: 'relative'
          }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: '#1e40af' }}>
              Crop Diagram/Figure
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.5rem' }}>
              Drag the selection box around the diagram or figure you want to include in the question. Resize by dragging the corners.
            </p>

            <div style={{ marginBottom: '1.5rem', maxHeight: '60vh', overflow: 'auto' }}>
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
              >
                <img
                  ref={imgRef}
                  src={imageToCrop}
                  alt="Crop preview"
                  crossOrigin="anonymous"
                  style={{ maxWidth: '100%', display: 'block' }}
                />
              </ReactCrop>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={handleSkipCrop}
                disabled={croppingImage}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  borderRadius: '0.375rem',
                  border: 'none',
                  cursor: croppingImage ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                Skip (Keep Full Image)
              </button>
              <button
                onClick={handleCropImage}
                disabled={croppingImage}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: croppingImage ? '#9ca3af' : '#10b981',
                  color: 'white',
                  borderRadius: '0.375rem',
                  border: 'none',
                  cursor: croppingImage ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                {croppingImage ? 'Cropping...' : 'Crop & Use'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
