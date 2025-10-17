# Image Upload Feature for Chemistry Questions

## Overview
Your Chemistry Test Platform now supports uploading images for questions! This is perfect for organic chemistry questions with molecular structures like benzene, naphthalene, reaction mechanisms, and diagrams.

## How to Use

### For Teachers: Adding Questions with Images

#### Method 1: Manual Question Entry with Image Upload

1. **Navigate to Add Questions Page**
   - Go to your test
   - Click "Add Questions"

2. **Fill in Question Details**
   - Enter the question text
   - **NEW: Upload an image (optional)**
     - Click "Choose File" under "Question Image"
     - Select any image file (PNG, JPG, JPEG, GIF, WEBP)
     - Max file size: 5MB
     - Image will upload and show a preview
     - You can remove the image if needed

3. **Complete the Question**
   - Fill in options A, B, C, D
   - Select correct answer
   - Set marks
   - Click "Add Question"

#### Method 2: AI Extraction from PDF/Images (Already Working!)

- Upload a PDF or image with multiple questions
- AI will extract questions AND images
- Images are automatically attached to questions

### For Students: Taking Tests with Images

When taking a test:
- Questions with images will display them automatically
- Images appear between the question text and the answer options
- Images are clearly visible and centered
- Perfect for viewing molecular structures and diagrams

## Example Use Cases

### 1. Organic Chemistry Structures
**Question:** "Identify the IUPAC name of the following compound:"
**Image:** Upload a structure of benzene or naphthalene
**Options:** A) Benzene, B) Naphthalene, C) Anthracene, D) Phenol

### 2. Reaction Mechanisms
**Question:** "What is the major product of this reaction?"
**Image:** Upload reaction scheme with arrows
**Options:** Various products

### 3. Laboratory Diagrams
**Question:** "Name the apparatus shown below:"
**Image:** Upload lab equipment diagram
**Options:** Different apparatus names

### 4. Molecular Orbital Diagrams
**Question:** "Which molecular orbital diagram represents O₂?"
**Image:** Upload MO diagram
**Options:** Different configurations

## How to Prepare Images

### Recommended Tools for Creating Structures:
1. **ChemDraw** (Professional)
2. **ChemSketch** (Free)
3. **MarvinSketch** (Free)
4. **Avogadro** (Free, 3D structures)
5. **PubChem Sketcher** (Online, free)

### Tips for Best Results:
- Use white or light background
- Keep images clear and high contrast
- Export as PNG for best quality
- Keep file size under 5MB
- Crop unnecessary margins

### Quick Workflow:
1. Draw structure in ChemDraw/ChemSketch
2. Export as PNG (300 DPI recommended)
3. Upload when creating question
4. Preview to ensure clarity
5. Add question text and options

## Technical Details

### Backend Changes:
- New endpoint: `POST /api/questions/upload-image`
- Images stored in: `backend/question-images/`
- Supported formats: JPEG, JPG, PNG, GIF, WEBP
- Max file size: 5MB per image
- Images served statically at: `/question-images/`

### Frontend Changes:
- Image upload in AddQuestions form
- Image preview before submission
- Images display in TakeTest page
- Responsive image sizing

### Database:
- Questions table already has `image_url` column
- Stores relative URL path to image
- Example: `/question-images/question-1234567890-123456789.png`

## Troubleshooting

### Image Not Uploading
- Check file size (must be < 5MB)
- Ensure file is an image format
- Check backend server is running
- Verify uploads directory exists

### Image Not Displaying
- Check image URL in question
- Ensure backend server is serving static files
- Verify image file exists in `backend/question-images/`
- Check browser console for errors

### Image Quality Issues
- Use PNG format for better quality
- Increase export resolution (300+ DPI)
- Ensure original drawing is high quality
- Avoid over-compression

## Examples of Questions You Can Create

### Basic Organic Structures
```
Question: Identify this compound
Image: [Benzene ring structure]
A) Benzene
B) Cyclohexane
C) Cyclohexene
D) Phenol
```

### Functional Groups
```
Question: What functional group is circled?
Image: [Molecule with circled group]
A) Alcohol
B) Aldehyde
C) Ketone
D) Carboxylic acid
```

### Stereochemistry
```
Question: What is the configuration at the chiral center?
Image: [Chiral molecule with wedge/dash bonds]
A) R configuration
B) S configuration
C) E configuration
D) Z configuration
```

### Reaction Products
```
Question: What is the major product?
Image: [Reaction scheme with reagents]
A) [Structure A]
B) [Structure B]
C) [Structure C]
D) [Structure D]
```

## Best Practices

1. **Always provide clear images**
   - Structures should be easily readable
   - Use standard chemical drawing conventions
   - Include all relevant atoms and bonds

2. **Combine text and images effectively**
   - Use image for structure
   - Use text for additional context
   - Options can be text descriptions or image URLs

3. **Test your questions**
   - Preview in student view
   - Ensure images load correctly
   - Verify mobile responsiveness

4. **Organize your image library**
   - Keep source files organized
   - Use descriptive filenames before upload
   - Maintain a backup of original drawings

## Future Enhancements (Potential)

- [ ] Multiple images per question
- [ ] Image editor integration
- [ ] Structure drawing directly in platform
- [ ] LaTeX chemical formula support
- [ ] Image annotations
- [ ] Image library/repository
- [ ] Bulk image upload

## Support

If you encounter any issues:
1. Check this guide first
2. Verify backend server logs
3. Check browser console for errors
4. Ensure database is running
5. Verify file permissions on upload directories

---

**Your Chemistry Test Platform is now fully equipped for visual chemistry questions!**

Happy teaching! 🧪✨
