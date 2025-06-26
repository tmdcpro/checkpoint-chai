import { PRD, Deliverable, Task } from '../types';

export interface AtomicMVP {
  id: string;
  title: string;
  description: string;
  hypothesis: string;
  successMetrics: SuccessMetric[];
  validationTests: ValidationTest[];
  minimumViableFeatures: string[];
  estimatedHours: number;
  costEstimate: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  learningObjectives: string[];
  parentDeliverableId: string;
  sprintNumber: number;
  status: 'Planning' | 'Building' | 'Testing' | 'Validated' | 'Pivoted' | 'Failed';
  createdAt: string;
  completedAt?: string;
}

export interface SuccessMetric {
  id: string;
  name: string;
  type: 'quantitative' | 'qualitative';
  targetValue: string | number;
  currentValue?: string | number;
  measurementMethod: string;
  validationCriteria: string;
}

export interface ValidationTest {
  id: string;
  type: 'user_interview' | 'prototype_test' | 'landing_page' | 'survey' | 'analytics' | 'manual_test';
  description: string;
  hypothesis: string;
  successCriteria: string;
  estimatedTime: number;
  cost: number;
  status: 'Not Started' | 'In Progress' | 'Complete' | 'Failed';
  results?: ValidationResult;
}

export interface ValidationResult {
  outcome: 'validated' | 'invalidated' | 'inconclusive';
  evidence: string[];
  metrics: { [key: string]: any };
  insights: string[];
  nextActions: string[];
}

export interface SprintCycle {
  id: string;
  sprintNumber: number;
  atomicMVPs: AtomicMVP[];
  buildMeasureLearnCycles: BuildMeasureLearnCycle[];
  retrospective?: SprintRetrospective;
  status: 'Planning' | 'Executing' | 'Measuring' | 'Learning' | 'Complete';
  startDate: string;
  endDate?: string;
}

export interface BuildMeasureLearnCycle {
  id: string;
  atomicMVPId: string;
  build: {
    tasks: Task[];
    estimatedHours: number;
    actualHours?: number;
    status: 'Not Started' | 'In Progress' | 'Complete';
  };
  measure: {
    tests: ValidationTest[];
    dataCollection: string[];
    status: 'Not Started' | 'In Progress' | 'Complete';
  };
  learn: {
    insights: string[];
    decisions: string[];
    pivotRecommendations: string[];
    status: 'Not Started' | 'In Progress' | 'Complete';
  };
}

export interface SprintRetrospective {
  whatWorked: string[];
  whatDidntWork: string[];
  lessonsLearned: string[];
  improvementsForNextSprint: string[];
  pivotDecisions: PivotDecision[];
}

export interface PivotDecision {
  type: 'customer_segment' | 'problem' | 'solution' | 'revenue_model' | 'channel' | 'technology';
  description: string;
  reasoning: string;
  impact: 'Low' | 'Medium' | 'High';
  implementationPlan: string[];
}

export interface HITLPrompt {
  id: string;
  type: 'validation' | 'prioritization' | 'pivot_decision' | 'metric_definition' | 'hypothesis_refinement';
  question: string;
  context: string;
  options?: string[];
  userResponse?: any;
  aiSuggestion?: string;
  timestamp: string;
}

/**
 * Lean Startup Atomic MVP Sprint Service
 * Implements extreme lean startup methodology with human-in-the-loop guidance
 */
export class LeanStartupSprintService {
  private sprints: Map<string, SprintCycle> = new Map();
  private atomicMVPs: Map<string, AtomicMVP> = new Map();
  private hitlPrompts: HITLPrompt[] = [];

