import React, { useState } from 'react';
import { 
  Zap, 
  Target, 
  Clock, 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  Settings,
  Brain,
  BarChart3,
  FileText,
  Loader2,
  ChevronDown,
  ChevronRight,
  Download,
  Eye
} from 'lucide-react';
import { PRD, Deliverable, Task, ProjectAnalysis } from '../types';
import { PRDService, TaskGenerationResult } from '../services/PRDService';

interface TaskGeneratorProps {
  prd: PRD;
  onTasksGenerated: (deliverables: Deliverable[]) => void;
  onClose: () => void;
}

const TaskGenerator: React.FC<TaskGeneratorProps> = ({ prd, onTasksGenerated, onClose }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<TaskGenerationResult | null>(null);
  const [expandedDeliverables, setExpandedDeliverables] = useState<Set<string>>(new Set());
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [config, setConfig] = useState({
    maxDeliverablesPerObjective: 3,
    defaultTasksPerDeliverable: 3,
    includeDetailedSubtasks: true,
    generateTestingCriteria: true
  });

  const generateTasks = async () => {
    setIsGenerating(true);
    
    try {
      // Simulate AI processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const prdService = new PRDService(config);
      const generationResult = await prdService.generateTasksFromPRD(prd);
      
      setResult(generationResult);
    } catch (error) {
      console.error('Failed to generate tasks:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleDeliverable = (id: string) => {
    const newExpanded = new Set(expandedDeliverables);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedDeliverables(newExpanded);
  };

  const toggleTask = (id: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedTasks(newExpanded);
  };

  const handleAcceptTasks = () => {
    if (result) {
      onTasksGenerated(result.deliverables);
      onClose();
    }
  };

  const exportResults = () => {
    if (!result) return;
    
    const exportData = {
      prd: prd,
      analysis: result.analysis,
      deliverables: result.deliverables,
      metadata: result.metadata,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${prd.title.replace(/\s+/g, '-').toLowerCase()}-task-breakdown.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">AI Task Generator</h2>
          <div className="flex items-center space-x-2">
            {result && (
              <button
                onClick={exportResults}
                className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
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

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {!result && !isGenerating && (
            <div className="space-y-6">
              <div className="text-center py-8">
                <Brain className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Ready to Generate Comprehensive Task Breakdown
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  Our AI will analyze your PRD and generate detailed deliverables with measurable outcomes, 
                  comprehensive testing criteria, and step-by-step task breakdowns.
                </p>
              </div>

              {/* Configuration Options */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-4">
                <h4 className="font-medium text-gray-900 dark:text-white">Generation Settings</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Max Deliverables per Objective
                    </label>
                    <select
                      value={config.maxDeliverablesPerObjective}
                      onChange={(e) => setConfig({...config, maxDeliverablesPerObjective: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                    >
                      <option value={2}>2 (Focused)</option>
                      <option value={3}>3 (Balanced)</option>
                      <option value={4}>4 (Detailed)</option>
                      <option value={5}>5 (Comprehensive)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Max Tasks per Deliverable
                    </label>
                    <select
                      value={config.defaultTasksPerDeliverable}
                      onChange={(e) => setConfig({...config, defaultTasksPerDeliverable: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                    >
                      <option value={2}>2 (Essential only)</option>
                      <option value={3}>3 (Core tasks)</option>
                      <option value={4}>4 (Detailed)</option>
                      <option value={5}>5 (Comprehensive)</option>
                      <option value={6}>6 (Maximum detail)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.includeDetailedSubtasks}
                      onChange={(e) => setConfig({...config, includeDetailedSubtasks: e.target.checked})}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Generate actionable subtasks</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.generateTestingCriteria}
                      onChange={(e) => setConfig({...config, generateTestingCriteria: e.target.checked})}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Include comprehensive testing</span>
                  </label>
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={generateTasks}
                  className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
                >
                  <Zap className="h-5 w-5" />
                  <span>Generate Comprehensive Task Breakdown</span>
                </button>
              </div>
            </div>
          )}

          {isGenerating && (
            <div className="text-center py-12">
              <Loader2 className="h-16 w-16 text-blue-500 mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Analyzing Your Project
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Generating comprehensive task breakdown with measurable deliverables...
              </p>
            </div>
          )}

          {result && (
            <div className="space-y-6">
              {/* Project Analysis */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Project Analysis
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{result.analysis.complexity}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Complexity</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{result.analysis.estimatedDuration}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Duration</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{result.analysis.riskLevel}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Risk Level</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{result.deliverables.length}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Deliverables</div>
                  </div>
                </div>

                {/* Generation Metadata */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                    <div className="font-medium text-gray-900 dark:text-white">Total Tasks Generated</div>
                    <div className="text-blue-600 dark:text-blue-400 text-lg font-bold">{result.metadata.totalTasks}</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                    <div className="font-medium text-gray-900 dark:text-white">Estimated Total Hours</div>
                    <div className="text-green-600 dark:text-green-400 text-lg font-bold">{result.metadata.estimatedTotalHours}h</div>
                  </div>
                </div>
                
                {result.analysis.recommendations.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">AI Recommendations:</h4>
                    <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      {result.analysis.recommendations.map((rec, index) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Generated Deliverables */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Generated Deliverables & Tasks ({result.deliverables.length} deliverables, {result.metadata.totalTasks} tasks)
                </h3>
                <div className="space-y-4">
                  {result.deliverables.map((deliverable) => (
                    <div key={deliverable.id} className="border border-gray-200 dark:border-gray-600 rounded-lg">
                      <div
                        className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => toggleDeliverable(deliverable.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {expandedDeliverables.has(deliverable.id) ? (
                              <ChevronDown className="h-4 w-4 text-gray-400" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-gray-400" />
                            )}
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white">{deliverable.title}</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{deliverable.description}</p>
                              <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                                <span>Category: {deliverable.category}</span>
                                <span>Tasks: {deliverable.tasks.length}</span>
                                {deliverable.dependencies.length > 0 && (
                                  <span>Dependencies: {deliverable.dependencies.length}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              deliverable.priority === 'Critical' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                              deliverable.priority === 'High' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' :
                              deliverable.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                              'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            }`}>
                              {deliverable.priority}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {deliverable.estimatedHours}h
                            </span>
                          </div>
                        </div>
                      </div>

                      {expandedDeliverables.has(deliverable.id) && (
                        <div className="border-t border-gray-200 dark:border-gray-600 p-4 bg-gray-50 dark:bg-gray-700">
                          {/* Success Criteria */}
                          <div className="mb-4">
                            <h5 className="font-medium text-gray-900 dark:text-white mb-2">Success Criteria</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <h6 className="font-medium text-gray-700 dark:text-gray-300">Measurable Metrics</h6>
                                <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
                                  {deliverable.successCriteria.measurableMetrics.map((metric, index) => (
                                    <li key={index}>{metric.name}: {metric.targetValue}{metric.unit}</li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <h6 className="font-medium text-gray-700 dark:text-gray-300">Acceptance Criteria</h6>
                                <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
                                  {deliverable.successCriteria.acceptanceCriteria.map((criteria, index) => (
                                    <li key={index}>{criteria}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>

                          {/* Tasks */}
                          <div className="space-y-3">
                            <h5 className="font-medium text-gray-900 dark:text-white">Tasks ({deliverable.tasks.length})</h5>
                            {deliverable.tasks.map((task) => (
                              <div key={task.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                                <div
                                  className="p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                  onClick={() => toggleTask(task.id)}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      {expandedTasks.has(task.id) ? (
                                        <ChevronDown className="h-3 w-3 text-gray-400" />
                                      ) : (
                                        <ChevronRight className="h-3 w-3 text-gray-400" />
                                      )}
                                      <span className="font-medium text-gray-900 dark:text-white text-sm">{task.title}</span>
                                    </div>
                                    <div className="flex items-center space-x-2 text-xs">
                                      <span className="text-gray-500 dark:text-gray-400">{task.estimatedHours}h</span>
                                      <span className={`px-2 py-1 rounded-full ${
                                        task.priority === 'High' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                                        task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                      }`}>
                                        {task.priority}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {expandedTasks.has(task.id) && (
                                  <div className="border-t border-gray-200 dark:border-gray-600 p-3 bg-gray-50 dark:bg-gray-700">
                                    <div className="space-y-3 text-sm">
                                      <div>
                                        <h6 className="font-medium text-gray-900 dark:text-white mb-1">Description:</h6>
                                        <p className="text-gray-600 dark:text-gray-400">{task.description}</p>
                                      </div>
                                      
                                      <div>
                                        <h6 className="font-medium text-gray-900 dark:text-white mb-1">Step-by-Step Instructions:</h6>
                                        <ol className="list-decimal list-inside text-gray-600 dark:text-gray-400 space-y-1">
                                          {task.instructions.map((instruction, index) => (
                                            <li key={index}>{instruction}</li>
                                          ))}
                                        </ol>
                                      </div>

                                      <div>
                                        <h6 className="font-medium text-gray-900 dark:text-white mb-1">
                                          Subtasks ({task.subtasks.length}) - Total: {task.subtasks.reduce((sum, st) => sum + st.estimatedMinutes, 0)} minutes
                                        </h6>
                                        <ul className="space-y-1">
                                          {task.subtasks.map((subtask) => (
                                            <li key={subtask.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded">
                                              <div className="flex items-center space-x-2">
                                                <input type="checkbox" className="rounded" disabled />
                                                <span className="text-gray-600 dark:text-gray-400">{subtask.title}</span>
                                              </div>
                                              <span className="text-xs text-gray-500">{subtask.estimatedMinutes}min</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>

                                      <div>
                                        <h6 className="font-medium text-gray-900 dark:text-white mb-1">Testing & Validation:</h6>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                          {task.testingCriteria.userAcceptanceTests.length > 0 && (
                                            <div>
                                              <span className="font-medium">User Acceptance Tests:</span>
                                              <ul className="list-disc list-inside ml-2 text-gray-600 dark:text-gray-400">
                                                {task.testingCriteria.userAcceptanceTests.map((test, index) => (
                                                  <li key={index}>{test}</li>
                                                ))}
                                              </ul>
                                            </div>
                                          )}
                                          {task.testingCriteria.manualTests.length > 0 && (
                                            <div>
                                              <span className="font-medium">Manual Tests:</span>
                                              <ul className="list-disc list-inside ml-2 text-gray-600 dark:text-gray-400">
                                                {task.testingCriteria.manualTests.map((test, index) => (
                                                  <li key={index}>{test}</li>
                                                ))}
                                              </ul>
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      <div>
                                        <h6 className="font-medium text-gray-900 dark:text-white mb-1">Required Tools:</h6>
                                        <div className="flex flex-wrap gap-2">
                                          {task.tools.map((tool, index) => (
                                            <span
                                              key={index}
                                              className={`px-2 py-1 text-xs rounded-full ${
                                                tool.required
                                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300'
                                              }`}
                                              title={`${tool.purpose}: ${tool.implementation}`}
                                            >
                                              {tool.name} {tool.required && '*'}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={exportResults}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors border border-gray-300 dark:border-gray-600 rounded-lg"
                >
                  <Download className="h-4 w-4" />
                  <span>Export Results</span>
                </button>
                <button
                  onClick={handleAcceptTasks}
                  className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Accept & Import Tasks</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskGenerator;