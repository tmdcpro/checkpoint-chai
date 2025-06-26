import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Zap, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  TrendingUp,
  MessageSquare,
  Lightbulb,
  Target,
  BarChart3
} from 'lucide-react';
import { mcpTaskmaster } from '../services/MCPTaskmasterService';
import { PRD } from '../types';

interface MCPTaskmasterPanelProps {
  prds: PRD[];
  onTaskUpdate?: (taskId: string, updates: any) => void;
}

const MCPTaskmasterPanel: React.FC<MCPTaskmasterPanelProps> = ({ prds, onTaskUpdate }) => {
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [progress, setProgress] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadProjectProgress = async (projectId: string) => {
    if (!projectId) return;
    
    setIsLoading(true);
    try {
      const progressData = await mcpTaskmaster.getProjectProgress({ projectId });
      const recsData = await mcpTaskmaster.generateTaskRecommendations({ projectId });
      
      setProgress(progressData);
      setRecommendations(recsData.recommendations);
    } catch (error) {
      console.error('Failed to load project data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProject) {
      loadProjectProgress(selectedProject);
    }
  }, [selectedProject]);

  const handleTaskStatusUpdate = async (taskId: string, status: string, notes?: string) => {
    try {
      const result = await mcpTaskmaster.updateTaskStatus({ taskId, status: status as any, notes });
      if (result.success && onTaskUpdate) {
        onTaskUpdate(taskId, { status });
      }
      // Refresh progress after update
      if (selectedProject) {
        loadProjectProgress(selectedProject);
      }
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'low': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'priority': return <Target className="h-4 w-4" />;
      case 'dependency': return <Zap className="h-4 w-4" />;
      case 'resource': return <Clock className="h-4 w-4" />;
      case 'risk': return <AlertTriangle className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Brain className="h-6 w-6 text-blue-500" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">MCP Taskmaster</h3>
        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full">
          AI-Powered Task Intelligence
        </span>
      </div>

      {/* Project Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select Project for Analysis
        </label>
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
        >
          <option value="">Choose a project...</option>
          {prds.map(prd => (
            <option key={prd.id} value={prd.id}>{prd.title}</option>
          ))}
        </select>
      </div>

      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Analyzing project data...</p>
        </div>
      )}

      {progress && !isLoading && (
        <div className="space-y-6">
          {/* Progress Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {progress.progressPercentage}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Complete</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {progress.completedTasks}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {progress.inProgressTasks}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">In Progress</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {progress.estimatedHoursRemaining}h
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Remaining</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Overall Progress
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {progress.completedTasks} of {progress.totalTasks} tasks
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progress.progressPercentage}%` }}
              />
            </div>
          </div>

          {/* AI Recommendations */}
          {recommendations.length > 0 && (
            <div>
              <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Lightbulb className="h-5 w-5 mr-2 text-yellow-500" />
                AI Recommendations ({recommendations.length})
              </h4>
              <div className="space-y-3">
                {recommendations.map((rec, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getRecommendationIcon(rec.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                            {rec.type} Alert
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(rec.severity)}`}>
                            {rec.severity}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {rec.message}
                        </p>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Affects {rec.taskIds.length} task{rec.taskIds.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
              Quick Actions
            </h4>
            <div className="flex flex-wrap gap-2">
              <button className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
                <TrendingUp className="h-4 w-4" />
                <span>Generate Report</span>
              </button>
              <button className="flex items-center space-x-2 px-3 py-2 text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors">
                <CheckCircle className="h-4 w-4" />
                <span>Mark Milestone</span>
              </button>
              <button className="flex items-center space-x-2 px-3 py-2 text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors">
                <MessageSquare className="h-4 w-4" />
                <span>AI Chat</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {!selectedProject && !isLoading && (
        <div className="text-center py-8">
          <Brain className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400">
            Select a project to see AI-powered insights and recommendations
          </p>
        </div>
      )}
    </div>
  );
};

export default MCPTaskmasterPanel;