  /**
   * Analyze deliverable and extract atomic MVPs using HITL guidance
   */
  async extractAtomicMVPs(
    deliverable: Deliverable,
    prd: PRD,
    hitlResponses?: { [promptId: string]: any }
  ): Promise<{
    atomicMVPs: AtomicMVP[];
    hitlPrompts: HITLPrompt[];
    recommendations: string[];
  }> {
    const prompts: HITLPrompt[] = [];
    const atomicMVPs: AtomicMVP[] = [];

    // HITL: Validate core assumptions
    prompts.push({
      id: `assumption-validation-${Date.now()}`,
      type: 'validation',
      question: `What is the riskiest assumption about "${deliverable.title}" that we should test first?`,
      context: `Deliverable: ${deliverable.description}\nProject Context: ${prd.description}`,
      options: [
        'Users actually need this feature',
        'Users will use this feature as intended',
        'This feature solves the right problem',
        'Users will pay for this feature',
        'We can build this feature effectively'
      ],
      timestamp: new Date().toISOString()
    });

    // HITL: Define success metrics
    prompts.push({
      id: `metrics-definition-${Date.now()}`,
      type: 'metric_definition',
      question: `How should we measure success for "${deliverable.title}"?`,
      context: `We need quantifiable metrics that can be measured quickly and cheaply.`,
      timestamp: new Date().toISOString()
    });

    // Generate atomic MVPs based on task breakdown
    const taskGroups = this.groupTasksByAtomicValue(deliverable.tasks);
    
    taskGroups.forEach((taskGroup, index) => {
      const atomicMVP: AtomicMVP = {
        id: `atomic-mvp-${deliverable.id}-${index + 1}`,
        title: `Atomic MVP ${index + 1}: ${taskGroup.coreValue}`,
        description: this.generateAtomicMVPDescription(taskGroup),
        hypothesis: this.generateHypothesis(taskGroup, deliverable),
        successMetrics: this.generateSuccessMetrics(taskGroup),
        validationTests: this.generateValidationTests(taskGroup),
        minimumViableFeatures: taskGroup.essentialFeatures,
        estimatedHours: Math.min(8, taskGroup.tasks.reduce((sum, t) => sum + t.estimatedHours, 0)),
        costEstimate: this.estimateCost(taskGroup.tasks),
        riskLevel: this.assessRiskLevel(taskGroup),
        learningObjectives: this.generateLearningObjectives(taskGroup),
        parentDeliverableId: deliverable.id,
        sprintNumber: 1,
        status: 'Planning',
        createdAt: new Date().toISOString()
      };

      atomicMVPs.push(atomicMVP);
    });

    // HITL: Prioritize atomic MVPs
    if (atomicMVPs.length > 1) {
      prompts.push({
        id: `prioritization-${Date.now()}`,
        type: 'prioritization',
        question: `Which Atomic MVP should we build and test first?`,
        context: `We have ${atomicMVPs.length} potential atomic MVPs. Consider: risk, learning potential, cost, and time to validate.`,
        options: atomicMVPs.map((mvp, i) => `${i + 1}. ${mvp.title} (${mvp.estimatedHours}h, ${mvp.riskLevel} risk)`),
        timestamp: new Date().toISOString()
      });
    }

    const recommendations = this.generateRecommendations(atomicMVPs, deliverable);

    return { atomicMVPs, hitlPrompts: prompts, recommendations };
  }

  /**
   * Create a new sprint cycle with Build-Measure-Learn loops
   */
  async createSprintCycle(
    atomicMVPs: AtomicMVP[],
    sprintNumber: number = 1
  ): Promise<SprintCycle> {
    const sprintId = `sprint-${Date.now()}`;
    
    const buildMeasureLearnCycles = atomicMVPs.map(mvp => 
      this.createBuildMeasureLearnCycle(mvp)
    );

    const sprint: SprintCycle = {
      id: sprintId,
      sprintNumber,
      atomicMVPs,
      buildMeasureLearnCycles,
      status: 'Planning',
      startDate: new Date().toISOString()
    };

    this.sprints.set(sprintId, sprint);
    atomicMVPs.forEach(mvp => this.atomicMVPs.set(mvp.id, mvp));

    return sprint;
  }

  /**
   * Execute Build phase of BML cycle
   */
  async executeBuildPhase(
    cycleId: string,
    hitlGuidance?: { [key: string]: any }
  ): Promise<{
    tasks: Task[];
    buildPlan: string[];
    hitlPrompts: HITLPrompt[];
  }> {
    const cycle = this.findBMLCycle(cycleId);
    if (!cycle) throw new Error('Cycle not found');

    const atomicMVP = this.atomicMVPs.get(cycle.atomicMVPId);
    if (!atomicMVP) throw new Error('Atomic MVP not found');

    // Generate minimal build tasks
    const buildTasks = this.generateMinimalBuildTasks(atomicMVP);
    
    // HITL: Validate build approach
    const hitlPrompts: HITLPrompt[] = [{
      id: `build-validation-${Date.now()}`,
      type: 'validation',
      question: `Is this the absolute minimum we can build to test our hypothesis: "${atomicMVP.hypothesis}"?`,
      context: `Proposed build: ${buildTasks.map(t => t.title).join(', ')}`,
      timestamp: new Date().toISOString()
    }];

    const buildPlan = this.generateBuildPlan(buildTasks, atomicMVP);

    cycle.build.tasks = buildTasks;
    cycle.build.status = 'In Progress';

    return { tasks: buildTasks, buildPlan, hitlPrompts };
  }

