import axios from 'axios';
import type { Question } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

class ApiClient {
  private baseURL: string;
  private token: string | null;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('token');
  }

  private getHeaders() {
    const headers: any = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  public setToken(token: string | null): void {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  public getStoredToken(): string | null {
    return this.token;
  }

  public async login(email: string, password: string) {
    const response = await axios.post(`${this.baseURL}/auth/login`, { email, password });
    return response.data;
  }

  public async register(email: string, password: string, name: string, role: string) {
    const response = await axios.post(`${this.baseURL}/auth/register`, { email, password, name, role });
    return response.data;
  }

  public async getProfile() {
    const response = await axios.get(`${this.baseURL}/auth/profile`, { headers: this.getHeaders() });
    return response.data;
  }

  public async getTests(exam_type?: 'NEET' | 'JEE') {
    const params = exam_type ? { exam_type } : {};
    const response = await axios.get(`${this.baseURL}/tests`, {
      headers: this.getHeaders(),
      params
    });
    return response.data;
  }

  public async getTest(id: number) {
    const response = await axios.get(`${this.baseURL}/tests/${id}`, { headers: this.getHeaders() });
    return response.data;
  }

  public async createTest(title: string, description: string, duration_minutes: number, exam_type: 'NEET' | 'JEE') {
    const response = await axios.post(`${this.baseURL}/tests`,
      { title, description, duration_minutes, exam_type },
      { headers: this.getHeaders() }
    );
    return response.data;
  }

  public async deleteTest(testId: number) {
    const response = await axios.delete(`${this.baseURL}/tests/${testId}`,
      { headers: this.getHeaders() }
    );
    return response.data;
  }

  public async togglePublishTest(testId: number) {
    const response = await axios.patch(`${this.baseURL}/tests/${testId}/publish`,
      {},
      { headers: this.getHeaders() }
    );
    return response.data;
  }

  public async addQuestion(testId: number, questionData: Omit<Question, 'id' | 'test_id'>) {
    const response = await axios.post(`${this.baseURL}/tests/${testId}/questions`,
      questionData,
      { headers: this.getHeaders() }
    );
    return response.data;
  }

  public async startTest(testId: number) {
    const response = await axios.post(`${this.baseURL}/attempts/start/${testId}`,
      {},
      { headers: this.getHeaders() }
    );
    return response.data;
  }

  public async submitAnswer(attemptId: number, questionId: number, selectedAnswer: string) {
    const response = await axios.post(`${this.baseURL}/attempts/answer`,
      { attemptId, questionId, selectedAnswer },
      { headers: this.getHeaders() }
    );
    return response.data;
  }

  public async submitTest(attemptId: number) {
    const response = await axios.post(`${this.baseURL}/attempts/submit`,
      { attemptId },
      { headers: this.getHeaders() }
    );
    return response.data;
  }

  public async getAttemptAnswers(attemptId: number) {
    const response = await axios.get(`${this.baseURL}/attempts/${attemptId}/answers`,
      { headers: this.getHeaders() }
    );
    return response.data;
  }

  public async getTestResults(testId: number) {
    const response = await axios.get(`${this.baseURL}/attempts/results/${testId}`,
      { headers: this.getHeaders() }
    );
    return response.data;
  }

  // Analytics endpoints (for teachers)
  public async getStudents() {
    const response = await axios.get(`${this.baseURL}/analytics/students`,
      { headers: this.getHeaders() }
    );
    return response.data;
  }

  public async getTestResultsForTeacher(testId: number) {
    const response = await axios.get(`${this.baseURL}/analytics/test-results/${testId}`,
      { headers: this.getHeaders() }
    );
    return response.data;
  }

  public async getStudentDetails(studentId: number) {
    const response = await axios.get(`${this.baseURL}/analytics/student/${studentId}`,
      { headers: this.getHeaders() }
    );
    return response.data;
  }

  public async getAttemptDetails(attemptId: number) {
    const response = await axios.get(`${this.baseURL}/analytics/attempt/${attemptId}`,
      { headers: this.getHeaders() }
    );
    return response.data;
  }

  // Question extraction endpoints
  public async extractQuestions(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(`${this.baseURL}/questions/extract`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return response.data;
  }

  public async bulkAddQuestions(testId: number, questions: any[]) {
    const response = await axios.post(`${this.baseURL}/tests/${testId}/questions/bulk`,
      { questions },
      { headers: this.getHeaders() }
    );
    return response.data;
  }

  public async deleteQuestion(questionId: number) {
    const response = await axios.delete(`${this.baseURL}/questions/${questionId}`,
      { headers: this.getHeaders() }
    );
    return response.data;
  }

  // Upload question image
  public async uploadQuestionImage(file: File) {
    const formData = new FormData();
    formData.append('image', file);

    const response = await axios.post(`${this.baseURL}/questions/upload-image`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return response.data;
  }
}

export const apiClient = new ApiClient();