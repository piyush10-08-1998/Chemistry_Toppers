const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs').promises;
const pdfParse = require('pdf-parse');

class QuestionExtractorService {
  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Extract questions from an image file
   */
  async extractFromImage(imagePath) {
    try {
      // Read image file and convert to base64
      const imageBuffer = await fs.readFile(imagePath);
      const base64Image = imageBuffer.toString('base64');

      // Determine media type from file extension
      const ext = imagePath.toLowerCase().split('.').pop();
      const mediaTypeMap = {
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'gif': 'image/gif',
        'webp': 'image/webp'
      };
      const mediaType = mediaTypeMap[ext] || 'image/png';

      // Call Claude API with vision
      const message = await this.anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: base64Image,
                },
              },
              {
                type: 'text',
                text: `You are a chemistry question extraction expert. Extract all multiple choice questions from this image with MAXIMUM ACCURACY.

CRITICAL INSTRUCTIONS:
1. Extract the EXACT question text word-for-word as written in the image
2. For chemical structures/diagrams that appear in the question:
   - Describe the structure in detail (e.g., "cyclic structure with 6 carbons", "benzene ring with OH group", "alkene chain")
   - Include any labels like (i), (ii), (iii) or (a), (b), (c) for different structures
   - Note any functional groups, bonds (single/double/triple), or special features
3. Extract all 4 options EXACTLY as written (including any chemical formulas like CH3, H2O, etc.)
4. If structures appear in options, describe them (e.g., "Option A: benzene ring structure", "Option B: linear alkane chain")
5. Identify correct answer only if clearly marked (by checkmark, circle, bold, etc.)

EXAMPLES:
- If image shows "4. Compare the heats of combustion of above compounds:" where compounds (i), (ii), (iii) are shown as diagrams, write:
  "Compare the heats of combustion of above compounds: (i) [describe structure i], (ii) [describe structure ii], (iii) [describe structure iii]"

- If image shows resonance structures labeled (a), (b), (c), (d), write:
  "Which of the following is not a resonance structure of the others? (a) [describe structure], (b) [describe structure], (c) [describe structure], (d) [describe structure]"

Return ONLY a JSON array in this EXACT format:
[
  {
    "question_text": "Complete question text with all structure descriptions",
    "option_a": "Complete option A text with structures if any",
    "option_b": "Complete option B text with structures if any",
    "option_c": "Complete option C text with structures if any",
    "option_d": "Complete option D text with structures if any",
    "correct_answer": "a" or "b" or "c" or "d" or null,
    "marks": 1
  }
]

IMPORTANT: Return ONLY the JSON array, no other text before or after.`
              }
            ],
          },
        ],
      });

      // Parse the response
      const responseText = message.content[0].text;

      // Extract JSON from response (handle cases where AI adds explanation)
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Could not parse JSON from AI response');
      }

      const questions = JSON.parse(jsonMatch[0]);

      return {
        success: true,
        questions,
        count: questions.length
      };
    } catch (error) {
      console.error('Error extracting from image:', error);
      return {
        success: false,
        error: error.message,
        questions: []
      };
    }
  }

  /**
   * Extract questions from a PDF file
   */
  async extractFromPDF(pdfPath) {
    try {
      // Read and parse PDF
      const dataBuffer = await fs.readFile(pdfPath);
      const pdfData = await pdfParse(dataBuffer);

      // Extract text content
      const text = pdfData.text;

      // Call Claude API to extract questions from text
      const message = await this.anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: `You are a chemistry question extraction expert. Extract all multiple choice questions from this text.

Text content:
${text}

For each question, provide:
1. Question text (include any chemical formulas)
2. Four options (a, b, c, d)
3. Correct answer (if visible)

Return the result as a JSON array with this format:
[
  {
    "question_text": "Question text here",
    "option_a": "First option",
    "option_b": "Second option",
    "option_c": "Third option",
    "option_d": "Fourth option",
    "correct_answer": "a" (or null if not visible),
    "marks": 1
  }
]

IMPORTANT: Return ONLY the JSON array, no other text.`
          }
        ]
      });

      // Parse the response
      const responseText = message.content[0].text;

      // Extract JSON from response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Could not parse JSON from AI response');
      }

      const questions = JSON.parse(jsonMatch[0]);

      return {
        success: true,
        questions,
        count: questions.length
      };
    } catch (error) {
      console.error('Error extracting from PDF:', error);
      return {
        success: false,
        error: error.message,
        questions: []
      };
    }
  }

  /**
   * Main extraction method that handles both PDFs and images
   */
  async extract(filePath, fileType) {
    if (fileType === 'application/pdf') {
      return await this.extractFromPDF(filePath);
    } else if (fileType.startsWith('image/')) {
      return await this.extractFromImage(filePath);
    } else {
      return {
        success: false,
        error: 'Unsupported file type. Please upload PDF or image files.',
        questions: []
      };
    }
  }
}

module.exports = new QuestionExtractorService();