  /**
   * Execute Measure phase of BML cycle
   */
  async executeMeasurePhase(
    cycleId: string,
    buildResults: any
  ): Promise<{
    measurements: { [key: string]: any };
    validationResults: ValidationResult[];
    hitlPrompts: HITLPrompt[];
  }> {
    const cycle = this.findBMLCycle(cycleId);
    if (!cycle) throw new Error('Cycle not found');

    const atomicMVP = this.atomicMVPs.get(cycle.atomicMVPId);
    if (!atomicMVP) throw new Error('Atomic MVP not found');

    // Execute validation tests
    const validationResults: ValidationResult[] = [];
    const measurements: { [key: string]: any } = {};

    for (const test of atomicMVP.validationTests) {
      const result = await this.executeValidationTest(test, buildResults);
      validationResults.push(result);
      
      // Collect measurements
      Object.assign(measurements, result.metrics);
    }

    // HITL: Interpret results
    const hitlPrompts: HITLPrompt[] = [{
      id: `results-interpretation-${Date.now()}`,
      type: 'validation',
      question: `Based on these results, was our hypothesis validated?`,
      context: `Hypothesis: ${atomicMVP.hypothesis}\nResults: ${JSON.stringify(measurements, null, 2)}`,
      options: ['Validated - continue building', 'Partially validated - iterate', 'Invalidated - pivot', 'Inconclusive - need more data'],
      timestamp: new Date().toISOString()
    }];

    cycle.measure.status = 'Complete';

    return { measurements, validationResults, hitlPrompts };
  }

  /**
   * Execute Learn phase of BML cycle
   */
  async executeLearnPhase(
    cycleId: string,
    measurementResults: any,
    hitlDecisions?: { [key: string]: any }
  ): Promise<{
    insights: string[];
    decisions: string[];
    pivotRecommendations: PivotDecision[];
    nextAtomicMVPs: AtomicMVP[];
    hitlPrompts: HITLPrompt[];
  }> {
    const cycle = this.findBMLCycle(cycleId);
    if (!cycle) throw new Error('Cycle not found');

    const atomicMVP = this.atomicMVPs.get(cycle.atomicMVPId);
    if (!atomicMVP) throw new Error('Atomic MVP not found');

    // Generate insights from data
    const insights = this.generateInsights(measurementResults, atomicMVP);
    
    // Generate decision recommendations
    const decisions = this.generateDecisions(insights, measurementResults);
    
    // Identify potential pivots
    const pivotRecommendations = this.identifyPivotOpportunities(insights, atomicMVP);

    // HITL: Strategic decisions
    const hitlPrompts: HITLPrompt[] = [{
      id: `strategic-decision-${Date.now()}`,
      type: 'pivot_decision',
      question: `What should our next move be?`,
      context: `Insights: ${insights.join(', ')}\nCurrent MVP status: ${atomicMVP.status}`,
      options: [
        'Continue with current approach',
        'Iterate on current MVP',
        'Pivot to new approach',
        'Scale up successful features',
        'Abandon this direction'
      ],
      timestamp: new Date().toISOString()
    }];

    // Generate next atomic MVPs based on learnings
    const nextAtomicMVPs = this.generateNextAtomicMVPs(insights, decisions, atomicMVP);

    cycle.learn.insights = insights;
    cycle.learn.decisions = decisions;
    cycle.learn.pivotRecommendations = pivotRecommendations;
    cycle.learn.status = 'Complete';

    return { insights, decisions, pivotRecommendations, nextAtomicMVPs, hitlPrompts };
  }

