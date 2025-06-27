import { GraphNode, GraphEdge, GraphData } from '../types/graph';
import { PRD, Deliverable, Task } from '../types';

/**
 * Service for converting project data to graph format and managing graph operations
 */
export class GraphDataService {
  /**
   * Convert PRDs and deliverables to graph data structure
   */
  static convertProjectDataToGraph(prds: PRD[], deliverables: Deliverable[]): GraphData {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    // Add PRD nodes
    prds.forEach(prd => {
      nodes.push({
        id: prd.id,
        label: prd.title,
        type: 'prd',
        data: prd,
        status: 'in-progress',
        metadata: {
          createdAt: prd.createdAt,
          updatedAt: prd.updatedAt,
          priority: 'high',
          estimatedHours: deliverables
            .filter(d => prd.deliverables.some(pd => pd.id === d.id))
            .reduce((sum, d) => sum + d.estimatedHours, 0),
          tags: ['project', 'requirements']
        }
      });
    });

    // Add deliverable nodes and create hierarchy
    deliverables.forEach(deliverable => {
      nodes.push({
        id: deliverable.id,
        label: deliverable.title,
        type: 'deliverable',
        data: deliverable,
        status: this.mapStatus(deliverable.status),
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          priority: deliverable.priority.toLowerCase() as any,
          estimatedHours: deliverable.estimatedHours,
          progress: this.calculateProgress(deliverable),
          tags: [deliverable.category.toLowerCase()]
        }
      });

      // Find parent PRD and create hierarchy edge
      const parentPRD = prds.find(prd => 
        prd.deliverables.some(d => d.id === deliverable.id)
      );

      if (parentPRD) {
        edges.push({
          id: `${parentPRD.id}-${deliverable.id}`,
          source: parentPRD.id,
          target: deliverable.id,
          type: 'hierarchy',
          label: 'contains',
          metadata: {
            createdAt: new Date().toISOString(),
            strength: 1.0
          }
        });
      }

      // Add dependency edges between deliverables
      deliverable.dependencies.forEach(depId => {
        if (deliverables.some(d => d.id === depId)) {
          edges.push({
            id: `${depId}-${deliverable.id}`,
            source: depId,
            target: deliverable.id,
            type: 'dependency',
            label: 'depends on',
            style: 'dashed',
            color: '#ef4444',
            metadata: {
              createdAt: new Date().toISOString(),
              strength: 0.8
            }
          });
        }
      });

      // Add task nodes and edges
      deliverable.tasks.forEach(task => {
        nodes.push({
          id: task.id,
          label: task.title,
          type: 'task',
          data: task,
          status: this.mapStatus(task.status),
          metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            priority: task.priority.toLowerCase() as any,
            estimatedHours: task.estimatedHours,
            progress: this.calculateTaskProgress(task),
            tags: ['task']
          }
        });

        // Edge from deliverable to task
        edges.push({
          id: `${deliverable.id}-${task.id}`,
          source: deliverable.id,
          target: task.id,
          type: 'hierarchy',
          label: 'contains',
          metadata: {
            createdAt: new Date().toISOString(),
            strength: 1.0
          }
        });

        // Add task dependency edges
        task.dependencies.forEach(depId => {
          edges.push({
            id: `${depId}-${task.id}`,
            source: depId,
            target: task.id,
            type: 'dependency',
            label: 'depends on',
            style: 'dashed',
            color: '#ef4444',
            metadata: {
              createdAt: new Date().toISOString(),
              strength: 0.6
            }
          });
        });

        // Add subtask nodes
        task.subtasks.forEach(subtask => {
          nodes.push({
            id: subtask.id,
            label: subtask.title,
            type: 'subtask',
            data: subtask,
            status: subtask.completed ? 'complete' : 'not-started',
            metadata: {
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              priority: 'medium',
              estimatedHours: subtask.estimatedMinutes / 60,
              progress: subtask.completed ? 100 : 0,
              tags: ['subtask']
            }
          });

          edges.push({
            id: `${task.id}-${subtask.id}`,
            source: task.id,
            target: subtask.id,
            type: 'hierarchy',
            label: 'contains',
            metadata: {
              createdAt: new Date().toISOString(),
              strength: 1.0
            }
          });
        });
      });
    });

    return {
      nodes,
      edges,
      metadata: {
        id: `project-graph-${Date.now()}`,
        name: 'Project Dependency Graph',
        description: 'Comprehensive view of project structure, dependencies, and progress',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '1.0.0',
        layout: 'hierarchical'
      }
    };
  }

  /**
   * Create a git-like version history graph
   */
  static createVersionHistoryGraph(versionHistory: any[]): GraphData {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    versionHistory.forEach((version, index) => {
      nodes.push({
        id: version.id,
        label: `v${version.version}`,
        type: 'commit',
        data: version,
        status: index === 0 ? 'complete' : 'complete',
        metadata: {
          createdAt: version.timestamp,
          updatedAt: version.timestamp,
          author: version.author,
          tags: version.tags || []
        }
      });

      // Create edges to parent versions
      if (version.parentVersion && index > 0) {
        const parentVersion = versionHistory.find(v => v.version === version.parentVersion);
        if (parentVersion) {
          edges.push({
            id: `${parentVersion.id}-${version.id}`,
            source: parentVersion.id,
            target: version.id,
            type: 'version',
            label: 'evolves to',
            metadata: {
              createdAt: version.timestamp
            }
          });
        }
      }
    });

    return {
      nodes,
      edges,
      metadata: {
        id: `version-history-${Date.now()}`,
        name: 'Version History',
        description: 'Git-like visualization of project version history',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '1.0.0'
      }
    };
  }

  /**
   * Create a test results graph
   */
  static createTestResultsGraph(testResults: any[]): GraphData {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    testResults.forEach(test => {
      nodes.push({
        id: test.id,
        label: test.name,
        type: 'test',
        data: test,
        status: test.passed ? 'complete' : 'failed',
        metadata: {
          createdAt: test.timestamp,
          updatedAt: test.timestamp,
          tags: [test.type, test.suite]
        }
      });

      // Create edges to related components
      if (test.componentId) {
        edges.push({
          id: `${test.componentId}-${test.id}`,
          source: test.componentId,
          target: test.id,
          type: 'test',
          label: 'tests',
          color: test.passed ? '#10b981' : '#ef4444',
          metadata: {
            createdAt: test.timestamp
          }
        });
      }
    });

    return {
      nodes,
      edges,
      metadata: {
        id: `test-results-${Date.now()}`,
        name: 'Test Results',
        description: 'Visualization of test coverage and results',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '1.0.0'
      }
    };
  }

  /**
   * Create an agent assignment graph
   */
  static createAgentAssignmentGraph(agents: any[], tasks: Task[]): GraphData {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    // Add agent nodes
    agents.forEach(agent => {
      nodes.push({
        id: agent.id,
        label: agent.name,
        type: 'agent',
        data: agent,
        status: 'in-progress',
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: [agent.role, agent.expertise]
        }
      });
    });

    // Add task nodes and assignment edges
    tasks.forEach(task => {
      nodes.push({
        id: task.id,
        label: task.title,
        type: 'task',
        data: task,
        status: this.mapStatus(task.status),
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          priority: task.priority.toLowerCase() as any,
          estimatedHours: task.estimatedHours
        }
      });

      // Create assignment edge if task has assignee
      if (task.assignee) {
        const agent = agents.find(a => a.id === task.assignee || a.name === task.assignee);
        if (agent) {
          edges.push({
            id: `${agent.id}-${task.id}`,
            source: agent.id,
            target: task.id,
            type: 'assignment',
            label: 'assigned to',
            color: '#3b82f6',
            metadata: {
              createdAt: new Date().toISOString()
            }
          });
        }
      }
    });

    return {
      nodes,
      edges,
      metadata: {
        id: `agent-assignments-${Date.now()}`,
        name: 'Agent Assignments',
        description: 'Visualization of task assignments to team members',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '1.0.0'
      }
    };
  }

  /**
   * Generate sample data for testing
   */
  static generateSampleData(nodeCount: number = 100): GraphData {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    // Generate nodes
    for (let i = 0; i < nodeCount; i++) {
      const types = ['prd', 'deliverable', 'task', 'subtask', 'milestone'];
      const statuses = ['not-started', 'in-progress', 'review', 'complete', 'blocked'];
      const priorities = ['low', 'medium', 'high', 'critical'];

      nodes.push({
        id: `node-${i}`,
        label: `Node ${i}`,
        type: types[Math.floor(Math.random() * types.length)] as any,
        data: { sampleData: true },
        status: statuses[Math.floor(Math.random() * statuses.length)] as any,
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          priority: priorities[Math.floor(Math.random() * priorities.length)] as any,
          estimatedHours: Math.floor(Math.random() * 40) + 1,
          progress: Math.floor(Math.random() * 100),
          tags: [`tag-${Math.floor(Math.random() * 5)}`]
        }
      });
    }

    // Generate edges (create a connected graph)
    const edgeCount = Math.floor(nodeCount * 1.5);
    for (let i = 0; i < edgeCount; i++) {
      const sourceIndex = Math.floor(Math.random() * nodeCount);
      const targetIndex = Math.floor(Math.random() * nodeCount);
      
      if (sourceIndex !== targetIndex) {
        const types = ['hierarchy', 'dependency', 'flow', 'reference'];
        
        edges.push({
          id: `edge-${i}`,
          source: `node-${sourceIndex}`,
          target: `node-${targetIndex}`,
          type: types[Math.floor(Math.random() * types.length)] as any,
          label: `Edge ${i}`,
          metadata: {
            createdAt: new Date().toISOString(),
            strength: Math.random()
          }
        });
      }
    }

    return {
      nodes,
      edges,
      metadata: {
        id: `sample-graph-${Date.now()}`,
        name: 'Sample Graph Data',
        description: 'Generated sample data for testing graph visualization',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '1.0.0'
      }
    };
  }

  // Helper methods
  private static mapStatus(status: string): 'not-started' | 'in-progress' | 'review' | 'complete' | 'blocked' | 'failed' {
    switch (status) {
      case 'Complete': return 'complete';
      case 'In Progress': return 'in-progress';
      case 'Review': return 'review';
      case 'Blocked': return 'blocked';
      case 'Not Started': return 'not-started';
      default: return 'not-started';
    }
  }

  private static calculateProgress(deliverable: Deliverable): number {
    if (deliverable.status === 'Complete') return 100;
    if (deliverable.status === 'In Progress') return 50;
    if (deliverable.status === 'Review') return 80;
    return 0;
  }

  private static calculateTaskProgress(task: Task): number {
    if (task.status === 'Complete') return 100;
    if (task.status === 'In Progress') {
      // Calculate based on subtask completion
      if (task.subtasks.length > 0) {
        const completedSubtasks = task.subtasks.filter(st => st.completed).length;
        return Math.round((completedSubtasks / task.subtasks.length) * 100);
      }
      return 50;
    }
    if (task.status === 'Review') return 90;
    return 0;
  }
}

export default GraphDataService;