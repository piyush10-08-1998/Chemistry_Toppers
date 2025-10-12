export interface Test {
  id: number;
  title: string;
  description: string;
  duration_minutes: number;
  total_marks: number;
  is_active: boolean;
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateTestData {
  title: string;
  description: string;
  duration_minutes: number;
}

export interface Question {
  id: number;
  test_id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'a' | 'b' | 'c' | 'd';
  marks: number;
  question_order: number;
  created_at: Date;
}

export interface CreateQuestionData {
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'a' | 'b' | 'c' | 'd';
  marks: number;
}

export interface TestAttempt {
  id: number;
  test_id: number;
  student_id: number;
  start_time: Date;
  end_time?: Date;
  is_submitted: boolean;
  score: number;
  total_marks: number;
  time_taken_minutes?: number;
  created_at: Date;
}

export interface StudentAnswer {
  id: number;
  attempt_id: number;
  question_id: number;
  selected_answer?: 'a' | 'b' | 'c' | 'd';
  is_correct: boolean;
  answered_at: Date;
}