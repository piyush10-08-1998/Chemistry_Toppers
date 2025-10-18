export interface User {
  id: number;
  email: string;
  name: string;
  role: 'teacher' | 'student';
}

export interface Test {
  id: number;
  title: string;
  description: string;
  duration_minutes: number;
  total_marks: number;
  is_active: boolean;
  exam_type: 'NEET' | 'JEE';
  created_at: string;
}

export interface Question {
  id: number;
  test_id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer?: 'a' | 'b' | 'c' | 'd';
  marks: number;
  image_url?: string;
  option_a_image?: string;
  option_b_image?: string;
  option_c_image?: string;
  option_d_image?: string;
}

export interface TestAttempt {
  id: number;
  test_id: number;
  student_id: number;
  start_time: string;
  end_time?: string;
  is_submitted: boolean;
  score: number;
  total_marks: number;
  time_taken_minutes?: number;
}