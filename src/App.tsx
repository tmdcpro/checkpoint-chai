import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import Sidebar from './components/Sidebar';
import TopNavigation from './components/TopNavigation';
import TaskTable from './components/TaskTable';
import PRDManager from './components/PRDManager';
import { Deliverable, Task, PRD } from './types';

function App() {
  const [currentView, setCurrentView] = useState<'tasks' | 'prd'>('tasks');
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
        setPrds(JSON.parse(savedPrds));
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

  const handleTasksGenerated = (newDeliverables: Deliverable[]) => {
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

  const handlePRDImported = (prd: PRD) => {
    console.log('PRD imported in App:', prd);
    setPrds(prev => [...prev, prd]);
  };

  const handlePRDUpdated = (updatedPrd: PRD) => {
    setPrds(prev => prev.map(prd => 
      prd.id === updatedPrd.id ? updatedPrd : prd
    ));
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
      default:
        return (
          <TaskTable 
            deliverables={deliverables}
            onTaskUpdate={handleTaskUpdate}
          />
        );
    }
  };

  return (
    <ThemeProvider>
      <div className="flex h-screen bg-white dark:bg-gray-900">
        <Sidebar currentView={currentView} onViewChange={setCurrentView} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopNavigation />
          {renderCurrentView()}
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;