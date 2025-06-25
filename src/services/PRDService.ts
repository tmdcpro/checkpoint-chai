import { PRD, Deliverable, Task, ProjectAnalysis } from '../types';

export interface PRDAnalysisConfig {
  maxDeliverablesPerObjective?: number;
  defaultTasksPerDeliverable?: number;
  includeDetailedSubtasks?: boolean;
  generateTestingCriteria?: boolean;
}

export interface TaskGenerationResult {
  analysis: ProjectAnalysis;
  deliverables: Deliverable[];
  metadata: {
    totalTasks: number;
    estimatedTotalHours: number;
    generatedAt: string;
    version: string;
  };
}

/**
 * Core PRD processing service - designed to be modular and API-ready
 * Can be used independently of the UI components
 */
export class PRDService {
  private config: Required<PRDAnalysisConfig>;

  constructor(config: PRDAnalysisConfig = {}) {
    this.config = {
      maxDeliverablesPerObjective: config.maxDeliverablesPerObjective ?? 2,
      defaultTasksPerDeliverable: config.defaultTasksPerDeliverable ?? 3,
      includeDetailedSubtasks: config.includeDetailedSubtasks ?? true,
      generateTestingCriteria: config.generateTestingCriteria ?? true,
      ...config
    };
  }

  /**
   * Main entry point for PRD analysis and task generation
   */
  async generateTasksFromPRD(prd: PRD): Promise<TaskGenerationResult> {
    console.log('PRDService: Starting task generation for PRD:', prd.title);
    
    const analysis = this.analyzePRD(prd);
    const deliverables = this.generateDeliverables(prd, analysis);
    
    const totalTasks = deliverables.reduce((sum, d) => sum + d.tasks.length, 0);
    const estimatedTotalHours = deliverables.reduce((sum, d) => sum + d.estimatedHours, 0);

    const result: TaskGenerationResult = {
      analysis,
      deliverables,
      metadata: {
        totalTasks,
        estimatedTotalHours,
        generatedAt: new Date().toISOString(),
        version: '1.0.0'
      }
    };

    console.log('PRDService: Generated result:', result);
    return result;
  }

  /**
   * Analyze PRD complexity and requirements
   */
  private analyzePRD(prd: PRD): ProjectAnalysis {
    const complexity = this.determineComplexity(prd);
    const estimatedDuration = this.estimateProjectDuration(prd);
    const riskLevel = this.assessRiskLevel(prd);
    const resourceRequirements = this.generateResourceRequirements(prd);
    const technicalChallenges = this.identifyTechnicalChallenges(prd);
    const recommendations = this.generateRecommendations(prd);

    return {
      complexity,
      estimatedDuration,
      riskLevel,
      resourceRequirements,
      technicalChallenges,
      recommendations
    };
  }

  /**
   * Generate deliverables from PRD objectives
   * Creates multiple deliverables per objective for better granularity
   */
  private generateDeliverables(prd: PRD, analysis: ProjectAnalysis): Deliverable[] {
    const deliverables: Deliverable[] = [];
    
    prd.objectives.forEach((objective, objectiveIndex) => {
      console.log(`Processing objective ${objectiveIndex + 1}: ${objective}`);
      
      // Break down each objective into multiple deliverables
      const objectiveDeliverables = this.breakdownObjectiveIntoDeliverables(
        objective, 
        objectiveIndex, 
        prd,
        analysis
      );
      
      deliverables.push(...objectiveDeliverables);
    });

    // Add cross-cutting deliverables (testing, documentation, etc.)
    const crossCuttingDeliverables = this.generateCrossCuttingDeliverables(prd, analysis);
    deliverables.push(...crossCuttingDeliverables);

    return deliverables;
  }

  /**
   * Break down a single objective into multiple focused deliverables
   */
  private breakdownObjectiveIntoDeliverables(
    objective: string, 
    objectiveIndex: number, 
    prd: PRD,
    analysis: ProjectAnalysis
  ): Deliverable[] {
    const deliverables: Deliverable[] = [];
    const category = this.categorizeObjective(objective);
    
    // Generate phase-based deliverables for each objective
    const phases = this.getDeliverablesForCategory(category, objective);
    
    phases.forEach((phase, phaseIndex) => {
      const deliverableId = `deliverable-${objectiveIndex + 1}-${phaseIndex + 1}`;
      
      const deliverable: Deliverable = {
        id: deliverableId,
        title: `${phase.name}: ${objective}`,
        description: phase.description,
        category: category,
        priority: this.determinePriority(objectiveIndex, phaseIndex, phases.length),
        estimatedHours: phase.estimatedHours,
        dependencies: this.calculateDependencies(deliverableId, objectiveIndex, phaseIndex),
        tasks: this.generateTasksForDeliverable(phase, deliverableId, objective),
        successCriteria: this.generateSuccessCriteria(phase, objective),
        status: 'Not Started'
      };

      deliverables.push(deliverable);
    });

    return deliverables;
  }

