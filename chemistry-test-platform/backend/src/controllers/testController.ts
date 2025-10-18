import { Response } from 'express';
import pool from '../utils/database';
import { AuthRequest } from '../middleware/auth';
import { CreateTestData, CreateQuestionData, Test, Question } from '../models/Test';

export const createTest = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, duration_minutes, exam_type }: CreateTestData = req.body;
    const teacherId = req.user!.id;

    if (!title || !duration_minutes) {
      return res.status(400).json({ error: 'Title and duration are required' });
    }

    if (!exam_type || !['NEET', 'JEE'].includes(exam_type)) {
      return res.status(400).json({ error: 'Exam type must be either NEET or JEE' });
    }

    const result = await pool.query(
      'INSERT INTO tests (title, description, duration_minutes, exam_type, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [title, description || '', duration_minutes, exam_type, teacherId]
    );

    res.status(201).json({ test: result.rows[0] });
  } catch (error) {
    console.error('Create test error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getTests = async (req: AuthRequest, res: Response) => {
  try {
    const { role } = req.user!;
    const { exam_type } = req.query; // Get exam_type filter from query params

    let query: string;
    let params: any[] = [];

    if (role === 'teacher') {
      // Teachers see ALL their tests (both published and unpublished)
      if (exam_type && ['NEET', 'JEE'].includes(exam_type as string)) {
        query = 'SELECT * FROM tests WHERE created_by = $1 AND exam_type = $2 ORDER BY created_at DESC';
        params = [req.user!.id, exam_type];
      } else {
        query = 'SELECT * FROM tests WHERE created_by = $1 ORDER BY created_at DESC';
        params = [req.user!.id];
      }
    } else {
      // Students see ONLY published tests
      if (exam_type && ['NEET', 'JEE'].includes(exam_type as string)) {
        query = 'SELECT id, title, description, duration_minutes, total_marks, exam_type FROM tests WHERE is_active = true AND is_published = true AND exam_type = $1 ORDER BY created_at DESC';
        params = [exam_type];
      } else {
        query = 'SELECT id, title, description, duration_minutes, total_marks, exam_type FROM tests WHERE is_active = true AND is_published = true ORDER BY created_at DESC';
      }
    }

    const result = await pool.query(query, params);
    res.json({ tests: result.rows });
  } catch (error) {
    console.error('Get tests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getTest = async (req: AuthRequest, res: Response) => {
  try {
    const testId = parseInt(req.params.id);
    const { role, id: userId } = req.user!;

    const testResult = await pool.query('SELECT * FROM tests WHERE id = $1', [testId]);
    if (testResult.rows.length === 0) {
      return res.status(404).json({ error: 'Test not found' });
    }

    const test = testResult.rows[0];

    if (role === 'teacher' && test.created_by !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const questionsResult = await pool.query(
      'SELECT * FROM questions WHERE test_id = $1 ORDER BY question_order, id',
      [testId]
    );

    const responseData: any = {
      test,
      questions: questionsResult.rows
    };

    if (role === 'student') {
      responseData.questions = questionsResult.rows.map((q: Question) => ({
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
  } catch (error) {
    console.error('Get test error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const addQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const testId = parseInt(req.params.id);
    const {
      question_text,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_answer,
      marks = 1
    }: CreateQuestionData = req.body;

    const testResult = await pool.query(
      'SELECT created_by FROM tests WHERE id = $1',
      [testId]
    );

    if (testResult.rows.length === 0) {
      return res.status(404).json({ error: 'Test not found' });
    }

    if (testResult.rows[0].created_by !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!question_text || !option_a || !option_b || !option_c || !option_d || !correct_answer) {
      return res.status(400).json({ error: 'All question fields are required' });
    }

    if (!['a', 'b', 'c', 'd'].includes(correct_answer)) {
      return res.status(400).json({ error: 'Correct answer must be a, b, c, or d' });
    }

    const questionCountResult = await pool.query(
      'SELECT COUNT(*) as count FROM questions WHERE test_id = $1',
      [testId]
    );
    const questionOrder = parseInt(questionCountResult.rows[0].count) + 1;

    const result = await pool.query(
      `INSERT INTO questions 
       (test_id, question_text, option_a, option_b, option_c, option_d, correct_answer, marks, question_order) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [testId, question_text, option_a, option_b, option_c, option_d, correct_answer, marks, questionOrder]
    );

    await pool.query(
      'UPDATE tests SET total_marks = total_marks + $1 WHERE id = $2',
      [marks, testId]
    );

    res.status(201).json({ question: result.rows[0] });
  } catch (error) {
    console.error('Add question error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteTest = async (req: AuthRequest, res: Response) => {
  try {
    const testId = parseInt(req.params.id);

    const testResult = await pool.query(
      'SELECT created_by FROM tests WHERE id = $1',
      [testId]
    );

    if (testResult.rows.length === 0) {
      return res.status(404).json({ error: 'Test not found' });
    }

    if (testResult.rows[0].created_by !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await pool.query('DELETE FROM tests WHERE id = $1', [testId]);
    res.json({ message: 'Test deleted successfully' });
  } catch (error) {
    console.error('Delete test error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const togglePublishTest = async (req: AuthRequest, res: Response) => {
  try {
    const testId = parseInt(req.params.id);

    const testResult = await pool.query(
      'SELECT created_by, is_published FROM tests WHERE id = $1',
      [testId]
    );

    if (testResult.rows.length === 0) {
      return res.status(404).json({ error: 'Test not found' });
    }

    if (testResult.rows[0].created_by !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const currentStatus = testResult.rows[0].is_published;
    const newStatus = !currentStatus;

    const result = await pool.query(
      'UPDATE tests SET is_published = $1 WHERE id = $2 RETURNING *',
      [newStatus, testId]
    );

    res.json({
      test: result.rows[0],
      message: newStatus ? 'Test published to students' : 'Test unpublished (now private)'
    });
  } catch (error) {
    console.error('Toggle publish test error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};