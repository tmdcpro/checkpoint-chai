import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal,
  Calendar,
  Users,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  Edit3,
  Trash2,
  Download,
  Zap
} from 'lucide-react';
import { PRD, Deliverable } from '../types';
import PRDImport from './PRDImport';
import TaskGenerator from './TaskGenerator';

interface PRDManagerProps {
  prds: PRD[];
  onPRDImported: (prd: PRD) => void;
  onPRDUpdated: (prd: PRD) => void;
  onTasksGenerated: (deliverables: Deliverable[]) => void;
}

const PRDManager: React.FC<PRDManagerProps> = ({ 
  prds, 
  onPRDImported, 
  onPRDUpdated, 
  onTasksGenerated 
}) => {
  const [showImport, setShowImport] = useState(false);
  const [showTaskGenerator, setShowTaskGenerator] = useState(false);
  const [selectedPRD, setSelectedPRD] = useState<PRD | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('all');

  const handlePRDImported = (prd: PRD) => {
    console.log('PRD imported in manager:', prd);
    onPRDImported(prd);
    setShowImport(false);
  };

  const handleGenerateTasks = (prd: PRD) => {
    console.log('Generating tasks for PRD:', prd);
    setSelectedPRD(prd);
    setShowTaskGenerator(true);
  };

  const handleTasksGenerated = (deliverables: Deliverable[]) => {
    console.log('Tasks generated:', deliverables);
    if (selectedPRD) {
      // Update PRD with generated deliverables
      const updatedPRD = { 
        ...selectedPRD, 
        deliverables, 
        updatedAt: new Date().toISOString() 
      };
      onPRDUpdated(updatedPRD);
      
      // Pass tasks to parent component
      onTasksGenerated(deliverables);
    }
    setShowTaskGenerator(false);
    setSelectedPRD(null);
  };

  const handleDeletePRD = (prdId: string) => {
    // We'd need a delete handler from parent
    console.log('Delete PRD:', prdId);
  };

  const handleExportPRD = (prd: PRD) => {
    const content = generateMarkdownFromPRD(prd);
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${prd.title.replace(/\s+/g, '-').toLowerCase()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateMarkdownFromPRD = (prd: PRD): string => {
    return `# ${prd.title}

## Description
${prd.description}

## Objectives
${prd.objectives.map(obj => `- ${obj}`).join('\n')}

## Scope
${prd.scope}

## Timeline
${prd.timeline}

## Stakeholders
${prd.stakeholders.map(sh => `- ${sh}`).join('\n')}

## Success Criteria
${prd.successCriteria.map(sc => `- ${sc}`).join('\n')}

## Risks
${prd.risks.map(risk => `- ${risk}`).join('\n')}

## Deliverables
${prd.deliverables.map(deliverable => `
### ${deliverable.title}
${deliverable.description}

**Priority:** ${deliverable.priority}
**Estimated Hours:** ${deliverable.estimatedHours}
**Status:** ${deliverable.status}

#### Tasks
${deliverable.tasks.map(task => `
- **${task.title}** (${task.estimatedHours}h)
  - ${task.description}
  - Status: ${task.status}
`).join('\n')}
`).join('\n')}

---
*Generated on ${new Date().toLocaleDateString()}*
`;
  };

  const filteredPRDs = prds.filter(prd => {
    const matchesSearch = prd.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prd.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    
    const hasCompletedDeliverables = prd.deliverables.some(d => d.status === 'Complete');
    const hasActiveDeliverables = prd.deliverables.some(d => d.status === 'In Progress');
    
    if (filterStatus === 'completed') return matchesSearch && hasCompletedDeliverables;
    if (filterStatus === 'active') return matchesSearch && hasActiveDeliverables;
    
    return matchesSearch;
  });

  const getPRDStatus = (prd: PRD): { status: string; color: string } => {
    if (prd.deliverables.length === 0) {
      return { status: 'Planning', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' };
    }
    
    const completedCount = prd.deliverables.filter(d => d.status === 'Complete').length;
    const inProgressCount = prd.deliverables.filter(d => d.status === 'In Progress').length;
    
    if (completedCount === prd.deliverables.length) {
      return { status: 'Completed', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' };
    } else if (inProgressCount > 0) {
      return { status: 'In Progress', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' };
    } else {
      return { status: 'Not Started', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' };
    }
  };

  console.log('Current PRDs in manager:', prds);

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Project Requirements</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage your project requirements documents and generate task breakdowns
            </p>
          </div>
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Import PRD</span>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search PRDs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* PRD List */}
        {filteredPRDs.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {prds.length === 0 ? 'No PRDs Yet' : 'No PRDs Match Your Search'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {prds.length === 0 
                ? 'Import your first Project Requirements Document to get started with AI-powered task generation.'
                : 'Try adjusting your search terms or filters.'
              }
            </p>
            {prds.length === 0 && (
              <button
                onClick={() => setShowImport(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
              >
                <Plus className="h-4 w-4" />
                <span>Import Your First PRD</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredPRDs.map((prd) => {
              const status = getPRDStatus(prd);
              return (
                <div key={prd.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{prd.title}</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">{prd.description}</p>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${status.color}`}>
                        {status.status}
                      </span>
                      <div className="relative">
                        <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Target className="h-4 w-4 text-blue-500" />
                      <span className="text-gray-600 dark:text-gray-400">{prd.objectives.length} objectives</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-green-500" />
                      <span className="text-gray-600 dark:text-gray-400">{prd.stakeholders.length} stakeholders</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      <span className="text-gray-600 dark:text-gray-400">{prd.risks.length} risks</span>
                    </div>
                  </div>

                  {/* Progress */}
                  {prd.deliverables.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-600 dark:text-gray-400">Progress</span>
                        <span className="text-gray-900 dark:text-white font-medium">
                          {prd.deliverables.filter(d => d.status === 'Complete').length}/{prd.deliverables.length} deliverables
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${(prd.deliverables.filter(d => d.status === 'Complete').length / prd.deliverables.length) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                      <Calendar className="h-3 w-3" />
                      <span>Updated {new Date(prd.updatedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleExportPRD(prd)}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        title="Export PRD"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleGenerateTasks(prd)}
                        className="flex items-center space-x-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors text-sm"
                      >
                        <Zap className="h-3 w-3" />
                        <span>Generate Tasks</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modals */}
        {showImport && (
          <PRDImport
            onPRDImported={handlePRDImported}
            onClose={() => setShowImport(false)}
          />
        )}

        {showTaskGenerator && selectedPRD && (
          <TaskGenerator
            prd={selectedPRD}
            onTasksGenerated={handleTasksGenerated}
            onClose={() => {
              setShowTaskGenerator(false);
              setSelectedPRD(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default PRDManager;