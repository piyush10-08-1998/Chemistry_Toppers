import type { Question } from '../types';

const API_BASE_URL = 'http://localhost:5000/api';

class ApiClient {
  private baseURL: string;
  private token: string | null;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('token');
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'An error occurred');
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  public setToken(token: string | null): void {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  public async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  public async register(email: string, password: string, name: string, role: string) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, role }),
    });
  }

  public async getProfile() {
    return this.request('/auth/profile');
  }

  public async getTests() {
    return this.request('/tests');
  }

  public async getTest(id: number) {
    return this.request(`/tests/${id}`);
  }

  public async createTest(title: string, description: string, duration_minutes: number) {
    return this.request('/tests', {
      method: 'POST',
      body: JSON.stringify({ title, description, duration_minutes }),
    });
  }

  public async addQuestion(testId: number, questionData: Omit<Question, 'id' | 'test_id'>) {
    return this.request(`/tests/${testId}/questions`, {
      method: 'POST',
      body: JSON.stringify(questionData),
    });
  }

  public async startTest(testId: number) {
    return this.request(`/attempts/start/${testId}`, {
      method: 'POST',
    });
  }

  public async submitAnswer(attemptId: number, questionId: number, selectedAnswer: string) {
    return this.request('/attempts/answer', {
      method: 'POST',
      body: JSON.stringify({ attemptId, questionId, selectedAnswer }),
    });
  }

  public async submitTest(attemptId: number) {
    return this.request('/attempts/submit', {
      method: 'POST',
      body: JSON.stringify({ attemptId }),
    });
  }

  public async getTestResults(testId: number) {
    return this.request(`/attempts/results/${testId}`);
  }
}

export const apiClient = new ApiClient();