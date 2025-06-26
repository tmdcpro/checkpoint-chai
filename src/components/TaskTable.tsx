import React, { useState } from 'react';
import { 
  MoreHorizontal, 
  Calendar, 
  MessageSquare, 
  Paperclip,
  Flag,
  Flame,
  Edit3,
  UserPlus,
  CheckCircle2,
  Clock,
  Target,
  BarChart3,
  Filter,
  SortAsc,
  Eye,
  Play,
  Pause,
  Square,
  Brain,
  User,
  Zap
} from 'lucide-react';
import { Task, Deliverable } from '../types';
import MCPTaskmasterPanel from './MCPTaskmasterPanel';
import LeanStartupSprintManager from './LeanStartupSprintManager';

interface TaskTableProps {
  deliverables: Deliverable[];
  prds: any[];
  onTaskUpdate: (deliverableId: string, taskId: string, updates: Partial<Task>) => void;
}

const TaskTable: React.FC<TaskTableProps> = ({ deliverables, prds, onTaskUpdate }) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'priority' | 'dueDate' | 'status'>('priority');
  const [showMCPPanel, setShowMCPPanel] = useState(true);
  const [showLeanSprint, setShowLeanSprint] = useState(false);
  const [selectedDeliverable, setSelectedDeliverable] = useState<Deliverable | null>(null);

  // Sample manual tasks for demonstration
  const manualTasks: Task[] = [
    {
      id: 'manual-1',
      title: 'Design new landing page hero section',
      description: 'Create an engaging hero section for the new landing page',
      instructions: ['Research competitor designs', 'Create wireframes', 'Design high-fidelity mockups'],
      estimatedHours: 8,
      priority: 'High',
      status: 'In Progress',
      dependencies: [],
      subtasks: [
        { id: 'st1', title: 'Research phase', description: 'Analyze competitor designs', completed: true, estimatedMinutes: 120 },
        { id: 'st2', title: 'Wireframing', description: 'Create low-fi wireframes', completed: false, estimatedMinutes: 180 }
      ],
      testingCriteria: {
        unitTests: [],
        integrationTests: [],
        userAcceptanceTests: ['Design approved by stakeholders'],
        performanceTests: [],
        securityTests: [],
        accessibilityTests: ['Color contrast meets WCAG standards'],
        manualTests: ['Design review completed']
      },
      tools: [
        { name: 'Figma', purpose: 'Design tool', implementation: 'Create mockups', required: true }
      ]
    },
    {
      id: 'manual-2',
      title: 'Set up CI/CD pipeline',
      description: 'Configure automated deployment pipeline',
      instructions: ['Set up GitHub Actions', 'Configure deployment environments', 'Test pipeline'],
      estimatedHours: 12,
      priority: 'Medium',
      status: 'Not Started',
      dependencies: [],
      subtasks: [
        { id: 'st3', title: 'GitHub Actions setup', description: 'Configure workflow files', completed: false, estimatedMinutes: 240 },
        { id: 'st4', title: 'Environment config', description: 'Set up staging and prod', completed: false, estimatedMinutes: 180 }
      ],
      testingCriteria: {
        unitTests: [],
        integrationTests: ['Pipeline deploys successfully'],
        userAcceptanceTests: [],
        performanceTests: [],
        securityTests: ['Secrets properly configured'],
        accessibilityTests: [],
        manualTests: ['Manual deployment test']
      },
      tools: [
        { name: 'GitHub Actions', purpose: 'CI/CD', implementation: 'Workflow automation', required: true }
      ]
    }
  ];

  // Flatten all tasks from deliverables and add manual tasks
  const aiTasks = deliverables.flatMap(deliverable => 
    deliverable.tasks.map(task => ({ 
      ...task, 
      deliverableId: deliverable.id, 
      deliverableTitle: deliverable.title,
      source: 'ai' as const
    }))
  );

  const allTasks = [
    ...aiTasks,
    ...manualTasks.map(task => ({ ...task, source: 'manual' as const }))
  ];

  // Filter and sort tasks
  const filteredTasks = allTasks
    .filter(task => {
      if (filterStatus !== 'all' && task.status !== filterStatus) return false;
      if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
      if (filterSource !== 'all' && task.source !== filterSource) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Progress':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300';
      case 'Complete':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'Review':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      case 'Blocked':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      case 'Not Started':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return <Flag className="h-4 w-4 text-red-600" />;
      case 'High':
        return <Flag className="h-4 w-4 text-red-500" />;
      case 'Medium':
        return <Flame className="h-4 w-4 text-orange-500" />;
      case 'Low':
        return <Flag className="h-4 w-4 text-gray-400" />;
      default:
        return null;
    }
  };

  const handleStatusChange = (task: any, newStatus: string) => {
    if (task.source === 'ai' && task.deliverableId) {
      onTaskUpdate(task.deliverableId, task.id, { status: newStatus as any });
    }
    // For manual tasks, we'd need a separate handler
  };

  const getCompletionPercentage = (task: Task): number => {
    if (task.subtasks.length === 0) return 0;
    const completedSubtasks = task.subtasks.filter(st => st.completed).length;
    return Math.round((completedSubtasks / task.subtasks.length) * 100);
  };

  const handleLeanSprintStart = (deliverable: Deliverable) => {
    setSelectedDeliverable(deliverable);
    setShowLeanSprint(true);
  };

  const TaskDetailModal = ({ task, onClose }: { task: Task; onClose: () => void }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{task.title}</h2>
            <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
              (task as any).source === 'ai' 
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
            }`}>
              {(task as any).source === 'ai' ? (
                <>
                  <Brain className="h-3 w-3 mr-1" />
                  AI Generated
                </>
              ) : (
                <>
                  <User className="h-3 w-3 mr-1" />
                  Manual
                </>
              )}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {(task as any).deliverableId && (
              <button
                onClick={() => {
                  const deliverable = deliverables.find(d => d.id === (task as any).deliverableId);
                  if (deliverable) {
                    handleLeanSprintStart(deliverable);
                  }
                }}
                className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
              >
                <Zap className="h-3 w-3" />
                <span>Lean Sprint</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              ×
            </button>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] space-y-6">
          {/* Task Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Target className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</span>
              </div>
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                {task.status}
              </span>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Flag className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Priority</span>
              </div>
              <div className="flex items-center space-x-2">
                {getPriorityIcon(task.priority)}
                <span className="text-sm text-gray-900 dark:text-white">{task.priority}</span>
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Estimated</span>
              </div>
              <span className="text-sm text-gray-900 dark:text-white">{task.estimatedHours} hours</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Description</h3>
            <p className="text-gray-600 dark:text-gray-400">{task.description}</p>
          </div>

          {/* Instructions */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Instructions</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-400">
              {task.instructions.map((instruction, index) => (
                <li key={index}>{instruction}</li>
              ))}
            </ol>
          </div>

          {/* Subtasks */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Subtasks ({task.subtasks.filter(st => st.completed).length}/{task.subtasks.length})
            </h3>
            <div className="space-y-2">
              {task.subtasks.map((subtask) => (
                <div key={subtask.id} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <input
                    type="checkbox"
                    checked={subtask.completed}
                    onChange={(e) => {
                      // Handle subtask completion
                      const updatedSubtasks = task.subtasks.map(st =>
                        st.id === subtask.id ? { ...st, completed: e.target.checked } : st
                      );
                      if ((task as any).source === 'ai' && (task as any).deliverableId) {
                        onTaskUpdate(
                          (task as any).deliverableId,
                          task.id,
                          { subtasks: updatedSubtasks }
                        );
                      }
                    }}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  <div className="flex-1">
                    <span className={`text-sm ${subtask.completed ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                      {subtask.title}
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{subtask.description}</p>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{subtask.estimatedMinutes}min</span>
                </div>
              ))}
            </div>
          </div>

          {/* Testing Criteria */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Testing Criteria</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {task.testingCriteria.userAcceptanceTests.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">User Acceptance Tests</h4>
                  <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    {task.testingCriteria.userAcceptanceTests.map((test, index) => (
                      <li key={index}>{test}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {task.testingCriteria.manualTests.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Manual Tests</h4>
                  <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    {task.testingCriteria.manualTests.map((test, index) => (
                      <li key={index}>{test}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Tools */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Required Tools</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {task.tools.map((tool, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900 dark:text-white">{tool.name}</span>
                    {tool.required && (
                      <span className="px-2 py-1 text-xs bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded-full">
                        Required
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{tool.purpose}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{tool.implementation}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex-1 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">All Tasks</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage tasks with AI insights and Lean Startup methodology
            </p>
          </div>
          
          {/* Summary Stats */}
          <div className="flex items-center space-x-6 text-sm">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{allTasks.length}</div>
              <div className="text-gray-600 dark:text-gray-400">Total Tasks</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                {allTasks.filter(t => t.status === 'Complete').length}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {allTasks.filter(t => t.status === 'In Progress').length}
              </div>
              <div className="text-gray-600 dark:text-gray-400">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-500 dark:text-blue-400">
                {aiTasks.length}
              </div>
              <div className="text-gray-600 dark:text-gray-400">AI Generated</div>
            </div>
          </div>
        </div>

        {/* Filters and Sort */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Review">Review</option>
              <option value="Complete">Complete</option>
              <option value="Blocked">Blocked</option>
            </select>
            
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
            >
              <option value="all">All Priority</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
            >
              <option value="all">All Sources</option>
              <option value="ai">AI Generated</option>
              <option value="manual">Manual</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
            >
              <option value="priority">Sort by Priority</option>
              <option value="dueDate">Sort by Due Date</option>
              <option value="status">Sort by Status</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowMCPPanel(!showMCPPanel)}
              className={`flex items-center space-x-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                showMCPPanel 
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Brain className="h-4 w-4" />
              <span>AI Insights</span>
            </button>
            
            {deliverables.length > 0 && (
              <button
                onClick={() => handleLeanSprintStart(deliverables[0])}
                className="flex items-center space-x-2 px-3 py-2 text-sm bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
              >
                <Zap className="h-4 w-4" />
                <span>Lean Sprint</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Task Table */}
        <div className={`${showMCPPanel ? 'flex-1' : 'w-full'} overflow-x-auto`}>
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0">
              <tr>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-900 dark:text-white w-8">
                  <input type="checkbox" className="rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700" />
                </th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-900 dark:text-white">
                  Task Name
                </th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-900 dark:text-white">
                  Source
                </th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-900 dark:text-white">
                  Status
                </th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-900 dark:text-white">
                  Priority
                </th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-900 dark:text-white">
                  Progress
                </th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-900 dark:text-white">
                  Estimated
                </th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-900 dark:text-white">
                  Tools
                </th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-900 dark:text-white w-8">
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task, index) => (
                <tr 
                  key={`${task.source}-${task.id}`}
                  className={`group hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-700 transition-colors duration-150 ${
                    index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'
                  }`}
                >
                  <td className="py-4 px-6">
                    <input type="checkbox" className="rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700" />
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{task.title}</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">{task.description}</p>
                      </div>
                      <button
                        onClick={() => setSelectedTask(task)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        <Eye className="h-3 w-3" />
                      </button>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                      task.source === 'ai' 
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {task.source === 'ai' ? (
                        <>
                          <Brain className="h-3 w-3 mr-1" />
                          AI
                        </>
                      ) : (
                        <>
                          <User className="h-3 w-3 mr-1" />
                          Manual
                        </>
                      )}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task, e.target.value)}
                      className={`text-xs font-medium rounded-full border-0 focus:ring-2 focus:ring-blue-500 ${getStatusColor(task.status)}`}
                    >
                      <option value="Not Started">Not Started</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Review">Review</option>
                      <option value="Complete">Complete</option>
                      <option value="Blocked">Blocked</option>
                    </select>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center">
                      {getPriorityIcon(task.priority)}
                      <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">{task.priority}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${getCompletionPercentage(task)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {getCompletionPercentage(task)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <span className="text-sm text-gray-900 dark:text-white">{task.estimatedHours}h</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-1">
                      {task.tools.slice(0, 2).map((tool, toolIndex) => (
                        <span
                          key={toolIndex}
                          className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full"
                          title={tool.name}
                        >
                          {tool.name.substring(0, 3)}
                        </span>
                      ))}
                      {task.tools.length > 2 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          +{task.tools.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* MCP Taskmaster Panel */}
        {showMCPPanel && (
          <div className="w-96 border-l border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
            <MCPTaskmasterPanel 
              prds={prds} 
              onTaskUpdate={(taskId, updates) => {
                // Handle task updates from MCP panel
                console.log('MCP task update:', taskId, updates);
              }}
            />
          </div>
        )}
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}

      {/* Lean Startup Sprint Manager */}
      {showLeanSprint && selectedDeliverable && (
        <LeanStartupSprintManager
          deliverable={selectedDeliverable}
          prd={prds.find(p => p.deliverables?.some((d: any) => d.id === selectedDeliverable.id)) || prds[0]}
          onClose={() => {
            setShowLeanSprint(false);
            setSelectedDeliverable(null);
          }}
          onDeliverablesUpdated={(updatedDeliverables) => {
            // Handle deliverable updates
            console.log('Deliverables updated:', updatedDeliverables);
          }}
        />
      )}
    </div>
  );
};

export default TaskTable;