  /**
   * Generate cross-cutting deliverables that apply to the entire project
   */
  private generateCrossCuttingDeliverables(prd: PRD, analysis: ProjectAnalysis): Deliverable[] {
    const deliverables: Deliverable[] = [];

    // Project Management deliverable
    deliverables.push({
      id: 'deliverable-pm-1',
      title: 'Project Management & Coordination',
      description: 'Overall project coordination, stakeholder management, and progress tracking',
      category: 'Management',
      priority: 'High',
      estimatedHours: Math.max(8, prd.objectives.length * 2),
      dependencies: [],
      tasks: this.generateProjectManagementTasks(),
      successCriteria: this.generateProjectManagementSuccessCriteria(prd),
      status: 'Not Started'
    });

    // Quality Assurance deliverable
    if (analysis.complexity !== 'Low') {
      deliverables.push({
        id: 'deliverable-qa-1',
        title: 'Quality Assurance & Testing',
        description: 'Comprehensive testing strategy and quality validation across all deliverables',
        category: 'Testing',
        priority: 'High',
        estimatedHours: Math.max(12, prd.objectives.length * 3),
        dependencies: [], // Will depend on other deliverables
        tasks: this.generateQualityAssuranceTasks(prd),
        successCriteria: this.generateQASuccessCriteria(prd),
        status: 'Not Started'
      });
    }

    return deliverables;
  }

  /**
   * Get deliverable phases for different categories
   */
  private getDeliverablesForCategory(category: string, objective: string): Array<{
    name: string;
    description: string;
    estimatedHours: number;
  }> {
    const basePhases = {
      'Design': [
        {
          name: 'Research & Analysis',
          description: `Conduct comprehensive research and analysis for: ${objective}`,
          estimatedHours: 8
        },
        {
          name: 'Design & Prototyping',
          description: `Create designs and prototypes for: ${objective}`,
          estimatedHours: 16
        }
      ],
      'Development': [
        {
          name: 'Technical Planning',
          description: `Plan technical approach and architecture for: ${objective}`,
          estimatedHours: 6
        },
        {
          name: 'Implementation',
          description: `Develop and implement: ${objective}`,
          estimatedHours: 24
        }
      ],
      'Research': [
        {
          name: 'Research Planning',
          description: `Plan research methodology for: ${objective}`,
          estimatedHours: 4
        },
        {
          name: 'Data Collection',
          description: `Collect and analyze data for: ${objective}`,
          estimatedHours: 12
        }
      ]
    };

    return basePhases[category as keyof typeof basePhases] || [
      {
        name: 'Planning',
        description: `Plan and prepare for: ${objective}`,
        estimatedHours: 4
      },
      {
        name: 'Execution',
        description: `Execute and complete: ${objective}`,
        estimatedHours: 12
      }
    ];
  }

  /**
   * Generate detailed tasks for a deliverable
   */
  private generateTasksForDeliverable(
    phase: { name: string; description: string; estimatedHours: number },
    deliverableId: string,
    objective: string
  ): Task[] {
    const tasks: Task[] = [];
    const taskCount = Math.max(2, Math.floor(phase.estimatedHours / 6));
    
    for (let i = 0; i < taskCount; i++) {
      const taskId = `${deliverableId}-task-${i + 1}`;
      const task = this.generateDetailedTask(taskId, phase, objective, i, taskCount);
      tasks.push(task);
    }

    return tasks;
  }

  /**
   * Generate a detailed task with comprehensive information
   */
  private generateDetailedTask(
    taskId: string,
    phase: { name: string; description: string; estimatedHours: number },
    objective: string,
    taskIndex: number,
    totalTasks: number
  ): Task {
    const taskTemplates = this.getTaskTemplatesForPhase(phase.name);
    const template = taskTemplates[taskIndex] || taskTemplates[0];
    
    const estimatedHours = Math.max(1, Math.floor(phase.estimatedHours / totalTasks));
    
    return {
      id: taskId,
      title: template.title.replace('{objective}', objective),
      description: template.description.replace('{objective}', objective),
      instructions: template.instructions.map(inst => inst.replace('{objective}', objective)),
      estimatedHours,
      priority: this.determineTaskPriority(taskIndex, totalTasks),
      status: 'Not Started',
      dependencies: taskIndex > 0 ? [`${taskId.split('-task-')[0]}-task-${taskIndex}`] : [],
      subtasks: this.generateSubtasks(template, objective, estimatedHours),
      testingCriteria: this.generateTaskTestingCriteria(template, objective),
      tools: template.tools || []
    };
  }

  /**
   * Generate detailed subtasks with time estimates
   */
  private generateSubtasks(
    template: any,
    objective: string,
    estimatedHours: number
  ): Array<{
    id: string;
    title: string;
    description: string;
    completed: boolean;
    estimatedMinutes: number;
  }> {
    const subtasks = template.subtasks || [];
    const totalMinutes = estimatedHours * 60;
    const minutesPerSubtask = Math.floor(totalMinutes / Math.max(1, subtasks.length));

    return subtasks.map((subtask: any, index: number) => ({
      id: `subtask-${index + 1}`,
      title: subtask.title.replace('{objective}', objective),
      description: subtask.description.replace('{objective}', objective),
      completed: false,
      estimatedMinutes: minutesPerSubtask
    }));
  }

  /**
   * Get task templates for different phases
   */
  private getTaskTemplatesForPhase(phaseName: string): any[] {
    const templates = {
      'Research & Analysis': [
        {
          title: 'Stakeholder Requirements Analysis for {objective}',
          description: 'Gather and analyze stakeholder requirements and expectations',
          instructions: [
            'Identify all relevant stakeholders',
            'Conduct stakeholder interviews',
            'Document requirements and constraints',
            'Analyze and prioritize requirements'
          ],
          subtasks: [
            { title: 'Stakeholder identification', description: 'Map all project stakeholders' },
            { title: 'Requirements gathering', description: 'Conduct interviews and gather requirements' }
          ],
          tools: [
            { name: 'Interview Tools', purpose: 'Stakeholder interviews', implementation: 'Video conferencing', required: true }
          ]
        }
      ]
    };

    return templates[phaseName as keyof typeof templates] || [
      {
        title: 'Complete {objective}',
        description: 'Execute the planned work for this objective',
        instructions: [
          'Review requirements and specifications',
          'Execute planned activities',
          'Monitor progress and quality'
        ],
        subtasks: [
          { title: 'Setup and preparation', description: 'Prepare necessary resources' },
          { title: 'Core execution', description: 'Execute main activities' }
        ],
        tools: [
          { name: 'Project Management Tool', purpose: 'Task tracking', implementation: 'Track progress', required: true }
        ]
      }
    ];
  }

  // Helper methods for analysis
  private determineComplexity(prd: PRD): 'Low' | 'Medium' | 'High' | 'Very High' {
    const factors = [
      prd.objectives.length > 5,
      prd.stakeholders.length > 3,
      prd.risks.length > 3,
      prd.description.length > 500,
      prd.successCriteria.length > 5
    ];
    
    const score = factors.filter(Boolean).length;
    if (score >= 4) return 'Very High';
    if (score >= 3) return 'High';
    if (score >= 2) return 'Medium';
    return 'Low';
  }

  private estimateProjectDuration(prd: PRD): string {
    const complexity = this.determineComplexity(prd);
    const objectiveCount = prd.objectives.length;
    
    const baseWeeks = {
      'Low': 2,
      'Medium': 4,
      'High': 8,
      'Very High': 12
    }[complexity];
    
    const adjustedWeeks = baseWeeks + Math.floor(objectiveCount / 2);
    
    if (adjustedWeeks <= 4) return `${adjustedWeeks} weeks`;
    return `${Math.ceil(adjustedWeeks / 4)} months`;
  }

  private assessRiskLevel(prd: PRD): 'Low' | 'Medium' | 'High' | 'Critical' {
    const riskCount = prd.risks.length;
    if (riskCount >= 5) return 'Critical';
    if (riskCount >= 3) return 'High';
    if (riskCount >= 1) return 'Medium';
    return 'Low';
  }

