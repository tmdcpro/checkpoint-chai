import React, { useEffect, useRef, useState } from 'react';
import { 
  Network, 
  Settings, 
  Download, 
  Upload, 
  Filter, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  Play,
  Pause,
  BarChart3,
  GitBranch,
  Eye,
  EyeOff,
  Layers,
  Search
} from 'lucide-react';
import GraphVisualizationEngine from '../services/GraphVisualizationEngine';
import { 
  GraphNode, 
  GraphEdge, 
  GraphData, 
  GraphConfig, 
  GraphView, 
  GraphFilter,
  GraphAnalytics,
  GraphEvent
} from '../types/graph';
import { PRD, Deliverable, Task } from '../types';

interface GraphVisualizationProps {
  prds: PRD[];
  deliverables: Deliverable[];
  className?: string;
  config?: Partial<GraphConfig>;
  onNodeClick?: (node: GraphNode) => void;
  onEdgeClick?: (edge: GraphEdge) => void;
}

const GraphVisualization: React.FC<GraphVisualizationProps> = ({
  prds,
  deliverables,
  className = '',
  config = {},
  onNodeClick,
  onEdgeClick
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GraphVisualizationEngine | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [analytics, setAnalytics] = useState<GraphAnalytics | null>(null);
  const [currentView, setCurrentView] = useState<string>('default');
  const [availableViews, setAvailableViews] = useState<GraphView[]>([]);
  const [filters, setFilters] = useState<GraphFilter[]>([]);
  const [isRealtime, setIsRealtime] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Default configuration
  const defaultConfig: GraphConfig = {
    engine: 'cytoscape',
    layout: 'hierarchical',
    interactive: true,
    realtime: false,
    maxNodes: 100000,
    performance: {
      enableVirtualization: true,
      batchSize: 1000,
      renderThreshold: 10000
    },
    styling: {
      theme: 'light',
      nodeSize: 'medium',
      edgeWidth: 'medium',
      animations: true
    },
    ...config
  };

  // Initialize graph engine
  useEffect(() => {
    if (!containerRef.current || isInitialized) return;

    const initializeGraph = async () => {
      try {
        const engine = new GraphVisualizationEngine(defaultConfig);
        engineRef.current = engine;

        // Convert project data to graph format
        const graphData = convertProjectDataToGraph(prds, deliverables);
        
        // Add data to engine
        engine.addNodes(graphData.nodes);
        engine.addEdges(graphData.edges);

        // Initialize visualization
        await engine.initialize(containerRef.current!);

        // Setup event listeners
        engine.addEventListener('node-click', handleNodeClick);
        engine.addEventListener('edge-click', handleEdgeClick);
        engine.addEventListener('data-update', handleDataUpdate);

        // Get initial analytics
        const initialAnalytics = engine.getAnalytics();
        setAnalytics(initialAnalytics);

        // Setup default views and filters
        setupDefaultViews(engine);
        setupDefaultFilters();

        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize graph visualization:', error);
      }
    };

    initializeGraph();

    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
    };
  }, []);

  // Update graph when data changes
  useEffect(() => {
    if (!engineRef.current || !isInitialized) return;

    const graphData = convertProjectDataToGraph(prds, deliverables);
    
    // Clear existing data and add new data
    engineRef.current.removeNodes(engineRef.current.getAnalytics().criticalPath || []);
    engineRef.current.addNodes(graphData.nodes);
    engineRef.current.addEdges(graphData.edges);

    // Update analytics
    const newAnalytics = engineRef.current.getAnalytics();
    setAnalytics(newAnalytics);
  }, [prds, deliverables, isInitialized]);

  const convertProjectDataToGraph = (prds: PRD[], deliverables: Deliverable[]): GraphData => {
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
            .reduce((sum, d) => sum + d.estimatedHours, 0)
        }
      });
    });

    // Add deliverable nodes and edges
    deliverables.forEach(deliverable => {
      nodes.push({
        id: deliverable.id,
        label: deliverable.title,
        type: 'deliverable',
        data: deliverable,
        status: deliverable.status === 'Complete' ? 'complete' : 
               deliverable.status === 'In Progress' ? 'in-progress' :
               deliverable.status === 'Blocked' ? 'blocked' : 'not-started',
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          priority: deliverable.priority.toLowerCase() as any,
          estimatedHours: deliverable.estimatedHours,
          progress: deliverable.status === 'Complete' ? 100 : 
                   deliverable.status === 'In Progress' ? 50 : 0
        }
      });

      // Find parent PRD
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
            createdAt: new Date().toISOString()
          }
        });
      }

      // Add task nodes and edges
      deliverable.tasks.forEach(task => {
        nodes.push({
          id: task.id,
          label: task.title,
          type: 'task',
          data: task,
          status: task.status === 'Complete' ? 'complete' : 
                 task.status === 'In Progress' ? 'in-progress' :
                 task.status === 'Blocked' ? 'blocked' : 'not-started',
          metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            priority: task.priority.toLowerCase() as any,
            estimatedHours: task.estimatedHours,
            progress: task.status === 'Complete' ? 100 : 
                     task.status === 'In Progress' ? 50 : 0
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
            createdAt: new Date().toISOString()
          }
        });

        // Add dependency edges
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
              createdAt: new Date().toISOString()
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
              progress: subtask.completed ? 100 : 0
            }
          });

          edges.push({
            id: `${task.id}-${subtask.id}`,
            source: task.id,
            target: subtask.id,
            type: 'hierarchy',
            label: 'contains',
            metadata: {
              createdAt: new Date().toISOString()
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '1.0.0',
        layout: defaultConfig.layout
      }
    };
  };

  const setupDefaultViews = (engine: GraphVisualizationEngine) => {
    const views: GraphView[] = [
      {
        id: 'default',
        name: 'Default View',
        description: 'Standard hierarchical view of all project elements',
        layout: 'hierarchical',
        filters: [],
        zoom: 1,
        center: { x: 0, y: 0 }
      },
      {
        id: 'dependencies',
        name: 'Dependencies View',
        description: 'Focus on task dependencies and critical path',
        layout: 'dagre',
        filters: ['show-dependencies'],
        zoom: 1,
        center: { x: 0, y: 0 }
      },
      {
        id: 'progress',
        name: 'Progress View',
        description: 'Visualize project progress and completion status',
        layout: 'force',
        filters: ['color-by-status'],
        zoom: 1,
        center: { x: 0, y: 0 }
      },
      {
        id: 'agents',
        name: 'Team View',
        description: 'Show task assignments and team structure',
        layout: 'circular',
        filters: ['show-assignments'],
        zoom: 1,
        center: { x: 0, y: 0 }
      }
    ];

    setAvailableViews(views);
  };

  const setupDefaultFilters = () => {
    const defaultFilters: GraphFilter[] = [
      {
        id: 'show-dependencies',
        name: 'Show Dependencies Only',
        type: 'edge',
        criteria: [
          { property: 'type', operator: 'equals', value: 'dependency' }
        ],
        active: false
      },
      {
        id: 'color-by-status',
        name: 'Color by Status',
        type: 'node',
        criteria: [],
        active: false
      },
      {
        id: 'show-assignments',
        name: 'Show Assignments',
        type: 'both',
        criteria: [
          { property: 'type', operator: 'in', value: ['agent', 'task'] }
        ],
        active: false
      },
      {
        id: 'hide-completed',
        name: 'Hide Completed',
        type: 'node',
        criteria: [
          { property: 'status', operator: 'not-in', value: ['complete'] }
        ],
        active: false
      },
      {
        id: 'high-priority-only',
        name: 'High Priority Only',
        type: 'node',
        criteria: [
          { property: 'metadata.priority', operator: 'in', value: ['high', 'critical'] }
        ],
        active: false
      }
    ];

    setFilters(defaultFilters);
  };

  const handleNodeClick = (event: GraphEvent) => {
    const nodeData = event.data;
    setSelectedNodes([nodeData.id]);
    
    if (onNodeClick) {
      onNodeClick(nodeData);
    }
  };

  const handleEdgeClick = (event: GraphEvent) => {
    const edgeData = event.data;
    
    if (onEdgeClick) {
      onEdgeClick(edgeData);
    }
  };

  const handleDataUpdate = (event: GraphEvent) => {
    if (engineRef.current) {
      const newAnalytics = engineRef.current.getAnalytics();
      setAnalytics(newAnalytics);
    }
  };

  const handleViewChange = (viewId: string) => {
    const view = availableViews.find(v => v.id === viewId);
    if (view && engineRef.current) {
      engineRef.current.applyView(view);
      setCurrentView(viewId);
    }
  };

  const handleLayoutChange = (layout: string) => {
    if (engineRef.current) {
      engineRef.current.changeLayout(layout);
    }
  };

  const handleFilterToggle = (filterId: string) => {
    const updatedFilters = filters.map(filter => 
      filter.id === filterId 
        ? { ...filter, active: !filter.active }
        : filter
    );
    
    setFilters(updatedFilters);
    
    if (engineRef.current) {
      engineRef.current.applyFilters(updatedFilters.filter(f => f.active));
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    
    if (engineRef.current && term) {
      // Highlight matching nodes
      const matchingNodes = engineRef.current.query({
        type: 'pattern',
        parameters: { searchTerm: term }
      });
      
      setSelectedNodes(matchingNodes.map((n: any) => n.id));
    } else {
      setSelectedNodes([]);
    }
  };

  const handleExport = async (format: 'json' | 'svg' | 'png') => {
    if (!engineRef.current) return;

    try {
      const exportData = await engineRef.current.export(format);
      
      // Create download link
      const blob = typeof exportData.data === 'string' 
        ? new Blob([exportData.data], { type: 'application/json' })
        : exportData.data;
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `project-graph.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const toggleRealtime = () => {
    setIsRealtime(!isRealtime);
    // In a real implementation, this would enable/disable WebSocket connections
  };

  const resetView = () => {
    if (engineRef.current) {
      engineRef.current.changeLayout(defaultConfig.layout);
      setCurrentView('default');
      setSelectedNodes([]);
      setSearchTerm('');
    }
  };

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-gray-900 ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center space-x-4">
          {/* View Selector */}
          <select
            value={currentView}
            onChange={(e) => handleViewChange(e.target.value)}
            className="px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
          >
            {availableViews.map(view => (
              <option key={view.id} value={view.id}>{view.name}</option>
            ))}
          </select>

          {/* Layout Selector */}
          <select
            onChange={(e) => handleLayoutChange(e.target.value)}
            className="px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
          >
            <option value="hierarchical">Hierarchical</option>
            <option value="force">Force-Directed</option>
            <option value="circular">Circular</option>
            <option value="grid">Grid</option>
            <option value="dagre">Dagre</option>
          </select>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search nodes..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-64 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg transition-colors ${
              showFilters 
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Filter className="h-4 w-4" />
          </button>

          {/* Analytics Toggle */}
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className={`p-2 rounded-lg transition-colors ${
              showAnalytics 
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
          </button>

          {/* Realtime Toggle */}
          <button
            onClick={toggleRealtime}
            className={`p-2 rounded-lg transition-colors ${
              isRealtime 
                ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {isRealtime ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>

          {/* Export */}
          <div className="relative group">
            <button className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <Download className="h-4 w-4" />
            </button>
            <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button
                onClick={() => handleExport('json')}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Export JSON
              </button>
              <button
                onClick={() => handleExport('svg')}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Export SVG
              </button>
              <button
                onClick={() => handleExport('png')}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Export PNG
              </button>
            </div>
          </div>

          {/* Reset View */}
          <button
            onClick={resetView}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Filters Sidebar */}
        {showFilters && (
          <div className="w-64 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Filters</h3>
            <div className="space-y-3">
              {filters.map(filter => (
                <label key={filter.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filter.active}
                    onChange={() => handleFilterToggle(filter.id)}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    {filter.name}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Graph Container */}
        <div className="flex-1 relative">
          <div
            ref={containerRef}
            className="w-full h-full"
            style={{ minHeight: '400px' }}
          />
          
          {!isInitialized && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-800">
              <div className="text-center">
                <Network className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
                <p className="text-gray-600 dark:text-gray-400">Initializing graph visualization...</p>
              </div>
            </div>
          )}
        </div>

        {/* Analytics Sidebar */}
        {showAnalytics && analytics && (
          <div className="w-80 bg-gray-50 dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Graph Analytics</h3>
            
            <div className="space-y-4">
              {/* Basic Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-700 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {analytics.nodeCount}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Nodes</div>
                </div>
                <div className="bg-white dark:bg-gray-700 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {analytics.edgeCount}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Edges</div>
                </div>
                <div className="bg-white dark:bg-gray-700 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {analytics.clusters}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Clusters</div>
                </div>
                <div className="bg-white dark:bg-gray-700 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {analytics.averageDegree.toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Avg Degree</div>
                </div>
              </div>

              {/* Critical Path */}
              {analytics.criticalPath && analytics.criticalPath.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Critical Path</h4>
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-3">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {analytics.criticalPath.length} nodes in critical path
                    </div>
                  </div>
                </div>
              )}

              {/* Bottlenecks */}
              {analytics.bottlenecks && analytics.bottlenecks.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Bottlenecks</h4>
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-3">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {analytics.bottlenecks.length} potential bottlenecks identified
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Metrics */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Additional Metrics</h4>
                <div className="bg-white dark:bg-gray-700 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Density:</span>
                    <span className="text-gray-900 dark:text-white">{(analytics.density * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Max Degree:</span>
                    <span className="text-gray-900 dark:text-white">{analytics.metrics.maxDegree}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Isolated Nodes:</span>
                    <span className="text-gray-900 dark:text-white">{analytics.metrics.isolatedNodes}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center space-x-4">
          <span>Engine: {defaultConfig.engine}</span>
          <span>Layout: {defaultConfig.layout}</span>
          {selectedNodes.length > 0 && (
            <span>{selectedNodes.length} selected</span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {isRealtime && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live</span>
            </div>
          )}
          <span>v1.0.0</span>
        </div>
      </div>
    </div>
  );
};

export default GraphVisualization;