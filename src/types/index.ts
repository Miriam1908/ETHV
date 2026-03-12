export interface User {
  address: string;
  skills: Skill[];
}

export interface Skill {
  id: string;
  name: string;
  level: 'beginner' | 'intermediate' | 'expert';
  isValidated: boolean;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  matchScore: number;
  description: string;
}

export interface ValidationQuestion {
  id: string;
  question: string;
  options: string[];
}

export interface AuthResponse {
  token: string;
  user: User;
}
