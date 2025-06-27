import React, { useState, useEffect, useRef } from 'react';
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
  Zap,
  Eye,
  Filter,
  Download,
  RotateCcw
} from 'lucide-react';
import { PRD, Deliverable } from '../types';

interface GraphDashboardProps {
  prds: PRD[];
  deliverables: Deliverable[];
  className?: string;
}

interface GraphNode {
  id: string;
  label: string;
  type: 'prd' | 'deliverable' | 'task' | 'subtask';
  x: number;
  y: number;
  color: string;
  size: number;
  status: string;
  data: any;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: 'hierarchy' | 'dependency';
  color: string;
}

const GraphDashboard: React.FC<GraphDashboardProps> = ({
  prds,
  deliverables,
  className = ''
}) => {
  const [activeView, setActiveView] = useState<'project' | 'version' | 'test' | 'agents'>('project');
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    showCompleted: true,
    showInProgress: true,
    showNotStarted: true,
    showDependencies: true
  });
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    generateGraphData();
  }, [prds, deliverables, activeView]);

  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current) {
        const rect = svgRef.current.parentElement?.getBoundingClientRect();
        if (rect) {
          setDimensions({ width: rect.width, height: rect.height });
        }
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const generateGraphData = () => {
    const newNodes: GraphNode[] = [];
    const newEdges: GraphEdge[] = [];

    if (activeView === 'project') {
      let yOffset = 50;
      const centerX = dimensions.width / 2;

      // Add PRD nodes
      prds.forEach((prd, prdIndex) => {
        const prdNode: GraphNode = {
          id: prd.id,
          label: prd.title,
          type: 'prd',
          x: centerX,
          y: yOffset,
          color: '#3b82f6',
          size: 60,
          status: 'active',
          data: prd
        };
        newNodes.push(prdNode);

        yOffset += 100;

        // Add deliverable nodes for this PRD
        const prdDeliverables = deliverables.filter(d => 
          prd.deliverables.some(pd => pd.id === d.id)
        );

        prdDeliverables.forEach((deliverable, delIndex) => {
          const xOffset = centerX + (delIndex - (prdDeliverables.length - 1) / 2) * 200;
          
          const deliverableNode: GraphNode = {
            id: deliverable.id,
            label: deliverable.title,
            type: 'deliverable',
            x: xOffset,
            y: yOffset,
            color: getStatusColor(deliverable.status),
            size: 40,
            status: deliverable.status,
            data: deliverable
          };
          newNodes.push(deliverableNode);

          // Add edge from PRD to deliverable
          newEdges.push({
            id: `${prd.id}-${deliverable.id}`,
            source: prd.id,
            target: deliverable.id,
            type: 'hierarchy',
            color: '#6b7280'
          });

          // Add task nodes
          deliverable.tasks.forEach((task, taskIndex) => {
            const taskX = xOffset + (taskIndex - (deliverable.tasks.length - 1) / 2) * 80;
            const taskY = yOffset + 120;

            const taskNode: GraphNode = {
              id: task.id,
              label: task.title,
              type: 'task',
              x: taskX,
              y: taskY,
              color: getStatusColor(task.status),
              size: 25,
              status: task.status,
              data: task
            };
            newNodes.push(taskNode);

            // Add edge from deliverable to task
            newEdges.push({
              id: `${deliverable.id}-${task.id}`,
              source: deliverable.id,
              target: task.id,
              type: 'hierarchy',
              color: '#6b7280'
            });

            // Add dependency edges
            task.dependencies.forEach(depId => {
              if (newNodes.some(n => n.id === depId)) {
                newEdges.push({
                  id: `${depId}-${task.id}`,
                  source: depId,
                  target: task.id,
                  type: 'dependency',
                  color: '#ef4444'
                });
              }
            });

            // Add subtask nodes
            task.subtasks.forEach((subtask, subtaskIndex) => {
              const subtaskX = taskX + (subtaskIndex - (task.subtasks.length - 1) / 2) * 30;
              const subtaskY = taskY + 80;

              const subtaskNode: GraphNode = {
                id: subtask.id,
                label: subtask.title,
                type: 'subtask',
                x: subtaskX,
                y: subtaskY,
                color: subtask.completed ? '#10b981' : '#6b7280',
                size: 15,
                status: subtask.completed ? 'Complete' : 'Not Started',
                data: subtask
              };
              newNodes.push(subtaskNode);

              // Add edge from task to subtask
              newEdges.push({
                id: `${task.id}-${subtask.id}`,
                source: task.id,
                target: subtask.id,
                type: 'hierarchy',
                color: '#6b7280'
              });
            });
          });
        });

        yOffset += 250;
      });
    } else if (activeView === 'version') {
      // Generate version history visualization
      const versions = [
        { id: 'v1.0.0', label: 'v1.0.0\nInitial Release', x: 100, y: 100 },
        { id: 'v1.1.0', label: 'v1.1.0\nAuth System', x: 250, y: 100 },
        { id: 'v1.2.0', label: 'v1.2.0\nData Viz', x: 400, y: 100 },
        { id: 'v2.0.0', label: 'v2.0.0\nMajor Update', x: 550, y: 100 }
      ];

      versions.forEach(version => {
        newNodes.push({
          id: version.id,
          label: version.label,
          type: 'prd',
          x: version.x,
          y: version.y,
          color: '#8b5cf6',
          size: 50,
          status: 'complete',
          data: version
        });
      });

      // Add version edges
      for (let i = 0; i < versions.length - 1; i++) {
        newEdges.push({
          id: `${versions[i].id}-${versions[i + 1].id}`,
          source: versions[i].id,
          target: versions[i + 1].id,
          type: 'hierarchy',
          color: '#8b5cf6'
        });
      }
    } else if (activeView === 'test') {
      // Generate test results visualization
      const testSuites = [
        { id: 'unit-tests', label: 'Unit Tests\n89% Pass', x: 150, y: 150, color: '#10b981' },
        { id: 'integration-tests', label: 'Integration\n76% Pass', x: 350, y: 150, color: '#f59e0b' },
        { id: 'e2e-tests', label: 'E2E Tests\n92% Pass', x: 550, y: 150, color: '#10b981' },
        { id: 'performance-tests', label: 'Performance\n68% Pass', x: 250, y: 300, color: '#ef4444' },
        { id: 'security-tests', label: 'Security\n95% Pass', x: 450, y: 300, color: '#10b981' }
      ];

      testSuites.forEach(test => {
        newNodes.push({
          id: test.id,
          label: test.label,
          type: 'task',
          x: test.x,
          y: test.y,
          color: test.color,
          size: 45,
          status: 'active',
          data: test
        });
      });
    } else if (activeView === 'agents') {
      // Generate agent assignment visualization
      const agents = [
        { id: 'tech-architect', label: 'Technical\nArchitect', x: 200, y: 100, tasks: 8 },
        { id: 'frontend-dev', label: 'Frontend\nDeveloper', x: 400, y: 100, tasks: 12 },
        { id: 'backend-dev', label: 'Backend\nDeveloper', x: 600, y: 100, tasks: 10 },
        { id: 'devops', label: 'DevOps\nEngineer', x: 300, y: 250, tasks: 6 },
        { id: 'qa', label: 'QA\nEngineer', x: 500, y: 250, tasks: 9 }
      ];

      agents.forEach(agent => {
        newNodes.push({
          id: agent.id,
          label: agent.label,
          type: 'prd',
          x: agent.x,
          y: agent.y,
          color: '#06b6d4',
          size: 50,
          status: 'active',
          data: { ...agent, workload: `${agent.tasks} tasks` }
        });
      });

      // Add some task assignments
      const taskAssignments = [
        { agent: 'tech-architect', task: 'Architecture Design', x: 200, y: 200 },
        { agent: 'frontend-dev', task: 'UI Components', x: 400, y: 200 },
        { agent: 'backend-dev', task: 'API Development', x: 600, y: 200 }
      ];

      taskAssignments.forEach((assignment, index) => {
        const taskNode: GraphNode = {
          id: `task-${index}`,
          label: assignment.task,
          type: 'task',
          x: assignment.x,
          y: assignment.y,
          color: '#f59e0b',
          size: 30,
          status: 'in-progress',
          data: assignment
        };
        newNodes.push(taskNode);

        newEdges.push({
          id: `${assignment.agent}-task-${index}`,
          source: assignment.agent,
          target: `task-${index}`,
          type: 'hierarchy',
          color: '#06b6d4'
        });
      });
    }

    setNodes(newNodes);
    setEdges(newEdges);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Complete': return '#10b981';
      case 'In Progress': return '#f59e0b';
      case 'Review': return '#8b5cf6';
      case 'Blocked': return '#ef4444';
      case 'Not Started': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const handleNodeClick = (node: GraphNode) => {
    setSelectedNode(node);
  };

  const getViewStats = () => {
    switch (activeView) {
      case 'project':
        return [
          { label: 'PRDs', value: prds.length, icon: Network, color: 'blue' },
          { label: 'Deliverables', value: deliverables.length, icon: Layers, color: 'green' },
          { label: 'Total Tasks', value: deliverables.reduce((sum, d) => sum + d.tasks.length, 0), icon: CheckCircle, color: 'purple' },
          { label: 'Dependencies', value: edges.filter(e => e.type === 'dependency').length, icon: GitBranch, color: 'orange' }
        ];
      case 'version':
        return [
          { label: 'Versions', value: 4, icon: GitBranch, color: 'blue' },
          { label: 'Commits', value: 23, icon: Activity, color: 'green' },
          { label: 'Branches', value: 3, icon: GitBranch, color: 'purple' },
          { label: 'Contributors', value: 5, icon: Users, color: 'orange' }
        ];
      case 'test':
        return [
          { label: 'Test Suites', value: 5, icon: TestTube, color: 'blue' },
          { label: 'Passed', value: 234, icon: CheckCircle, color: 'green' },
          { label: 'Failed', value: 12, icon: AlertTriangle, color: 'red' },
          { label: 'Coverage', value: '84%', icon: BarChart3, color: 'purple' }
        ];
      case 'agents':
        return [
          { label: 'Team Members', value: 5, icon: Users, color: 'blue' },
          { label: 'Active Tasks', value: 45, icon: Activity, color: 'green' },
          { label: 'Workload', value: '78%', icon: TrendingUp, color: 'orange' },
          { label: 'Efficiency', value: '92%', icon: Zap, color: 'purple' }
        ];
      default:
        return [];
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

  const filteredNodes = nodes.filter(node => {
    if (!filters.showCompleted && node.status === 'Complete') return false;
    if (!filters.showInProgress && node.status === 'In Progress') return false;
    if (!filters.showNotStarted && node.status === 'Not Started') return false;
    return true;
  });

  const filteredEdges = edges.filter(edge => {
    if (!filters.showDependencies && edge.type === 'dependency') return false;
    return filteredNodes.some(n => n.id === edge.source) && filteredNodes.some(n => n.id === edge.target);
  });

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
          {getViewStats().map((stat, index) => (
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

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Graph Visualization */}
        <div className="flex-1 relative">
          {/* Toolbar */}
          <div className="absolute top-4 left-4 z-10 flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${
                showFilters 
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              } shadow-lg border border-gray-200 dark:border-gray-700`}
            >
              <Filter className="h-4 w-4" />
            </button>
            <button className="p-2 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors shadow-lg border border-gray-200 dark:border-gray-700">
              <Download className="h-4 w-4" />
            </button>
            <button 
              onClick={generateGraphData}
              className="p-2 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors shadow-lg border border-gray-200 dark:border-gray-700"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="absolute top-4 left-20 z-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 w-64">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Filters</h3>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.showCompleted}
                    onChange={(e) => setFilters({...filters, showCompleted: e.target.checked})}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Show Completed</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.showInProgress}
                    onChange={(e) => setFilters({...filters, showInProgress: e.target.checked})}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Show In Progress</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.showNotStarted}
                    onChange={(e) => setFilters({...filters, showNotStarted: e.target.checked})}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Show Not Started</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.showDependencies}
                    onChange={(e) => setFilters({...filters, showDependencies: e.target.checked})}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Show Dependencies</span>
                </label>
              </div>
            </div>
          )}

          {/* SVG Graph */}
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            className="bg-gray-50 dark:bg-gray-900"
            viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
          >
            {/* Define arrow markers for edges */}
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill="#6b7280"
                />
              </marker>
              <marker
                id="arrowhead-dependency"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill="#ef4444"
                />
              </marker>
            </defs>

            {/* Render edges */}
            {filteredEdges.map(edge => {
              const sourceNode = filteredNodes.find(n => n.id === edge.source);
              const targetNode = filteredNodes.find(n => n.id === edge.target);
              
              if (!sourceNode || !targetNode) return null;

              return (
                <line
                  key={edge.id}
                  x1={sourceNode.x}
                  y1={sourceNode.y}
                  x2={targetNode.x}
                  y2={targetNode.y}
                  stroke={edge.color}
                  strokeWidth={edge.type === 'dependency' ? 2 : 1}
                  strokeDasharray={edge.type === 'dependency' ? '5,5' : 'none'}
                  markerEnd={edge.type === 'dependency' ? 'url(#arrowhead-dependency)' : 'url(#arrowhead)'}
                  opacity={0.7}
                />
              );
            })}

            {/* Render nodes */}
            {filteredNodes.map(node => (
              <g key={node.id}>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.size / 2}
                  fill={node.color}
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => handleNodeClick(node)}
                />
                <text
                  x={node.x}
                  y={node.y + node.size / 2 + 15}
                  textAnchor="middle"
                  className="text-xs fill-gray-700 dark:fill-gray-300 pointer-events-none"
                  style={{ fontSize: '10px' }}
                >
                  {node.label.split('\n').map((line, index) => (
                    <tspan key={index} x={node.x} dy={index === 0 ? 0 : 12}>
                      {line}
                    </tspan>
                  ))}
                </text>
              </g>
            ))}
          </svg>

          {/* Legend */}
          <div className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Legend</h4>
            <div className="space-y-2 text-sm">
              {activeView === 'project' && (
                <>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                    <span className="text-gray-700 dark:text-gray-300">PRD</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-gray-700 dark:text-gray-300">Deliverable</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                    <span className="text-gray-700 dark:text-gray-300">Task</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-1 h-1 rounded-full bg-gray-500"></div>
                    <span className="text-gray-700 dark:text-gray-300">Subtask</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-0.5 bg-red-500" style={{ borderStyle: 'dashed' }}></div>
                    <span className="text-gray-700 dark:text-gray-300">Dependency</span>
                  </div>
                </>
              )}
              {activeView === 'version' && (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full bg-purple-500"></div>
                  <span className="text-gray-700 dark:text-gray-300">Version</span>
                </div>
              )}
              {activeView === 'test' && (
                <>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-full bg-green-500"></div>
                    <span className="text-gray-700 dark:text-gray-300">Passing</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-full bg-red-500"></div>
                    <span className="text-gray-700 dark:text-gray-300">Failing</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                    <span className="text-gray-700 dark:text-gray-300">Warning</span>
                  </div>
                </>
              )}
              {activeView === 'agents' && (
                <>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-full bg-cyan-500"></div>
                    <span className="text-gray-700 dark:text-gray-300">Agent</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span className="text-gray-700 dark:text-gray-300">Assigned Task</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Node Details Panel */}
        {selectedNode && (
          <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Node Details</h3>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
                <p className="text-gray-900 dark:text-white capitalize">{selectedNode.type}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Label</label>
                <p className="text-gray-900 dark:text-white">{selectedNode.label}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                  selectedNode.status === 'Complete' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                  selectedNode.status === 'In Progress' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                  {selectedNode.status}
                </span>
              </div>

              {selectedNode.data && (
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Additional Info</label>
                  <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                      {JSON.stringify(selectedNode.data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-6 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center space-x-4">
          <span>Nodes: {filteredNodes.length}</span>
          <span>Edges: {filteredEdges.length}</span>
          <span>View: {activeView}</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>Live</span>
        </div>
      </div>
    </div>
  );
};

export default GraphDashboard;