  /**
   * Conduct sprint retrospective with HITL guidance
   */
  async conductSprintRetrospective(
    sprintId: string,
    hitlInput?: { [key: string]: any }
  ): Promise<{
    retrospective: SprintRetrospective;
    improvementActions: string[];
    nextSprintPlan: any;
    hitlPrompts: HITLPrompt[];
  }> {
    const sprint = this.sprints.get(sprintId);
    if (!sprint) throw new Error('Sprint not found');

    // Analyze sprint performance
    const sprintMetrics = this.analyzeSprintMetrics(sprint);
    
    // HITL: Retrospective questions
    const hitlPrompts: HITLPrompt[] = [
      {
        id: `retro-what-worked-${Date.now()}`,
        type: 'validation',
        question: `What worked well in this sprint?`,
        context: `Sprint completed ${sprint.buildMeasureLearnCycles.length} BML cycles with ${sprintMetrics.validatedHypotheses} validated hypotheses.`,
        timestamp: new Date().toISOString()
      },
      {
        id: `retro-improvements-${Date.now()}`,
        type: 'validation',
        question: `What should we improve for the next sprint?`,
        context: `Areas to consider: hypothesis quality, validation speed, build efficiency, measurement accuracy.`,
        timestamp: new Date().toISOString()
      }
    ];

    const retrospective: SprintRetrospective = {
      whatWorked: this.identifySuccesses(sprint),
      whatDidntWork: this.identifyFailures(sprint),
      lessonsLearned: this.extractLessons(sprint),
      improvementsForNextSprint: this.generateImprovements(sprint),
      pivotDecisions: this.consolidatePivotDecisions(sprint)
    };

    const improvementActions = this.generateImprovementActions(retrospective);
    const nextSprintPlan = this.planNextSprint(sprint, retrospective);

    sprint.retrospective = retrospective;
    sprint.status = 'Complete';
    sprint.endDate = new Date().toISOString();

    return { retrospective, improvementActions, nextSprintPlan, hitlPrompts };
  }

  // Helper methods for atomic MVP extraction and management
  private groupTasksByAtomicValue(tasks: Task[]): Array<{
    coreValue: string;
    tasks: Task[];
    essentialFeatures: string[];
    riskLevel: 'Low' | 'Medium' | 'High';
  }> {
    // Group tasks by their core value proposition
    const groups: { [key: string]: Task[] } = {};
    
    tasks.forEach(task => {
      const coreValue = this.extractCoreValue(task);
      if (!groups[coreValue]) {
        groups[coreValue] = [];
      }
      groups[coreValue].push(task);
    });

    return Object.entries(groups).map(([coreValue, groupTasks]) => ({
      coreValue,
      tasks: groupTasks,
      essentialFeatures: this.extractEssentialFeatures(groupTasks),
      riskLevel: this.assessTaskGroupRisk(groupTasks)
    }));
  }

  private extractCoreValue(task: Task): string {
    // Extract the core value proposition from task description
    const keywords = task.description.toLowerCase();
    if (keywords.includes('user') || keywords.includes('interface')) return 'User Experience';
    if (keywords.includes('data') || keywords.includes('analytics')) return 'Data & Analytics';
    if (keywords.includes('performance') || keywords.includes('speed')) return 'Performance';
    if (keywords.includes('security') || keywords.includes('auth')) return 'Security';
    if (keywords.includes('integration') || keywords.includes('api')) return 'Integration';
    return 'Core Functionality';
  }

  private extractEssentialFeatures(tasks: Task[]): string[] {
    return tasks.map(task => {
      // Extract the most essential feature from each task
      const instructions = task.instructions.join(' ').toLowerCase();
      if (instructions.includes('minimum') || instructions.includes('basic')) {
        return `Basic ${task.title}`;
      }
      return `Essential ${task.title.split(' ').slice(0, 3).join(' ')}`;
    });
  }

  private assessTaskGroupRisk(tasks: Task[]): 'Low' | 'Medium' | 'High' {
    const totalHours = tasks.reduce((sum, t) => sum + t.estimatedHours, 0);
    const complexityScore = tasks.reduce((sum, t) => {
      return sum + (t.dependencies.length * 2) + (t.subtasks.length);
    }, 0);

    if (totalHours > 20 || complexityScore > 15) return 'High';
    if (totalHours > 10 || complexityScore > 8) return 'Medium';
    return 'Low';
  }

  private generateAtomicMVPDescription(taskGroup: any): string {
    return `Minimal viable implementation focusing on ${taskGroup.coreValue}. ` +
           `Includes only essential features: ${taskGroup.essentialFeatures.slice(0, 2).join(', ')}. ` +
           `Designed for rapid validation with minimal investment.`;
  }

  private generateHypothesis(taskGroup: any, deliverable: Deliverable): string {
    return `Users will find value in ${taskGroup.coreValue.toLowerCase()} functionality ` +
           `and will demonstrate engagement through measurable actions within the first week of use.`;
  }

  private generateSuccessMetrics(taskGroup: any): SuccessMetric[] {
    return [
      {
        id: `metric-engagement-${Date.now()}`,
        name: 'User Engagement',
        type: 'quantitative',
        targetValue: '70%',
        measurementMethod: 'User analytics tracking',
        validationCriteria: 'At least 70% of users interact with core feature within first session'
      },
      {
        id: `metric-satisfaction-${Date.now()}`,
        name: 'User Satisfaction',
        type: 'qualitative',
        targetValue: '4/5',
        measurementMethod: 'Post-interaction survey',
        validationCriteria: 'Average satisfaction score of 4 or higher on 5-point scale'
      }
    ];
  }

  private generateValidationTests(taskGroup: any): ValidationTest[] {
    return [
      {
        id: `test-prototype-${Date.now()}`,
        type: 'prototype_test',
        description: 'Test core functionality with minimal prototype',
        hypothesis: 'Users can complete primary task with minimal guidance',
        successCriteria: '80% task completion rate',
        estimatedTime: 2,
        cost: 50,
        status: 'Not Started'
      },
      {
        id: `test-interview-${Date.now()}`,
        type: 'user_interview',
        description: 'Conduct user interviews to validate problem-solution fit',
        hypothesis: 'Users confirm this solves a real problem they face',
        successCriteria: '7/10 users confirm problem relevance',
        estimatedTime: 4,
        cost: 100,
        status: 'Not Started'
      }
    ];
  }

  private generateLearningObjectives(taskGroup: any): string[] {
    return [
      `Validate that ${taskGroup.coreValue} addresses user needs`,
      'Understand user interaction patterns and preferences',
      'Identify minimum feature set for user satisfaction',
      'Measure user willingness to engage with solution'
    ];
  }

  private estimateCost(tasks: Task[]): number {
    // Simple cost estimation based on hours and complexity
    const totalHours = tasks.reduce((sum, t) => sum + t.estimatedHours, 0);
    const hourlyRate = 50; // Base rate
    return totalHours * hourlyRate;
  }

  private assessRiskLevel(taskGroup: any): 'Low' | 'Medium' | 'High' {
    return taskGroup.riskLevel;
  }

  private generateRecommendations(atomicMVPs: AtomicMVP[], deliverable: Deliverable): string[] {
    const recommendations = [
      `Start with the lowest-risk, highest-learning atomic MVP`,
      `Limit initial build to maximum 8 hours of development`,
      `Focus on one core hypothesis per atomic MVP`,
      `Plan validation tests before building anything`
    ];

    if (atomicMVPs.length > 3) {
      recommendations.push(`Consider reducing scope - ${atomicMVPs.length} atomic MVPs may be too many for effective learning`);
    }

    return recommendations;
  }

  private createBuildMeasureLearnCycle(atomicMVP: AtomicMVP): BuildMeasureLearnCycle {
    return {
      id: `bml-${atomicMVP.id}`,
      atomicMVPId: atomicMVP.id,
      build: {
        tasks: [],
        estimatedHours: atomicMVP.estimatedHours,
        status: 'Not Started'
      },
      measure: {
        tests: atomicMVP.validationTests,
        dataCollection: atomicMVP.successMetrics.map(m => m.measurementMethod),
        status: 'Not Started'
      },
      learn: {
        insights: [],
        decisions: [],
        pivotRecommendations: [],
        status: 'Not Started'
      }
    };
  }

  private findBMLCycle(cycleId: string): BuildMeasureLearnCycle | null {
    for (const sprint of this.sprints.values()) {
      const cycle = sprint.buildMeasureLearnCycles.find(c => c.id === cycleId);
      if (cycle) return cycle;
    }
    return null;
  }