  private generateResourceRequirements(prd: PRD): string[] {
    const requirements = ['Project Manager'];
    
    if (prd.description.toLowerCase().includes('develop') || prd.description.toLowerCase().includes('build')) {
      requirements.push('Software Developer', 'QA Engineer');
    }
    
    if (prd.description.toLowerCase().includes('design') || prd.description.toLowerCase().includes('ui')) {
      requirements.push('UI/UX Designer');
    }
    
    return requirements;
  }

  private identifyTechnicalChallenges(prd: PRD): string[] {
    const challenges: string[] = [];
    
    if (prd.risks.some(risk => risk.toLowerCase().includes('technical'))) {
      challenges.push('Technical complexity management');
    }
    
    if (prd.stakeholders.length > 3) {
      challenges.push('Multi-stakeholder coordination');
    }
    
    return challenges;
  }

  private generateRecommendations(prd: PRD): string[] {
    const recommendations: string[] = [];
    
    if (this.determineComplexity(prd) === 'Very High') {
      recommendations.push('Consider breaking into smaller phases');
    }
    
    if (prd.risks.length > 3) {
      recommendations.push('Implement comprehensive risk mitigation strategies');
    }
    
    return recommendations;
  }

  private categorizeObjective(objective: string): string {
    const lower = objective.toLowerCase();
    if (lower.includes('design') || lower.includes('ui')) return 'Design';
    if (lower.includes('develop') || lower.includes('build') || lower.includes('implement')) return 'Development';
    if (lower.includes('test') || lower.includes('quality')) return 'Testing';
    if (lower.includes('research') || lower.includes('analyze')) return 'Research';
    return 'General';
  }

  private determinePriority(objectiveIndex: number, phaseIndex: number, totalPhases: number): 'Low' | 'Medium' | 'High' | 'Critical' {
    if (objectiveIndex === 0 && phaseIndex === 0) return 'Critical';
    if (objectiveIndex < 2) return 'High';
    if (objectiveIndex < 4) return 'Medium';
    return 'Low';
  }

  private determineTaskPriority(taskIndex: number, totalTasks: number): 'Low' | 'Medium' | 'High' | 'Critical' {
    if (taskIndex === 0) return 'High';
    if (taskIndex < totalTasks / 2) return 'Medium';
    return 'Low';
  }

  private calculateDependencies(deliverableId: string, objectiveIndex: number, phaseIndex: number): string[] {
    const dependencies: string[] = [];
    
    // Previous phase in same objective
    if (phaseIndex > 0) {
      dependencies.push(`deliverable-${objectiveIndex + 1}-${phaseIndex}`);
    }
    
    return dependencies;
  }

  private generateSuccessCriteria(phase: any, objective: string): any {
    return {
      measurableMetrics: [
        {
          id: 'metric-completion',
          name: 'Completion Rate',
          description: 'Percentage of phase completed',
          type: 'percentage',
          targetValue: 100,
          unit: '%',
          automated: false,
          testingMethod: 'Manual review of deliverables'
        }
      ],
      qualitativeFactors: [
        {
          id: 'qual-quality',
          name: 'Quality Assessment',
          description: 'Overall quality of deliverable',
          importance: 'High',
          evaluationMethod: 'Peer review and stakeholder feedback',
          criteria: ['Meets requirements', 'Quality standards met'],
          maxScore: 10
        }
      ],
      testingRequirements: [
        'All deliverable components completed',
        'Quality review passed'
      ],
      acceptanceCriteria: [
        'All planned activities completed',
        'Quality standards met',
        'Documentation updated'
      ]
    };
  }

  private generateTaskTestingCriteria(template: any, objective: string): any {
    return {
      unitTests: [],
      integrationTests: [],
      userAcceptanceTests: [
        `Task deliverable meets requirements for ${objective}`,
        'All subtasks completed successfully'
      ],
      performanceTests: [],
      securityTests: [],
      accessibilityTests: [],
      manualTests: [
        'Manual review of task outputs',
        'Documentation updated'
      ]
    };
  }

