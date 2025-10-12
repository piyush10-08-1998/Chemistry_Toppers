"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTest = exports.addQuestion = exports.getTest = exports.getTests = exports.createTest = void 0;
const database_1 = __importDefault(require("../utils/database"));
const createTest = async (req, res) => {
    try {
        const { title, description, duration_minutes } = req.body;
        const teacherId = req.user.id;
        if (!title || !duration_minutes) {
            return res.status(400).json({ error: 'Title and duration are required' });
        }
        const result = await database_1.default.query('INSERT INTO tests (title, description, duration_minutes, created_by) VALUES ($1, $2, $3, $4) RETURNING *', [title, description || '', duration_minutes, teacherId]);
        res.status(201).json({ test: result.rows[0] });
    }
    catch (error) {
        console.error('Create test error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.createTest = createTest;
const getTests = async (req, res) => {
    try {
        const { role } = req.user;
        let query;
        let params = [];
        if (role === 'teacher') {
            query = 'SELECT * FROM tests WHERE created_by = $1 ORDER BY created_at DESC';
            params = [req.user.id];
        }
        else {
            query = 'SELECT id, title, description, duration_minutes, total_marks FROM tests WHERE is_active = true ORDER BY created_at DESC';
        }
        const result = await database_1.default.query(query, params);
        res.json({ tests: result.rows });
    }
    catch (error) {
        console.error('Get tests error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getTests = getTests;
const getTest = async (req, res) => {
    try {
        const testId = parseInt(req.params.id);
        const { role, id: userId } = req.user;
        const testResult = await database_1.default.query('SELECT * FROM tests WHERE id = $1', [testId]);
        if (testResult.rows.length === 0) {
            return res.status(404).json({ error: 'Test not found' });
        }
        const test = testResult.rows[0];
        if (role === 'teacher' && test.created_by !== userId) {
            return res.status(403).json({ error: 'Access denied' });
        }
        const questionsResult = await database_1.default.query('SELECT * FROM questions WHERE test_id = $1 ORDER BY question_order, id', [testId]);
        const responseData = {
            test,
            questions: questionsResult.rows
        };
        if (role === 'student') {
            responseData.questions = questionsResult.rows.map((q) => ({
                id: q.id,
                question_text: q.question_text,
                option_a: q.option_a,
                option_b: q.option_b,
                option_c: q.option_c,
                option_d: q.option_d,
                marks: q.marks
            }));
        }
        res.json(responseData);
    }
    catch (error) {
        console.error('Get test error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getTest = getTest;
const addQuestion = async (req, res) => {
    try {
        const testId = parseInt(req.params.id);
        const { question_text, option_a, option_b, option_c, option_d, correct_answer, marks = 1 } = req.body;
        const testResult = await database_1.default.query('SELECT created_by FROM tests WHERE id = $1', [testId]);
        if (testResult.rows.length === 0) {
            return res.status(404).json({ error: 'Test not found' });
        }
        if (testResult.rows[0].created_by !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }
        if (!question_text || !option_a || !option_b || !option_c || !option_d || !correct_answer) {
            return res.status(400).json({ error: 'All question fields are required' });
        }
        if (!['a', 'b', 'c', 'd'].includes(correct_answer)) {
            return res.status(400).json({ error: 'Correct answer must be a, b, c, or d' });
        }
        const questionCountResult = await database_1.default.query('SELECT COUNT(*) as count FROM questions WHERE test_id = $1', [testId]);
        const questionOrder = parseInt(questionCountResult.rows[0].count) + 1;
        const result = await database_1.default.query(`INSERT INTO questions 
       (test_id, question_text, option_a, option_b, option_c, option_d, correct_answer, marks, question_order) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`, [testId, question_text, option_a, option_b, option_c, option_d, correct_answer, marks, questionOrder]);
        await database_1.default.query('UPDATE tests SET total_marks = total_marks + $1 WHERE id = $2', [marks, testId]);
        res.status(201).json({ question: result.rows[0] });
    }
    catch (error) {
        console.error('Add question error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.addQuestion = addQuestion;
const deleteTest = async (req, res) => {
    try {
        const testId = parseInt(req.params.id);
        const testResult = await database_1.default.query('SELECT created_by FROM tests WHERE id = $1', [testId]);
        if (testResult.rows.length === 0) {
            return res.status(404).json({ error: 'Test not found' });
        }
        if (testResult.rows[0].created_by !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }
        await database_1.default.query('DELETE FROM tests WHERE id = $1', [testId]);
        res.json({ message: 'Test deleted successfully' });
    }
    catch (error) {
        console.error('Delete test error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.deleteTest = deleteTest;
