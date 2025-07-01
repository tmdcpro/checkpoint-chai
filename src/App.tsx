import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import Sidebar from './components/Sidebar';
import TopNavigation from './components/TopNavigation';
import TaskTable from './components/TaskTable';
import PRDManager from './components/PRDManager';
import GraphDashboard from './components/GraphDashboard';
import { ExternalLink } from 'lucide-react';
import { Deliverable, Task, PRD } from './types';
import { mcpTaskmaster } from './services/MCPTaskmasterService';

function App() {
  const [currentView, setCurrentView] = useState<'tasks' | 'prd' | 'graph'>('tasks');
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [prds, setPrds] = useState<PRD[]>([]);

  // Load data from localStorage on app start
  useEffect(() => {
    const savedDeliverables = localStorage.getItem('projectflow-deliverables');
    const savedPrds = localStorage.getItem('projectflow-prds');
    
    if (savedDeliverables) {
      try {
        setDeliverables(JSON.parse(savedDeliverables));
      } catch (error) {
        console.error('Failed to load saved deliverables:', error);
      }
    }
    
    if (savedPrds) {
      try {
        const loadedPrds = JSON.parse(savedPrds);
        setPrds(loadedPrds);
        
        // Initialize MCP Taskmaster with existing projects
        loadedPrds.forEach(async (prd: PRD) => {
          if (prd.deliverables && prd.deliverables.length > 0) {
            try {
              await mcpTaskmaster.createProject({ prd });
            } catch (error) {
              console.error('Failed to initialize MCP project:', error);
            }
          }
        });
      } catch (error) {
        console.error('Failed to load saved PRDs:', error);
      }
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('projectflow-deliverables', JSON.stringify(deliverables));
  }, [deliverables]);

  useEffect(() => {
    localStorage.setItem('projectflow-prds', JSON.stringify(prds));
  }, [prds]);

  const handleTasksGenerated = async (newDeliverables: Deliverable[]) => {
    console.log('Adding new deliverables:', newDeliverables);
    setDeliverables(prev => [...prev, ...newDeliverables]);
    setCurrentView('tasks'); // Switch to tasks view to show the new tasks
  };

  const handleTaskUpdate = (deliverableId: string, taskId: string, updates: Partial<Task>) => {
    setDeliverables(prev => prev.map(deliverable => 
      deliverable.id === deliverableId 
        ? {
            ...deliverable,
            tasks: deliverable.tasks.map(task =>
              task.id === taskId ? { ...task, ...updates } : task
            )
          }
        : deliverable
    ));
  };

  const handlePRDImported = async (prd: PRD) => {
    console.log('PRD imported in App:', prd);
    setPrds(prev => [...prev, prd]);
    
    // Initialize in MCP Taskmaster
    try {
      await mcpTaskmaster.createProject({ prd });
    } catch (error) {
      console.error('Failed to create MCP project:', error);
    }
  };

  const handlePRDUpdated = async (updatedPrd: PRD) => {
    setPrds(prev => prev.map(prd => 
      prd.id === updatedPrd.id ? updatedPrd : prd
    ));
    
    // Update in MCP Taskmaster
    try {
      await mcpTaskmaster.createProject({ prd: updatedPrd });
    } catch (error) {
      console.error('Failed to update MCP project:', error);
    }
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'prd':
        return (
          <PRDManager 
            prds={prds}
            onPRDImported={handlePRDImported}
            onPRDUpdated={handlePRDUpdated}
            onTasksGenerated={handleTasksGenerated} 
          />
        );
      case 'graph':
        return (
          <GraphDashboard
            prds={prds}
            deliverables={deliverables}
          />
        );
      default:
        return (
          <TaskTable 
            deliverables={deliverables}
            prds={prds}
            onTaskUpdate={handleTaskUpdate}
          />
        );
    }
  };

  return (
    <ThemeProvider>
      <div className="flex h-screen bg-white dark:bg-gray-900 overflow-hidden">
        <Sidebar currentView={currentView} onViewChange={setCurrentView} />
        <div className="flex-1 flex flex-col min-h-0">
          <TopNavigation />
          <div className="flex-1 overflow-hidden">
            {renderCurrentView()}
          </div>
        </div>
        
        {/* Built with Bolt Badge */}
        <div className="fixed bottom-4 right-4 z-50">
          <a
            href="https://bolt.new"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-sm font-medium"
          >
            <span className="text-lg">⚡</span>
            <span>Built with Bolt</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;