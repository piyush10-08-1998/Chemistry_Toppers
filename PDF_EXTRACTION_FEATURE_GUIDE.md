# PDF/Image Question Extraction Feature - Complete Guide

## Overview
Your Chemistry Toppers platform now has AI-powered question extraction from PDFs and images! Teachers can upload chemistry question papers and automatically extract questions.

## What's Been Built

### Backend ✅ (Completed)
1. **Dependencies Installed**: multer, pdf-parse, @anthropic-ai/sdk
2. **AI Service**: `/backend/src/services/questionExtractor.js`
   - Extracts questions from images and PDFs using Claude Vision API
   - Handles chemical structures and diagrams
3. **API Endpoints**:
   - `POST /api/questions/extract` - Upload and extract questions
   - `POST /api/tests/:id/questions/bulk` - Add extracted questions to a test
4. **Environment Variables**: ANTHROPIC_API_KEY added to local `.env`

### Frontend ✅ (API Methods Ready)
- `/frontend/src/utils/api.ts` updated with:
  - `extractQuestions(file)` - Upload file for extraction
  - `bulkAddQuestions(testId, questions)` - Add multiple questions

## What You Need to Do

### Step 1: Add Credits to Anthropic Account
1. Go to https://console.anthropic.com/settings/billing
2. Add payment method
3. Purchase credits (minimum $5)
4. Cost: ~$0.003 per image (very cheap!)

### Step 2: Add Frontend UI (Code Provided Below)

Open `/frontend/src/pages/AddQuestions.tsx` and add this code after line 109 (after the test details card):

```typescript
        {/* PDF/Image Question Extraction */}
        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#7c3aed' }}>
            📄 Extract Questions from PDF/Image
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
              <p style={{ color: '#1e40af' }}>🔄 Extracting questions... This may take 10-30 seconds.</p>
            </div>
          )}

          {extractedQuestions.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>
                Extracted {extractedQuestions.length} Questions - Review & Add
              </h4>

              <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '1rem' }}>
                {extractedQuestions.map((q, index) => (
                  <div key={index} style={{ padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.375rem', border: '1px solid #e5e7eb', marginBottom: '1rem' }}>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <strong>Q{index + 1}:</strong> {q.question_text}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#4b5563', paddingLeft: '1rem' }}>
                      <div>A: {q.option_a}</div>
                      <div>B: {q.option_b}</div>
                      <div>C: {q.option_c}</div>
                      <div>D: {q.option_d}</div>
                      {q.correct_answer && (
                        <div style={{ marginTop: '0.5rem', color: '#10b981', fontWeight: '600' }}>
                          ✓ Correct Answer: {q.correct_answer.toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleBulkAddQuestions}
                disabled={loading}
                style={{
                  padding: '0.75rem 2rem',
                  backgroundColor: loading ? '#9ca3af' : '#7c3aed',
                  color: 'white',
                  fontWeight: '600',
                  borderRadius: '0.375rem',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '1rem'
                }}
              >
                {loading ? 'Adding Questions...' : `✅ Add All ${extractedQuestions.length} Questions to Test`}
              </button>
            </div>
          )}
        </div>
```

### Step 3: Add State Variables

At the top of the component, add these state variables (around line 11):

```typescript
  const [extracting, setExtracting] = useState(false);
  const [extractedQuestions, setExtractedQuestions] = useState<any[]>([]);
```

### Step 4: Add Handler Functions

Add these functions before the return statement (around line 68):

```typescript
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExtracting(true);
    setExtractedQuestions([]);

    try {
      const response = await apiClient.extractQuestions(file);
      setExtractedQuestions(response.questions || []);
      alert(`Successfully extracted ${response.count} questions!`);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to extract questions';
      alert(errorMessage);
      console.error('Extraction error:', error);
    } finally {
      setExtracting(false);
    }
  };

  const handleBulkAddQuestions = async () => {
    if (extractedQuestions.length === 0) return;

    setLoading(true);
    try {
      await apiClient.bulkAddQuestions(parseInt(testId!), extractedQuestions);
      setExtractedQuestions([]);
      fetchTestAndQuestions();
      alert(`Successfully added ${extractedQuestions.length} questions to the test!`);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to add questions');
    } finally {
      setLoading(false);
    }
  };
```

## How to Use (After Setup)

### For Teachers:
1. Login to teacher dashboard
2. Go to any test → "Add Questions"
3. You'll see a new section: "Extract Questions from PDF/Image"
4. Click "Choose File" and select your chemistry question paper (PDF or image)
5. Wait 10-30 seconds while AI extracts questions
6. Review the extracted questions
7. Click "Add All X Questions to Test"
8. Done! All questions are now in your test

### Supported File Types:
- PDF files (.pdf)
- Images (.png, .jpg, .jpeg, .gif, .webp)

### What AI Can Extract:
- Question text (including chemical formulas)
- Chemical structures (described in text)
- Options A, B, C, D
- Correct answers (if marked in the source)
- Multi-choice questions

## Deploy to Production

When you're ready to deploy:

1. Add `ANTHROPIC_API_KEY` to Render environment variables:
   - Go to Render Dashboard
   - Click on `chemistry-toppers-backend`
   - Go to "Environment" tab
   - Add: `ANTHROPIC_API_KEY` = `your-key-here`
   - Save and redeploy

2. Commit and push your frontend changes:
```bash
git add .
git commit -m "Add PDF/Image question extraction feature"
git push origin main
```

3. Render will automatically redeploy both frontend and backend

## Cost Estimate
- Claude 3.5 Sonnet Vision API: ~$0.003 per image
- 100 question extractions ≈ $0.30
- 1000 question extractions ≈ $3.00
- Very affordable for daily use!

## Troubleshooting

**"Credit balance too low" error:**
- Add credits to your Anthropic account at https://console.anthropic.com/settings/billing

**"Failed to extract questions":**
- Make sure image/PDF has clear, readable text
- Check that questions are in standard MCQ format
- Try a different image with better quality

**Questions extracted incorrectly:**
- Review extracted questions before adding
- Edit any incorrect questions manually
- AI works best with clearly formatted questions

## Example Usage

Upload this type of content:
```
4. Compare the heats of combustion of above compounds:
   (a) (i) > (ii) > (iii)
   (b) (i) > (iii) > (ii)
   (c) (ii) > (i) > (iii)
   (d) (ii) > (iii) > (i)

5. Which of the following is not a resonance structure of the others?
   [Chemical structures shown]
```

AI will extract:
- Question text
- All four options
- Chemical structure descriptions
- Ready to add to your test!

---

**Your platform now has AI-powered question extraction! 🎉**

Add credits to your Anthropic account and you're ready to go!