  private generateMinimalBuildTasks(atomicMVP: AtomicMVP): Task[] {
    return atomicMVP.minimumViableFeatures.map((feature, index) => ({
      id: `build-task-${atomicMVP.id}-${index}`,
      title: `Build ${feature}`,
      description: `Implement minimal version of ${feature} for validation`,
      instructions: [
        'Focus on core functionality only',
        'Skip non-essential features',
        'Prioritize speed over perfection',
        'Ensure measurability'
      ],
      estimatedHours: Math.ceil(atomicMVP.estimatedHours / atomicMVP.minimumViableFeatures.length),
      priority: 'High',
      status: 'Not Started',
      dependencies: [],
      subtasks: [],
      testingCriteria: {
        unitTests: [],
        integrationTests: [],
        userAcceptanceTests: [`${feature} works as intended for validation`],
        performanceTests: [],
        securityTests: [],
        accessibilityTests: [],
        manualTests: [`Manual test of ${feature} functionality`]
      },
      tools: [
        { name: 'Rapid Prototyping Tool', purpose: 'Quick implementation', implementation: 'Build MVP feature', required: true }
      ]
    }));
  }

  private generateBuildPlan(tasks: Task[], atomicMVP: AtomicMVP): string[] {
    return [
      `Build Plan for: ${atomicMVP.title}`,
      `Hypothesis to test: ${atomicMVP.hypothesis}`,
      `Time budget: ${atomicMVP.estimatedHours} hours maximum`,
      `Success criteria: ${atomicMVP.successMetrics.map(m => m.validationCriteria).join(', ')}`,
      ...tasks.map((task, i) => `${i + 1}. ${task.title} (${task.estimatedHours}h)`),
      `Validation tests ready: ${atomicMVP.validationTests.length} tests planned`
    ];
  }

  private async executeValidationTest(test: ValidationTest, buildResults: any): Promise<ValidationResult> {
    // Simulate validation test execution
    // In real implementation, this would integrate with actual testing tools
    
    const mockResults: ValidationResult = {
      outcome: Math.random() > 0.3 ? 'validated' : 'invalidated',
      evidence: [
        `Test "${test.description}" completed`,
        `Hypothesis: ${test.hypothesis}`,
        `Success criteria: ${test.successCriteria}`
      ],
      metrics: {
        [`${test.type}_score`]: Math.random() * 100,
        completion_rate: Math.random() * 100,
        user_satisfaction: Math.random() * 5
      },
      insights: [
        `Users responded ${Math.random() > 0.5 ? 'positively' : 'negatively'} to core feature`,
        `${Math.floor(Math.random() * 50 + 50)}% completion rate observed`
      ],
      nextActions: [
        test.outcome === 'validated' ? 'Continue development' : 'Consider pivot',
        'Gather more user feedback',
        'Refine success metrics'
      ]
    };

    return mockResults;
  }

  private generateInsights(measurementResults: any, atomicMVP: AtomicMVP): string[] {
    return [
      `Hypothesis "${atomicMVP.hypothesis}" was ${measurementResults.outcome || 'partially'} validated`,
      `User engagement was ${measurementResults.metrics?.user_satisfaction > 3 ? 'positive' : 'mixed'}`,
      `Core features showed ${measurementResults.metrics?.completion_rate > 70 ? 'strong' : 'weak'} adoption`,
      `Learning objectives were ${atomicMVP.learningObjectives.length > 2 ? 'mostly' : 'partially'} achieved`
    ];
  }

  private generateDecisions(insights: string[], measurementResults: any): string[] {
    const decisions = [];
    
    if (insights.some(i => i.includes('validated'))) {
      decisions.push('Continue building on validated assumptions');
    }
    
    if (insights.some(i => i.includes('positive'))) {
      decisions.push('Expand successful features');
    } else {
      decisions.push('Investigate user experience issues');
    }
    
    decisions.push('Plan next atomic MVP based on learnings');
    
    return decisions;
  }