  private generateProjectManagementTasks(): Task[] {
    return [
      {
        id: 'pm-task-1',
        title: 'Project Initiation and Planning',
        description: 'Set up project structure, communication channels, and initial planning',
        instructions: [
          'Set up project management tools and workspace',
          'Establish communication channels with stakeholders',
          'Create detailed project timeline and milestones'
        ],
        estimatedHours: 6,
        priority: 'High',
        status: 'Not Started',
        dependencies: [],
        subtasks: [
          { id: 'pm-st1', title: 'Tool setup', description: 'Configure project management tools', completed: false, estimatedMinutes: 60 },
          { id: 'pm-st2', title: 'Communication setup', description: 'Establish team communication channels', completed: false, estimatedMinutes: 30 }
        ],
        testingCriteria: {
          unitTests: [],
          integrationTests: [],
          userAcceptanceTests: ['Project structure approved by stakeholders'],
          performanceTests: [],
          securityTests: [],
          accessibilityTests: [],
          manualTests: ['Project setup review']
        },
        tools: [
          { name: 'Project Management Software', purpose: 'Task and timeline management', implementation: 'Configure project workspace', required: true }
        ]
      }
    ];
  }

  private generateQualityAssuranceTasks(prd: PRD): Task[] {
    return [
      {
        id: 'qa-task-1',
        title: 'Quality Assurance Strategy Development',
        description: 'Develop comprehensive QA strategy and testing framework',
        instructions: [
          'Define quality standards and criteria',
          'Create testing strategy and framework',
          'Set up quality gates and checkpoints'
        ],
        estimatedHours: 8,
        priority: 'High',
        status: 'Not Started',
        dependencies: [],
        subtasks: [
          { id: 'qa-st1', title: 'Quality standards', description: 'Define project quality standards', completed: false, estimatedMinutes: 120 },
          { id: 'qa-st2', title: 'Testing framework', description: 'Create comprehensive testing framework', completed: false, estimatedMinutes: 180 }
        ],
        testingCriteria: {
          unitTests: [],
          integrationTests: [],
          userAcceptanceTests: ['QA strategy approved by stakeholders'],
          performanceTests: [],
          securityTests: [],
          accessibilityTests: [],
          manualTests: ['Strategy review']
        },
        tools: [
          { name: 'Testing Tools', purpose: 'Quality assurance testing', implementation: 'Set up testing environment', required: true }
        ]
      }
    ];
  }

  private generateProjectManagementSuccessCriteria(prd: PRD): any {
    return {
      measurableMetrics: [
        {
          id: 'pm-metric-1',
          name: 'Project Timeline Adherence',
          description: 'Percentage of milestones delivered on time',
          type: 'percentage',
          targetValue: 90,
          unit: '%',
          automated: true,
          testingMethod: 'Automated milestone tracking'
        }
      ],
      qualitativeFactors: [
        {
          id: 'pm-qual-1',
          name: 'Communication Effectiveness',
          description: 'Quality of project communication and coordination',
          importance: 'High',
          evaluationMethod: 'Team feedback and communication audit',
          criteria: ['Clear communication', 'Timely updates'],
          maxScore: 10
        }
      ],
      testingRequirements: [
        'All project management processes documented',
        'Regular stakeholder check-ins completed'
      ],
      acceptanceCriteria: [
        'Project delivered on time and within scope',
        'All stakeholders satisfied with communication'
      ]
    };
  }

  private generateQASuccessCriteria(prd: PRD): any {
    return {
      measurableMetrics: [
        {
          id: 'qa-metric-1',
          name: 'Defect Detection Rate',
          description: 'Percentage of defects caught before delivery',
          type: 'percentage',
          targetValue: 95,
          unit: '%',
          automated: true,
          testingMethod: 'Automated defect tracking'
        }
      ],
      qualitativeFactors: [
        {
          id: 'qa-qual-1',
          name: 'Overall Quality Assessment',
          description: 'Comprehensive quality evaluation of all deliverables',
          importance: 'Critical',
          evaluationMethod: 'Multi-stakeholder quality review',
          criteria: ['Meets requirements', 'Exceeds quality standards'],
          maxScore: 10
        }
      ],
      testingRequirements: [
        'All deliverables pass defined quality gates',
        'Comprehensive testing completed for all components'
      ],
      acceptanceCriteria: [
        'Zero critical defects in final deliverables',
        'All quality standards met or exceeded'
      ]
    };
  }
}

// Export factory function for easy instantiation
export const createPRDService = (config?: PRDAnalysisConfig): PRDService => {
  return new PRDService(config);
};

// Export types for external use
export type { PRDAnalysisConfig, TaskGenerationResult };