export interface User {
  id: number;
  email: string;
  password: string;
  name: string;
  role: 'teacher' | 'student';
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserData {
  email: string;
  password: string;
  name: string;
  role: 'teacher' | 'student';
}

export interface LoginData {
  email: string;
  password: string;
}