  private identifyPivotOpportunities(insights: string[], atomicMVP: AtomicMVP): PivotDecision[] {
    const pivots: PivotDecision[] = [];
    
    if (insights.some(i => i.includes('weak') || i.includes('negative'))) {
      pivots.push({
        type: 'solution',
        description: 'Pivot solution approach based on user feedback',
        reasoning: 'Current solution not meeting user expectations',
        impact: 'Medium',
        implementationPlan: [
          'Conduct additional user research',
          'Redesign core features',
          'Test alternative approaches'
        ]
      });
    }
    
    return pivots;
  }

  private generateNextAtomicMVPs(insights: string[], decisions: string[], currentMVP: AtomicMVP): AtomicMVP[] {
    // Generate next iteration based on learnings
    const nextMVP: AtomicMVP = {
      ...currentMVP,
      id: `atomic-mvp-${currentMVP.parentDeliverableId}-${currentMVP.sprintNumber + 1}`,
      title: `${currentMVP.title} - Iteration ${currentMVP.sprintNumber + 1}`,
      sprintNumber: currentMVP.sprintNumber + 1,
      status: 'Planning',
      createdAt: new Date().toISOString(),
      hypothesis: this.refineHypothesis(currentMVP.hypothesis, insights),
      learningObjectives: this.updateLearningObjectives(currentMVP.learningObjectives, insights)
    };
    
    return [nextMVP];
  }

  private refineHypothesis(originalHypothesis: string, insights: string[]): string {
    // Refine hypothesis based on learnings
    return `${originalHypothesis} (Refined based on: ${insights.slice(0, 2).join(', ')})`;
  }

  private updateLearningObjectives(original: string[], insights: string[]): string[] {
    return [
      ...original.slice(0, 2), // Keep some original objectives
      'Validate refined hypothesis with improved metrics',
      'Test solutions to identified user experience issues'
    ];
  }

  private analyzeSprintMetrics(sprint: SprintCycle): any {
    const completedCycles = sprint.buildMeasureLearnCycles.filter(c => 
      c.learn.status === 'Complete'
    ).length;
    
    const validatedHypotheses = sprint.buildMeasureLearnCycles.filter(c =>
      c.learn.insights.some(i => i.includes('validated'))
    ).length;
    
    return {
      completedCycles,
      validatedHypotheses,
      totalCycles: sprint.buildMeasureLearnCycles.length,
      successRate: validatedHypotheses / Math.max(1, completedCycles)
    };
  }

  private identifySuccesses(sprint: SprintCycle): string[] {
    return [
      `Completed ${sprint.buildMeasureLearnCycles.length} Build-Measure-Learn cycles`,
      'Maintained focus on rapid validation',
      'Generated actionable insights from user feedback'
    ];
  }

  private identifyFailures(sprint: SprintCycle): string[] {
    return [
      'Some hypotheses took longer to validate than planned',
      'Could have been more aggressive in cutting scope',
      'Need better metrics for faster learning'
    ];
  }

  private extractLessons(sprint: SprintCycle): string[] {
    return [
      'Smaller atomic MVPs lead to faster learning cycles',
      'User feedback is more valuable than internal assumptions',
      'Validation tests should be designed before building'
    ];
  }

  private generateImprovements(sprint: SprintCycle): string[] {
    return [
      'Reduce atomic MVP scope even further',
      'Improve validation test design',
      'Faster iteration cycles',
      'Better user feedback collection methods'
    ];
  }

  private consolidatePivotDecisions(sprint: SprintCycle): PivotDecision[] {
    const allPivots: PivotDecision[] = [];
    sprint.buildMeasureLearnCycles.forEach(cycle => {
      allPivots.push(...cycle.learn.pivotRecommendations);
    });
    return allPivots;
  }

  private generateImprovementActions(retrospective: SprintRetrospective): string[] {
    return [
      'Implement lessons learned in next sprint planning',
      'Refine validation test templates',
      'Improve user feedback collection process',
      'Optimize build-measure-learn cycle timing'
    ];
  }

  private planNextSprint(sprint: SprintCycle, retrospective: SprintRetrospective): any {
    return {
      sprintNumber: sprint.sprintNumber + 1,
      focus: 'Apply learnings from previous sprint',
      improvements: retrospective.improvementsForNextSprint,
      plannedCycles: Math.min(3, sprint.buildMeasureLearnCycles.length), // Limit cycles for focus
      duration: '1-2 weeks maximum'
    };
  }
}

// Export singleton instance
export const leanStartupSprintService = new LeanStartupSprintService();