import React, { useState, useEffect } from 'react';
import { 
  Network, 
  BarChart3, 
  GitBranch, 
  Users, 
  TestTube, 
  Clock, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Activity,
  Layers,
  Zap
} from 'lucide-react';
import GraphVisualization from './GraphVisualization';
import { GraphDataService } from '../services/GraphDataService';
import { GraphData, GraphAnalytics } from '../types/graph';
import { PRD, Deliverable } from '../types';

interface GraphDashboardProps {
  prds: PRD[];
  deliverables: Deliverable[];
  className?: string;
}

const GraphDashboard: React.FC<GraphDashboardProps> = ({
  prds,
  deliverables,
  className = ''
}) => {
  const [activeView, setActiveView] = useState<'project' | 'version' | 'test' | 'agents'>('project');
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [analytics, setAnalytics] = useState<GraphAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Sample data for demonstration
  const sampleAgents = [
    { id: 'agent-1', name: 'Technical Architect', role: 'architect', expertise: 'system-design' },
    { id: 'agent-2', name: 'Frontend Developer', role: 'developer', expertise: 'react' },
    { id: 'agent-3', name: 'Backend Developer', role: 'developer', expertise: 'nodejs' },
    { id: 'agent-4', name: 'DevOps Engineer', role: 'devops', expertise: 'infrastructure' }
  ];

  const sampleVersionHistory = [
    {
      id: 'v1.0.0',
      version: '1.0.0',
      timestamp: '2024-01-01T00:00:00Z',
      author: 'system',
      message: 'Initial project setup',
      tags: ['release']
    },
    {
      id: 'v1.1.0',
      version: '1.1.0',
      timestamp: '2024-01-15T00:00:00Z',
      author: 'developer',
      message: 'Added authentication system',
      parentVersion: '1.0.0',
      tags: ['feature']
    },
    {
      id: 'v1.2.0',
      version: '1.2.0',
      timestamp: '2024-02-01T00:00:00Z',
      author: 'developer',
      message: 'Implemented data visualization',
      parentVersion: '1.1.0',
      tags: ['feature']
    }
  ];

  const sampleTestResults = [
    {
      id: 'test-1',
      name: 'Authentication Tests',
      type: 'unit',
      suite: 'auth',
      passed: true,
      timestamp: '2024-02-01T10:00:00Z',
      componentId: 'auth-component'
    },
    {
      id: 'test-2',
      name: 'API Integration Tests',
      type: 'integration',
      suite: 'api',
      passed: false,
      timestamp: '2024-02-01T10:30:00Z',
      componentId: 'api-component'
    }
  ];

  useEffect(() => {
    generateGraphData();
  }, [activeView, prds, deliverables]);

  const generateGraphData = async () => {
    setIsLoading(true);
    
    try {
      let data: GraphData;
      
      switch (activeView) {
        case 'project':
          data = GraphDataService.convertProjectDataToGraph(prds, deliverables);
          break;
        case 'version':
          data = GraphDataService.createVersionHistoryGraph(sampleVersionHistory);
          break;
        case 'test':
          data = GraphDataService.createTestResultsGraph(sampleTestResults);
          break;
        case 'agents':
          const allTasks = deliverables.flatMap(d => d.tasks);
          data = GraphDataService.createAgentAssignmentGraph(sampleAgents, allTasks);
          break;
        default:
          data = GraphDataService.generateSampleData(50);
      }
      
      setGraphData(data);
      
      // Calculate analytics (simplified)
      const analytics: GraphAnalytics = {
        nodeCount: data.nodes.length,
        edgeCount: data.edges.length,
        density: data.nodes.length > 1 ? (2 * data.edges.length) / (data.nodes.length * (data.nodes.length - 1)) : 0,
        averageDegree: data.nodes.length > 0 ? (2 * data.edges.length) / data.nodes.length : 0,
        clusters: Math.ceil(data.nodes.length / 10),
        criticalPath: data.nodes.slice(0, 5).map(n => n.id),
        bottlenecks: data.nodes.filter(n => n.metadata?.priority === 'high').map(n => n.id),
        metrics: {
          maxDegree: 10,
          minDegree: 0,
          isolatedNodes: 0
        }
      };
      
      setAnalytics(analytics);
    } catch (error) {
      console.error('Failed to generate graph data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getViewConfig = () => {
    switch (activeView) {
      case 'project':
        return {
          engine: 'cytoscape' as const,
          layout: 'hierarchical',
          interactive: true,
          realtime: false
        };
      case 'version':
        return {
          engine: 'cytoscape' as const,
          layout: 'dagre',
          interactive: true,
          realtime: false
        };
      case 'test':
        return {
          engine: 'vis' as const,
          layout: 'force',
          interactive: true,
          realtime: true
        };
      case 'agents':
        return {
          engine: 'cytoscape' as const,
          layout: 'circular',
          interactive: true,
          realtime: false
        };
      default:
        return {
          engine: 'cytoscape' as const,
          layout: 'hierarchical',
          interactive: true,
          realtime: false
        };
    }
  };

  const getViewDescription = () => {
    switch (activeView) {
      case 'project':
        return 'Hierarchical view of project structure, deliverables, and task dependencies';
      case 'version':
        return 'Git-like visualization of project version history and evolution';
      case 'test':
        return 'Real-time view of test coverage, results, and component relationships';
      case 'agents':
        return 'Team structure and task assignments across project agents';
      default:
        return 'Interactive graph visualization';
    }
  };

  const getViewStats = () => {
    if (!analytics) return null;

    switch (activeView) {
      case 'project':
        return [
          { label: 'PRDs', value: prds.length, icon: Network, color: 'blue' },
          { label: 'Deliverables', value: deliverables.length, icon: Layers, color: 'green' },
          { label: 'Total Tasks', value: deliverables.reduce((sum, d) => sum + d.tasks.length, 0), icon: CheckCircle, color: 'purple' },
          { label: 'Dependencies', value: analytics.edgeCount, icon: GitBranch, color: 'orange' }
        ];
      case 'version':
        return [
          { label: 'Versions', value: sampleVersionHistory.length, icon: GitBranch, color: 'blue' },
          { label: 'Commits', value: analytics.nodeCount, icon: Activity, color: 'green' },
          { label: 'Branches', value: 3, icon: GitBranch, color: 'purple' },
          { label: 'Contributors', value: 4, icon: Users, color: 'orange' }
        ];
      case 'test':
        return [
          { label: 'Test Suites', value: 12, icon: TestTube, color: 'blue' },
          { label: 'Passed', value: 89, icon: CheckCircle, color: 'green' },
          { label: 'Failed', value: 3, icon: AlertTriangle, color: 'red' },
          { label: 'Coverage', value: '94%', icon: BarChart3, color: 'purple' }
        ];
      case 'agents':
        return [
          { label: 'Team Members', value: sampleAgents.length, icon: Users, color: 'blue' },
          { label: 'Active Tasks', value: 23, icon: Activity, color: 'green' },
          { label: 'Workload', value: '78%', icon: TrendingUp, color: 'orange' },
          { label: 'Efficiency', value: '92%', icon: Zap, color: 'purple' }
        ];
      default:
        return [];
    }
  };

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-gray-900 ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Graph Dashboard</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {getViewDescription()}
            </p>
          </div>
          
          {/* View Selector */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveView('project')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                activeView === 'project'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Network className="h-4 w-4" />
              <span>Project</span>
            </button>
            <button
              onClick={() => setActiveView('version')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                activeView === 'version'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <GitBranch className="h-4 w-4" />
              <span>Version</span>
            </button>
            <button
              onClick={() => setActiveView('test')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                activeView === 'test'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <TestTube className="h-4 w-4" />
              <span>Tests</span>
            </button>
            <button
              onClick={() => setActiveView('agents')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                activeView === 'agents'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Agents</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {getViewStats()?.map((stat, index) => (
            <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                </div>
                <div className={`p-2 rounded-lg bg-${stat.color}-100 dark:bg-${stat.color}-900/30`}>
                  <stat.icon className={`h-6 w-6 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Graph Visualization */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading graph visualization...</p>
            </div>
          </div>
        ) : graphData ? (
          <GraphVisualization
            prds={prds}
            deliverables={deliverables}
            config={getViewConfig()}
            onNodeClick={(node) => {
              console.log('Node clicked:', node);
            }}
            onEdgeClick={(edge) => {
              console.log('Edge clicked:', edge);
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Network className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Graph Data Available
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Import some project data to see the graph visualization.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GraphDashboard;