# Quick Start Guide

Your Chemistry Test Platform is now ready to use!

## What's Running

- **Backend**: http://localhost:5000
- **Frontend**: http://localhost:5173

## How to Use

### For Teachers (Creating Tests and Questions)

1. **Login**
   - Open http://localhost:5173 in your browser
   - Click "Login" tab
   - Use these credentials:
     - Email: `teacher@chemistry.com`
     - Password: `admin123`

2. **Create a Test**
   - Click "Create New Test" button
   - Enter:
     - Test Title (e.g., "Chemical Bonding Test")
     - Description (optional)
     - Duration in minutes (e.g., 30)
   - Click "Create Test"

3. **Add Questions**
   - Click "Add Questions" button on your test
   - Fill in:
     - Question text
     - Four options (A, B, C, D)
     - Select the correct answer
     - Set marks (default is 1)
   - Click "Add Question"
   - The form will clear and you can add more questions
   - You can see all added questions below the form

### For Students (Taking Tests)

1. **Register**
   - Open http://localhost:5173 in your browser
   - Click "Register" tab
   - Enter:
     - Your name
     - Email address
     - Password
     - Select "Student" role
   - Click "Register"

2. **Take a Test**
   - You'll see all available tests
   - Click "Start Test" on any test
   - Review the test details
   - Click "Start Test" to begin
   - The timer will start automatically
   - Click on any option to select your answer (saves automatically)
   - Use "Previous" and "Next" buttons to navigate
   - Click "Submit Test" when done
   - Your score will be shown immediately

## Features

- **Auto-save**: Student answers are saved automatically
- **Timer**: Tests have a countdown timer
- **Question Navigation**: Students can jump to any question
- **Visual Indicators**: Green = answered, Blue = current question
- **Instant Grading**: Scores are calculated and shown immediately

## To Stop the Servers

Press `Ctrl+C` in your terminal (twice if needed)

## Next Steps

1. Try creating a teacher account: Register with "Teacher" role
2. Create multiple tests with different questions
3. Register student accounts and take the tests
4. Experiment with the duration and number of questions

## Tips

- Questions are saved immediately when you click "Add Question"
- Students can see which questions they've answered (green buttons)
- Test submits automatically when time runs out
- You can create as many tests and questions as you want
- All data is stored in memory (will reset when you restart the server)
Internal server error
Enjoy your Chemistry Test Platform!
