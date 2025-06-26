import { PRDService, TaskGenerationResult } from './PRDService';
import { PRD, Task, Deliverable } from '../types';

/**
 * MCP-compatible Taskmaster service
 * Provides task management capabilities via MCP protocol
 */
export class MCPTaskmasterService {
  private prdService: PRDService;
  private tasks: Map<string, Task> = new Map();
  private projects: Map<string, PRD> = new Map();

  constructor() {
    this.prdService = new PRDService();
  }

  /**
   * MCP Tool: Create project from PRD
   */
  async createProject(args: {
    prd: PRD;
    config?: any;
  }): Promise<{
    projectId: string;
    analysis: any;
    taskCount: number;
    deliverableCount: number;
  }> {
    const { prd, config } = args;
    
    // Generate comprehensive task breakdown
    const result = await this.prdService.generateTasksFromPRD(prd);
    
    // Store project and tasks
    this.projects.set(prd.id, prd);
    result.deliverables.forEach(deliverable => {
      deliverable.tasks.forEach(task => {
        this.tasks.set(task.id, {
          ...task,
          projectId: prd.id,
          deliverableId: deliverable.id
        } as any);
      });
    });

    return {
      projectId: prd.id,
      analysis: result.analysis,
      taskCount: result.metadata.totalTasks,
      deliverableCount: result.deliverables.length
    };
  }

  /**
   * MCP Tool: Get task by ID
   */
  async getTask(args: { taskId: string }): Promise<Task | null> {
    return this.tasks.get(args.taskId) || null;
  }

  /**
   * MCP Tool: Update task status
   */
  async updateTaskStatus(args: {
    taskId: string;
    status: 'Not Started' | 'In Progress' | 'Review' | 'Complete' | 'Blocked';
    notes?: string;
  }): Promise<{ success: boolean; task: Task | null }> {
    const task = this.tasks.get(args.taskId);
    if (!task) {
      return { success: false, task: null };
    }

    const updatedTask = {
      ...task,
      status: args.status,
      updatedAt: new Date().toISOString(),
      ...(args.notes && { notes: args.notes })
    };

    this.tasks.set(args.taskId, updatedTask);
    
    return { success: true, task: updatedTask };
  }

  /**
   * MCP Tool: Get project progress
   */
  async getProjectProgress(args: { projectId: string }): Promise<{
    projectId: string;
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    blockedTasks: number;
    progressPercentage: number;
    estimatedHoursRemaining: number;
  }> {
    const projectTasks = Array.from(this.tasks.values())
      .filter((task: any) => task.projectId === args.projectId);

    const totalTasks = projectTasks.length;
    const completedTasks = projectTasks.filter(t => t.status === 'Complete').length;
    const inProgressTasks = projectTasks.filter(t => t.status === 'In Progress').length;
    const blockedTasks = projectTasks.filter(t => t.status === 'Blocked').length;
    
    const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    const estimatedHoursRemaining = projectTasks
      .filter(t => t.status !== 'Complete')
      .reduce((sum, task) => sum + task.estimatedHours, 0);

    return {
      projectId: args.projectId,
      totalTasks,
      completedTasks,
      inProgressTasks,
      blockedTasks,
      progressPercentage,
      estimatedHoursRemaining
    };
  }

  /**
   * MCP Tool: Generate task recommendations
   */
  async generateTaskRecommendations(args: {
    projectId: string;
    context?: string;
  }): Promise<{
    recommendations: Array<{
      type: 'priority' | 'dependency' | 'resource' | 'risk';
      message: string;
      taskIds: string[];
      severity: 'low' | 'medium' | 'high';
    }>;
  }> {
    const projectTasks = Array.from(this.tasks.values())
      .filter((task: any) => task.projectId === args.projectId);

    const recommendations: any[] = [];

    // Check for blocked tasks
    const blockedTasks = projectTasks.filter(t => t.status === 'Blocked');
    if (blockedTasks.length > 0) {
      recommendations.push({
        type: 'risk',
        message: `${blockedTasks.length} tasks are blocked and need attention`,
        taskIds: blockedTasks.map(t => t.id),
        severity: 'high'
      });
    }

    // Check for high priority tasks not started
    const highPriorityNotStarted = projectTasks.filter(
      t => t.priority === 'High' && t.status === 'Not Started'
    );
    if (highPriorityNotStarted.length > 0) {
      recommendations.push({
        type: 'priority',
        message: `${highPriorityNotStarted.length} high priority tasks haven't been started`,
        taskIds: highPriorityNotStarted.map(t => t.id),
        severity: 'medium'
      });
    }

    // Check for dependency issues
    const dependencyIssues = projectTasks.filter(task => {
      return task.dependencies.some(depId => {
        const depTask = this.tasks.get(depId);
        return depTask && depTask.status !== 'Complete';
      });
    });

    if (dependencyIssues.length > 0) {
      recommendations.push({
        type: 'dependency',
        message: `${dependencyIssues.length} tasks are waiting on dependencies`,
        taskIds: dependencyIssues.map(t => t.id),
        severity: 'medium'
      });
    }

    return { recommendations };
  }

  /**
   * Get MCP tool definitions
   */
  getToolDefinitions() {
    return [
      {
        name: "create_project",
        description: "Create a new project from PRD with comprehensive task breakdown",
        inputSchema: {
          type: "object",
          properties: {
            prd: {
              type: "object",
              description: "Project Requirements Document"
            },
            config: {
              type: "object",
              description: "Generation configuration options"
            }
          },
          required: ["prd"]
        }
      },
      {
        name: "get_task",
        description: "Retrieve detailed information about a specific task",
        inputSchema: {
          type: "object",
          properties: {
            taskId: {
              type: "string",
              description: "Unique task identifier"
            }
          },
          required: ["taskId"]
        }
      },
      {
        name: "update_task_status",
        description: "Update the status of a task",
        inputSchema: {
          type: "object",
          properties: {
            taskId: {
              type: "string",
              description: "Unique task identifier"
            },
            status: {
              type: "string",
              enum: ["Not Started", "In Progress", "Review", "Complete", "Blocked"],
              description: "New task status"
            },
            notes: {
              type: "string",
              description: "Optional notes about the status change"
            }
          },
          required: ["taskId", "status"]
        }
      },
      {
        name: "get_project_progress",
        description: "Get comprehensive progress report for a project",
        inputSchema: {
          type: "object",
          properties: {
            projectId: {
              type: "string",
              description: "Project identifier"
            }
          },
          required: ["projectId"]
        }
      },
      {
        name: "generate_task_recommendations",
        description: "Generate intelligent recommendations for task management",
        inputSchema: {
          type: "object",
          properties: {
            projectId: {
              type: "string",
              description: "Project identifier"
            },
            context: {
              type: "string",
              description: "Additional context for recommendations"
            }
          },
          required: ["projectId"]
        }
      }
    ];
  }
}

// Export singleton instance
export const mcpTaskmaster = new MCPTaskmasterService();