import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Target, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  Brain,
  Lightbulb,
  RotateCcw,
  Play,
  Pause,
  ChevronRight,
  ChevronDown,
  Plus,
  Eye,
  BarChart3
} from 'lucide-react';
import { 
  leanStartupSprintService, 
  AtomicMVP, 
  SprintCycle, 
  HITLPrompt,
  ValidationResult,
  BuildMeasureLearnCycle
} from '../services/LeanStartupSprintService';
import { Deliverable, PRD } from '../types';

interface LeanStartupSprintManagerProps {
  deliverable: Deliverable;
  prd: PRD;
  onClose: () => void;
  onDeliverablesUpdated?: (deliverables: Deliverable[]) => void;
}

const LeanStartupSprintManager: React.FC<LeanStartupSprintManagerProps> = ({ 
  deliverable, 
  prd, 
  onClose,
  onDeliverablesUpdated 
}) => {
  const [currentPhase, setCurrentPhase] = useState<'extraction' | 'sprint' | 'retrospective'>('extraction');
  const [atomicMVPs, setAtomicMVPs] = useState<AtomicMVP[]>([]);
  const [currentSprint, setCurrentSprint] = useState<SprintCycle | null>(null);
  const [hitlPrompts, setHitlPrompts] = useState<HITLPrompt[]>([]);
  const [hitlResponses, setHitlResponses] = useState<{ [promptId: string]: any }>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedMVPs, setExpandedMVPs] = useState<Set<string>>(new Set());
  const [expandedCycles, setExpandedCycles] = useState<Set<string>>(new Set());
  const [selectedCycle, setSelectedCycle] = useState<BuildMeasureLearnCycle | null>(null);

  useEffect(() => {
    initializeAtomicMVPExtraction();
  }, []);

  const initializeAtomicMVPExtraction = async () => {
    setIsProcessing(true);
    try {
      const result = await leanStartupSprintService.extractAtomicMVPs(deliverable, prd);
      setAtomicMVPs(result.atomicMVPs);
      setHitlPrompts(result.hitlPrompts);
    } catch (error) {
      console.error('Failed to extract atomic MVPs:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleHITLResponse = (promptId: string, response: any) => {
    setHitlResponses(prev => ({ ...prev, [promptId]: response }));
  };

  const startSprint = async () => {
    if (atomicMVPs.length === 0) return;
    
    setIsProcessing(true);
    try {
      const sprint = await leanStartupSprintService.createSprintCycle(atomicMVPs);
      setCurrentSprint(sprint);
      setCurrentPhase('sprint');
    } catch (error) {
      console.error('Failed to start sprint:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const executeBuildPhase = async (cycleId: string) => {
    setIsProcessing(true);
    try {
      const result = await leanStartupSprintService.executeBuildPhase(cycleId, hitlResponses);
      setHitlPrompts(prev => [...prev, ...result.hitlPrompts]);
      
      // Update sprint state
      if (currentSprint) {
        const updatedCycles = currentSprint.buildMeasureLearnCycles.map(cycle =>
          cycle.id === cycleId 
            ? { ...cycle, build: { ...cycle.build, tasks: result.tasks, status: 'In Progress' as const } }
            : cycle
        );
        setCurrentSprint({ ...currentSprint, buildMeasureLearnCycles: updatedCycles });
      }
    } catch (error) {
      console.error('Failed to execute build phase:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const executeMeasurePhase = async (cycleId: string) => {
    setIsProcessing(true);
    try {
      const buildResults = {}; // Mock build results
      const result = await leanStartupSprintService.executeMeasurePhase(cycleId, buildResults);
      setHitlPrompts(prev => [...prev, ...result.hitlPrompts]);
      
      // Update sprint state
      if (currentSprint) {
        const updatedCycles = currentSprint.buildMeasureLearnCycles.map(cycle =>
          cycle.id === cycleId 
            ? { ...cycle, measure: { ...cycle.measure, status: 'Complete' as const } }
            : cycle
        );
        setCurrentSprint({ ...currentSprint, buildMeasureLearnCycles: updatedCycles });
      }
    } catch (error) {
      console.error('Failed to execute measure phase:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const executeLearnPhase = async (cycleId: string) => {
    setIsProcessing(true);
    try {
      const measurementResults = { outcome: 'validated' }; // Mock results
      const result = await leanStartupSprintService.executeLearnPhase(cycleId, measurementResults, hitlResponses);
      setHitlPrompts(prev => [...prev, ...result.hitlPrompts]);
      
      // Update sprint state
      if (currentSprint) {
        const updatedCycles = currentSprint.buildMeasureLearnCycles.map(cycle =>
          cycle.id === cycleId 
            ? { 
                ...cycle, 
                learn: { 
                  ...cycle.learn, 
                  insights: result.insights,
                  decisions: result.decisions,
                  pivotRecommendations: result.pivotRecommendations,
                  status: 'Complete' as const 
                } 
              }
            : cycle
        );
        setCurrentSprint({ ...currentSprint, buildMeasureLearnCycles: updatedCycles });
      }
    } catch (error) {
      console.error('Failed to execute learn phase:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const conductRetrospective = async () => {
    if (!currentSprint) return;
    
    setIsProcessing(true);
    try {
      const result = await leanStartupSprintService.conductSprintRetrospective(currentSprint.id, hitlResponses);
      setHitlPrompts(prev => [...prev, ...result.hitlPrompts]);
      setCurrentPhase('retrospective');
    } catch (error) {
      console.error('Failed to conduct retrospective:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleMVPExpansion = (mvpId: string) => {
    const newExpanded = new Set(expandedMVPs);
    if (newExpanded.has(mvpId)) {
      newExpanded.delete(mvpId);
    } else {
      newExpanded.add(mvpId);
    }
    setExpandedMVPs(newExpanded);
  };

  const toggleCycleExpansion = (cycleId: string) => {
    const newExpanded = new Set(expandedCycles);
    if (newExpanded.has(cycleId)) {
      newExpanded.delete(cycleId);
    } else {
      newExpanded.add(cycleId);
    }
    setExpandedCycles(newExpanded);
  };

  const getPhaseStatus = (cycle: BuildMeasureLearnCycle) => {
    if (cycle.learn.status === 'Complete') return 'Complete';
    if (cycle.measure.status === 'Complete') return 'Learning';
    if (cycle.build.status === 'Complete') return 'Measuring';
    if (cycle.build.status === 'In Progress') return 'Building';
    return 'Planning';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Complete': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'Learning': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'Measuring': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'Building': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'Planning': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const renderHITLPrompts = () => {
    const unansweredPrompts = hitlPrompts.filter(prompt => !hitlResponses[prompt.id]);
    
    if (unansweredPrompts.length === 0) return null;

    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
        <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-3 flex items-center">
          <MessageSquare className="h-4 w-4 mr-2" />
          Human Input Required ({unansweredPrompts.length})
        </h4>
        <div className="space-y-4">
          {unansweredPrompts.map(prompt => (
            <div key={prompt.id} className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <p className="font-medium text-gray-900 dark:text-white mb-2">{prompt.question}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{prompt.context}</p>
              
              {prompt.options ? (
                <div className="space-y-2">
                  {prompt.options.map((option, index) => (
                    <label key={index} className="flex items-center">
                      <input
                        type="radio"
                        name={prompt.id}
                        value={option}
                        onChange={(e) => handleHITLResponse(prompt.id, e.target.value)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{option}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <textarea
                  placeholder="Your response..."
                  onChange={(e) => handleHITLResponse(prompt.id, e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={3}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderAtomicMVPExtraction = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Target className="h-16 w-16 text-blue-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Atomic MVP Extraction
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Breaking down "{deliverable.title}" into the smallest testable components using Lean Startup methodology
        </p>
      </div>

      {renderHITLPrompts()}

      {atomicMVPs.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-4">
            Extracted Atomic MVPs ({atomicMVPs.length})
          </h4>
          <div className="space-y-4">
            {atomicMVPs.map(mvp => (
              <div key={mvp.id} className="border border-gray-200 dark:border-gray-600 rounded-lg">
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => toggleMVPExpansion(mvp.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {expandedMVPs.has(mvp.id) ? (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      )}
                      <div>
                        <h5 className="font-medium text-gray-900 dark:text-white">{mvp.title}</h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{mvp.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        mvp.riskLevel === 'High' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                        mvp.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      }`}>
                        {mvp.riskLevel} Risk
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{mvp.estimatedHours}h</span>
                    </div>
                  </div>
                </div>

                {expandedMVPs.has(mvp.id) && (
                  <div className="border-t border-gray-200 dark:border-gray-600 p-4 bg-gray-50 dark:bg-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h6 className="font-medium text-gray-900 dark:text-white mb-2">Hypothesis</h6>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{mvp.hypothesis}</p>
                        
                        <h6 className="font-medium text-gray-900 dark:text-white mb-2">Learning Objectives</h6>
                        <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          {mvp.learningObjectives.map((objective, index) => (
                            <li key={index}>{objective}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h6 className="font-medium text-gray-900 dark:text-white mb-2">Success Metrics</h6>
                        <div className="space-y-2 mb-4">
                          {mvp.successMetrics.map(metric => (
                            <div key={metric.id} className="bg-white dark:bg-gray-800 rounded p-2">
                              <div className="font-medium text-sm text-gray-900 dark:text-white">{metric.name}</div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">Target: {metric.targetValue}</div>
                            </div>
                          ))}
                        </div>
                        
                        <h6 className="font-medium text-gray-900 dark:text-white mb-2">Validation Tests</h6>
                        <div className="space-y-1">
                          {mvp.validationTests.map(test => (
                            <div key={test.id} className="text-sm text-gray-600 dark:text-gray-400">
                              • {test.description} ({test.estimatedTime}h)
                            </div>
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

      <div className="flex justify-end space-x-4">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={startSprint}
          disabled={atomicMVPs.length === 0 || isProcessing}
          className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Play className="h-4 w-4" />
          <span>Start Lean Sprint</span>
        </button>
      </div>
    </div>
  );

  const renderSprintExecution = () => {
    if (!currentSprint) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Sprint {currentSprint.sprintNumber} - Build-Measure-Learn Cycles
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Execute rapid validation cycles for each atomic MVP
            </p>
          </div>
          <button
            onClick={conductRetrospective}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Retrospective</span>
          </button>
        </div>

        {renderHITLPrompts()}

        <div className="space-y-4">
          {currentSprint.buildMeasureLearnCycles.map(cycle => {
            const status = getPhaseStatus(cycle);
            const mvp = atomicMVPs.find(m => m.id === cycle.atomicMVPId);
            
            return (
              <div key={cycle.id} className="border border-gray-200 dark:border-gray-600 rounded-lg">
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => toggleCycleExpansion(cycle.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {expandedCycles.has(cycle.id) ? (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      )}
                      <div>
                        <h5 className="font-medium text-gray-900 dark:text-white">{mvp?.title}</h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Build → Measure → Learn Cycle</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(status)}`}>
                        {status}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCycle(cycle);
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {expandedCycles.has(cycle.id) && (
                  <div className="border-t border-gray-200 dark:border-gray-600 p-4 bg-gray-50 dark:bg-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Build Phase */}
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h6 className="font-medium text-gray-900 dark:text-white flex items-center">
                            <Target className="h-4 w-4 mr-2 text-orange-500" />
                            Build
                          </h6>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(cycle.build.status)}`}>
                            {cycle.build.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {cycle.build.estimatedHours}h estimated
                        </p>
                        {cycle.build.status === 'Not Started' && (
                          <button
                            onClick={() => executeBuildPhase(cycle.id)}
                            disabled={isProcessing}
                            className="w-full px-3 py-2 text-sm bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors"
                          >
                            Start Building
                          </button>
                        )}
                        {cycle.build.tasks.length > 0 && (
                          <div className="mt-2">
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tasks:</div>
                            {cycle.build.tasks.slice(0, 2).map(task => (
                              <div key={task.id} className="text-xs text-gray-600 dark:text-gray-400">
                                • {task.title}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Measure Phase */}
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h6 className="font-medium text-gray-900 dark:text-white flex items-center">
                            <BarChart3 className="h-4 w-4 mr-2 text-purple-500" />
                            Measure
                          </h6>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(cycle.measure.status)}`}>
                            {cycle.measure.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {cycle.measure.tests.length} validation tests
                        </p>
                        {cycle.build.status === 'Complete' && cycle.measure.status === 'Not Started' && (
                          <button
                            onClick={() => executeMeasurePhase(cycle.id)}
                            disabled={isProcessing}
                            className="w-full px-3 py-2 text-sm bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                          >
                            Start Measuring
                          </button>
                        )}
                      </div>

                      {/* Learn Phase */}
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h6 className="font-medium text-gray-900 dark:text-white flex items-center">
                            <Brain className="h-4 w-4 mr-2 text-blue-500" />
                            Learn
                          </h6>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(cycle.learn.status)}`}>
                            {cycle.learn.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          Generate insights & decisions
                        </p>
                        {cycle.measure.status === 'Complete' && cycle.learn.status === 'Not Started' && (
                          <button
                            onClick={() => executeLearnPhase(cycle.id)}
                            disabled={isProcessing}
                            className="w-full px-3 py-2 text-sm bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                          >
                            Start Learning
                          </button>
                        )}
                        {cycle.learn.insights.length > 0 && (
                          <div className="mt-2">
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Key Insights:</div>
                            {cycle.learn.insights.slice(0, 2).map((insight, index) => (
                              <div key={index} className="text-xs text-gray-600 dark:text-gray-400">
                                • {insight}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderRetrospective = () => (
    <div className="space-y-6">
      <div className="text-center">
        <RotateCcw className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Sprint Retrospective
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Reflect on learnings and plan improvements for the next iteration
        </p>
      </div>

      {renderHITLPrompts()}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <h4 className="font-medium text-green-800 dark:text-green-200 mb-3 flex items-center">
            <CheckCircle className="h-4 w-4 mr-2" />
            What Worked Well
          </h4>
          <ul className="list-disc list-inside text-sm text-green-700 dark:text-green-300 space-y-1">
            <li>Rapid hypothesis validation</li>
            <li>Clear success metrics</li>
            <li>Effective user feedback collection</li>
          </ul>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
          <h4 className="font-medium text-red-800 dark:text-red-200 mb-3 flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Areas for Improvement
          </h4>
          <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-300 space-y-1">
            <li>Reduce build time further</li>
            <li>Improve validation test design</li>
            <li>Faster iteration cycles</li>
          </ul>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-3 flex items-center">
          <Lightbulb className="h-4 w-4 mr-2" />
          Key Learnings & Next Steps
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h5 className="font-medium text-blue-700 dark:text-blue-300 mb-2">Validated Hypotheses</h5>
            <ul className="list-disc list-inside text-sm text-blue-600 dark:text-blue-400 space-y-1">
              <li>Users engage with core functionality</li>
              <li>Problem-solution fit confirmed</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-blue-700 dark:text-blue-300 mb-2">Pivot Recommendations</h5>
            <ul className="list-disc list-inside text-sm text-blue-600 dark:text-blue-400 space-y-1">
              <li>Simplify user interface</li>
              <li>Focus on mobile experience</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <button
          onClick={() => setCurrentPhase('extraction')}
          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        >
          Start New Sprint
        </button>
        <button
          onClick={onClose}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Complete Sprint
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Zap className="h-6 w-6 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Lean Startup Atomic MVP Sprints
            </h2>
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full">
              {currentPhase === 'extraction' ? 'Extraction' : 
               currentPhase === 'sprint' ? 'Sprint Execution' : 'Retrospective'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            ×
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {isProcessing && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Processing...</p>
            </div>
          )}

          {!isProcessing && currentPhase === 'extraction' && renderAtomicMVPExtraction()}
          {!isProcessing && currentPhase === 'sprint' && renderSprintExecution()}
          {!isProcessing && currentPhase === 'retrospective' && renderRetrospective()}
        </div>
      </div>
    </div>
  );
};

export default LeanStartupSprintManager;