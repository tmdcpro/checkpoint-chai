export interface GraphNode {
  id: string;
  label: string;
  type: 'prd' | 'deliverable' | 'task' | 'subtask' | 'milestone' | 'dependency' | 'commit' | 'branch' | 'test' | 'agent' | 'feature';
  data: any;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  color?: string;
  status?: 'not-started' | 'in-progress' | 'review' | 'complete' | 'blocked' | 'failed';
  metadata?: {
    createdAt: string;
    updatedAt: string;
    version?: string;
    author?: string;
    tags?: string[];
    priority?: 'low' | 'medium' | 'high' | 'critical';
    estimatedHours?: number;
    actualHours?: number;
    progress?: number;
  };
  children?: string[];
  parents?: string[];
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: 'dependency' | 'hierarchy' | 'flow' | 'reference' | 'version' | 'test' | 'assignment';
  label?: string;
  weight?: number;
  color?: string;
  style?: 'solid' | 'dashed' | 'dotted';
  metadata?: {
    createdAt: string;
    strength?: number;
    bidirectional?: boolean;
    conditional?: boolean;
    description?: string;
  };
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
    version: string;
    layout?: string;
    filters?: GraphFilter[];
    views?: GraphView[];
  };
}

export interface GraphFilter {
  id: string;
  name: string;
  type: 'node' | 'edge' | 'both';
  criteria: {
    property: string;
    operator: 'equals' | 'contains' | 'greater' | 'less' | 'in' | 'not-in';
    value: any;
  }[];
  active: boolean;
}

export interface GraphView {
  id: string;
  name: string;
  description?: string;
  layout: 'hierarchical' | 'force' | 'circular' | 'grid' | 'dagre' | 'cola' | 'elk';
  filters: string[];
  zoom: number;
  center: { x: number; y: number };
  nodeStyles?: { [nodeType: string]: any };
  edgeStyles?: { [edgeType: string]: any };
}

export interface GraphConfig {
  engine: 'cytoscape' | 'd3' | 'vis' | 'custom';
  layout: string;
  interactive: boolean;
  realtime: boolean;
  maxNodes: number;
  performance: {
    enableVirtualization: boolean;
    batchSize: number;
    renderThreshold: number;
  };
  styling: {
    theme: 'light' | 'dark' | 'auto';
    nodeSize: 'small' | 'medium' | 'large';
    edgeWidth: 'thin' | 'medium' | 'thick';
    animations: boolean;
  };
}

export interface GraphEvent {
  type: 'node-click' | 'edge-click' | 'node-hover' | 'edge-hover' | 'selection-change' | 'layout-change' | 'data-update';
  data: any;
  timestamp: string;
}

export interface GraphAnalytics {
  nodeCount: number;
  edgeCount: number;
  density: number;
  averageDegree: number;
  clusters: number;
  criticalPath?: string[];
  bottlenecks?: string[];
  metrics: {
    [key: string]: number;
  };
}

export interface VersionHistory {
  id: string;
  version: string;
  timestamp: string;
  author: string;
  message: string;
  changes: {
    added: { nodes: string[]; edges: string[] };
    modified: { nodes: string[]; edges: string[] };
    removed: { nodes: string[]; edges: string[] };
  };
  parentVersion?: string;
  tags?: string[];
}

export interface GraphExport {
  format: 'json' | 'graphml' | 'gexf' | 'dot' | 'svg' | 'png' | 'pdf';
  data: string | Blob;
  metadata: {
    exportedAt: string;
    version: string;
    includeMetadata: boolean;
    includeStyles: boolean;
  };
}

export interface GraphImport {
  format: 'json' | 'graphml' | 'gexf' | 'dot' | 'csv';
  data: string | File;
  options: {
    mergeStrategy: 'replace' | 'merge' | 'append';
    validateSchema: boolean;
    preserveIds: boolean;
  };
}

export interface GraphQuery {
  type: 'path' | 'neighbors' | 'subgraph' | 'pattern' | 'analytics';
  parameters: any;
  filters?: GraphFilter[];
  limit?: number;
  offset?: number;
}

export interface GraphSubscription {
  id: string;
  query: GraphQuery;
  callback: (data: any) => void;
  active: boolean;
}

export interface GraphPlugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  hooks: {
    onNodeCreate?: (node: GraphNode) => GraphNode;
    onEdgeCreate?: (edge: GraphEdge) => GraphEdge;
    onDataUpdate?: (data: GraphData) => GraphData;
    onRender?: (container: HTMLElement) => void;
  };
  components?: {
    toolbar?: React.ComponentType<any>;
    sidebar?: React.ComponentType<any>;
    modal?: React.ComponentType<any>;
  };
}