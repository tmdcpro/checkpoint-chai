export interface PRD {
  id: string;
  title: string;
  description: string;
  objectives: string[];
  scope: string;
  deliverables: Deliverable[];
  timeline: string;
  stakeholders: string[];
  successCriteria: string[];
  risks: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Deliverable {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  estimatedHours: number;
  dependencies: string[];
  tasks: Task[];
  successCriteria: SuccessCriteria;
  status: 'Not Started' | 'In Progress' | 'Review' | 'Complete' | 'Blocked';
}

export interface Task {
  id: string;
  title: string;
  description: string;
  instructions: string[];
  estimatedHours: number;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  assignee?: string;
  status: 'Not Started' | 'In Progress' | 'Review' | 'Complete' | 'Blocked';
  dependencies: string[];
  subtasks: Subtask[];
  testingCriteria: TestingCriteria;
  tools: Tool[];
  dueDate?: string;
  completedAt?: string;
}

export interface Subtask {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  estimatedMinutes: number;
  actualMinutes?: number;
}

export interface SuccessCriteria {
  measurableMetrics: MeasurableMetric[];
  qualitativeFactors: QualitativeFactor[];
  testingRequirements: string[];
  acceptanceCriteria: string[];
}

export interface MeasurableMetric {
  id: string;
  name: string;
  description: string;
  type: 'numerical' | 'percentage' | 'boolean' | 'count' | 'time' | 'custom';
  targetValue: string | number;
  currentValue?: string | number;
  unit?: string;
  formula?: string;
  automated: boolean;
  testingMethod: string;
}

export interface QualitativeFactor {
  id: string;
  name: string;
  description: string;
  importance: 'Low' | 'Medium' | 'High' | 'Critical';
  evaluationMethod: string;
  criteria: string[];
  score?: number;
  maxScore: number;
}

export interface TestingCriteria {
  unitTests: string[];
  integrationTests: string[];
  userAcceptanceTests: string[];
  performanceTests: string[];
  securityTests: string[];
  accessibilityTests: string[];
  manualTests: string[];
}

export interface Tool {
  name: string;
  purpose: string;
  implementation: string;
  documentation?: string;
  required: boolean;
}

export interface ProjectAnalysis {
  complexity: 'Low' | 'Medium' | 'High' | 'Very High';
  estimatedDuration: string;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  resourceRequirements: string[];
  technicalChallenges: string[];
  recommendations: string[];
}