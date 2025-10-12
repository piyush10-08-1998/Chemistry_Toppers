"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTestResults = exports.submitTest = exports.submitAnswer = exports.startTest = void 0;
const database_1 = __importDefault(require("../utils/database"));
const startTest = async (req, res) => {
    try {
        const testId = parseInt(req.params.testId);
        const studentId = req.user.id;
        const testResult = await database_1.default.query('SELECT * FROM tests WHERE id = $1 AND is_active = true', [testId]);
        if (testResult.rows.length === 0) {
            return res.status(404).json({ error: 'Test not found or inactive' });
        }
        const existingAttempt = await database_1.default.query('SELECT * FROM test_attempts WHERE test_id = $1 AND student_id = $2', [testId, studentId]);
        if (existingAttempt.rows.length > 0) {
            const attempt = existingAttempt.rows[0];
            if (attempt.is_submitted) {
                return res.status(400).json({ error: 'Test already completed' });
            }
            return res.json({
                attempt: attempt,
                message: 'Resuming existing test attempt'
            });
        }
        const test = testResult.rows[0];
        const result = await database_1.default.query('INSERT INTO test_attempts (test_id, student_id, total_marks) VALUES ($1, $2, $3) RETURNING *', [testId, studentId, test.total_marks]);
        res.status(201).json({ attempt: result.rows[0] });
    }
    catch (error) {
        console.error('Start test error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.startTest = startTest;
const submitAnswer = async (req, res) => {
    try {
        const { attemptId, questionId, selectedAnswer } = req.body;
        const studentId = req.user.id;
        if (!['a', 'b', 'c', 'd'].includes(selectedAnswer)) {
            return res.status(400).json({ error: 'Invalid answer option' });
        }
        const attemptResult = await database_1.default.query('SELECT * FROM test_attempts WHERE id = $1 AND student_id = $2 AND is_submitted = false', [attemptId, studentId]);
        if (attemptResult.rows.length === 0) {
            return res.status(404).json({ error: 'Test attempt not found or already submitted' });
        }
        const questionResult = await database_1.default.query('SELECT * FROM questions WHERE id = $1', [questionId]);
        if (questionResult.rows.length === 0) {
            return res.status(404).json({ error: 'Question not found' });
        }
        const question = questionResult.rows[0];
        const isCorrect = question.correct_answer === selectedAnswer;
        await database_1.default.query(`INSERT INTO student_answers (attempt_id, question_id, selected_answer, is_correct)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (attempt_id, question_id) 
       DO UPDATE SET selected_answer = $3, is_correct = $4, answered_at = CURRENT_TIMESTAMP`, [attemptId, questionId, selectedAnswer, isCorrect]);
        res.json({
            message: 'Answer saved successfully',
            isCorrect: isCorrect
        });
    }
    catch (error) {
        console.error('Submit answer error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.submitAnswer = submitAnswer;
const submitTest = async (req, res) => {
    try {
        const { attemptId } = req.body;
        const studentId = req.user.id;
        const attemptResult = await database_1.default.query('SELECT * FROM test_attempts WHERE id = $1 AND student_id = $2 AND is_submitted = false', [attemptId, studentId]);
        if (attemptResult.rows.length === 0) {
            return res.status(404).json({ error: 'Test attempt not found or already submitted' });
        }
        const attempt = attemptResult.rows[0];
        const scoreResult = await database_1.default.query(`SELECT SUM(CASE WHEN sa.is_correct THEN q.marks ELSE 0 END) as score
       FROM student_answers sa
       JOIN questions q ON sa.question_id = q.id
       WHERE sa.attempt_id = $1`, [attemptId]);
        const score = scoreResult.rows[0].score || 0;
        const startTime = new Date(attempt.start_time);
        const endTime = new Date();
        const timeTaken = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
        await database_1.default.query(`UPDATE test_attempts 
       SET is_submitted = true, score = $1, end_time = CURRENT_TIMESTAMP, time_taken_minutes = $2
       WHERE id = $3`, [score, timeTaken, attemptId]);
        res.json({
            message: 'Test submitted successfully',
            score: score,
            totalMarks: attempt.total_marks,
            timeTaken: timeTaken
        });
    }
    catch (error) {
        console.error('Submit test error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.submitTest = submitTest;
const getTestResults = async (req, res) => {
    try {
        const testId = parseInt(req.params.testId);
        const { role, id: userId } = req.user;
        const testResult = await database_1.default.query('SELECT * FROM tests WHERE id = $1', [testId]);
        if (testResult.rows.length === 0) {
            return res.status(404).json({ error: 'Test not found' });
        }
        const test = testResult.rows[0];
        if (role === 'teacher' && test.created_by !== userId) {
            return res.status(403).json({ error: 'Access denied' });
        }
        let query;
        let params;
        if (role === 'teacher') {
            query = `
        SELECT ta.*, u.name as student_name, u.email as student_email
        FROM test_attempts ta
        JOIN users u ON ta.student_id = u.id
        WHERE ta.test_id = $1 AND ta.is_submitted = true
        ORDER BY ta.score DESC, ta.time_taken_minutes ASC
      `;
            params = [testId];
        }
        else {
            query = `
        SELECT ta.*
        FROM test_attempts ta
        WHERE ta.test_id = $1 AND ta.student_id = $2 AND ta.is_submitted = true
      `;
            params = [testId, userId];
        }
        const result = await database_1.default.query(query, params);
        res.json({ results: result.rows, test: test });
    }
    catch (error) {
        console.error('Get test results error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getTestResults = getTestResults;
