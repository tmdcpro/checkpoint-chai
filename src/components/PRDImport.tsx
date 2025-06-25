import React, { useState } from 'react';
import { 
  Upload, 
  FileText, 
  Download, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  X,
  Plus,
  Edit3
} from 'lucide-react';
import { PRD } from '../types';

interface PRDImportProps {
  onPRDImported: (prd: PRD) => void;
  onClose: () => void;
}

const PRDImport: React.FC<PRDImportProps> = ({ onPRDImported, onClose }) => {
  const [importMethod, setImportMethod] = useState<'file' | 'text' | 'form'>('file');
  const [textInput, setTextInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Form state for manual PRD creation
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    objectives: [''],
    scope: '',
    timeline: '',
    stakeholders: [''],
    successCriteria: [''],
    risks: ['']
  });

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    setError(null);

    try {
      const content = await file.text();
      console.log('File content:', content); // Debug log
      const prd = await parsePRDContent(content, file.name);
      console.log('Parsed PRD:', prd); // Debug log
      onPRDImported(prd);
      onClose();
    } catch (err) {
      console.error('Error processing file:', err);
      setError(err instanceof Error ? err.message : 'Failed to process file');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTextSubmit = async () => {
    if (!textInput.trim()) {
      setError('Please enter PRD content');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const prd = await parsePRDContent(textInput, 'Imported PRD');
      console.log('Parsed PRD from text:', prd); // Debug log
      onPRDImported(prd);
      onClose();
    } catch (err) {
      console.error('Error processing text:', err);
      setError(err instanceof Error ? err.message : 'Failed to process content');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFormSubmit = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Title and description are required');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const prd: PRD = {
        id: `prd-${Date.now()}`,
        title: formData.title,
        description: formData.description,
        objectives: formData.objectives.filter(obj => obj.trim()),
        scope: formData.scope,
        deliverables: [],
        timeline: formData.timeline,
        stakeholders: formData.stakeholders.filter(sh => sh.trim()),
        successCriteria: formData.successCriteria.filter(sc => sc.trim()),
        risks: formData.risks.filter(risk => risk.trim()),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('Created PRD from form:', prd); // Debug log
      onPRDImported(prd);
      onClose();
    } catch (err) {
      console.error('Error creating PRD:', err);
      setError(err instanceof Error ? err.message : 'Failed to create PRD');
    } finally {
      setIsProcessing(false);
    }
  };

  const parsePRDContent = async (content: string, filename: string): Promise<PRD> => {
    console.log('Parsing content:', content.substring(0, 200) + '...'); // Debug log
    
    const lines = content.split('\n');
    const prd: PRD = {
      id: `prd-${Date.now()}`,
      title: filename.replace(/\.(md|txt)$/, ''),
      description: '',
      objectives: [],
      scope: '',
      deliverables: [],
      timeline: '',
      stakeholders: [],
      successCriteria: [],
      risks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    let currentSection = '';
    let currentContent: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('# ')) {
        prd.title = trimmed.substring(2);
      } else if (trimmed.startsWith('## ')) {
        // Process previous section
        if (currentSection && currentContent.length > 0) {
          processPRDSection(prd, currentSection, currentContent);
        }
        
        currentSection = trimmed.substring(3).toLowerCase();
        currentContent = [];
      } else if (trimmed) {
        currentContent.push(trimmed);
      }
    }

    // Process final section
    if (currentSection && currentContent.length > 0) {
      processPRDSection(prd, currentSection, currentContent);
    }

    // Ensure we have at least some basic content
    if (!prd.description && currentContent.length > 0) {
      prd.description = currentContent.join(' ');
    }

    // If no objectives found, create some from the content
    if (prd.objectives.length === 0 && prd.description) {
      prd.objectives = [`Complete project: ${prd.title}`];
    }

    console.log('Final parsed PRD:', prd); // Debug log
    return prd;
  };

  const processPRDSection = (prd: PRD, section: string, content: string[]) => {
    const text = content.join('\n');
    
    console.log(`Processing section: ${section}`, content); // Debug log
    
    switch (section) {
      case 'description':
      case 'overview':
      case 'summary':
        prd.description = text;
        break;
      case 'objectives':
      case 'goals':
      case 'requirements':
        const objectives = content.filter(line => line.startsWith('- ') || line.startsWith('* ') || line.match(/^\d+\./))
          .map(line => line.replace(/^[-*]\s*/, '').replace(/^\d+\.\s*/, ''));
        if (objectives.length > 0) {
          prd.objectives = objectives;
        } else {
          // If no bullet points, treat each line as an objective
          prd.objectives = content.filter(line => line.trim());
        }
        break;
      case 'scope':
        prd.scope = text;
        break;
      case 'timeline':
      case 'schedule':
      case 'duration':
        prd.timeline = text;
        break;
      case 'stakeholders':
      case 'team':
      case 'people':
        const stakeholders = content.filter(line => line.startsWith('- ') || line.startsWith('* '))
          .map(line => line.replace(/^[-*]\s*/, ''));
        if (stakeholders.length > 0) {
          prd.stakeholders = stakeholders;
        } else {
          prd.stakeholders = content.filter(line => line.trim());
        }
        break;
      case 'success criteria':
      case 'acceptance criteria':
      case 'success':
      case 'criteria':
        const criteria = content.filter(line => line.startsWith('- ') || line.startsWith('* '))
          .map(line => line.replace(/^[-*]\s*/, ''));
        if (criteria.length > 0) {
          prd.successCriteria = criteria;
        } else {
          prd.successCriteria = content.filter(line => line.trim());
        }
        break;
      case 'risks':
      case 'challenges':
      case 'issues':
        const risks = content.filter(line => line.startsWith('- ') || line.startsWith('* '))
          .map(line => line.replace(/^[-*]\s*/, ''));
        if (risks.length > 0) {
          prd.risks = risks;
        } else {
          prd.risks = content.filter(line => line.trim());
        }
        break;
      default:
        // If we don't recognize the section, add it to description
        if (!prd.description) {
          prd.description = text;
        }
        break;
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const addArrayField = (field: keyof typeof formData, index?: number) => {
    const currentArray = formData[field] as string[];
    if (index !== undefined) {
      setFormData({
        ...formData,
        [field]: [...currentArray.slice(0, index + 1), '', ...currentArray.slice(index + 1)]
      });
    } else {
      setFormData({
        ...formData,
        [field]: [...currentArray, '']
      });
    }
  };

  const updateArrayField = (field: keyof typeof formData, index: number, value: string) => {
    const currentArray = formData[field] as string[];
    const newArray = [...currentArray];
    newArray[index] = value;
    setFormData({
      ...formData,
      [field]: newArray
    });
  };

  const removeArrayField = (field: keyof typeof formData, index: number) => {
    const currentArray = formData[field] as string[];
    if (currentArray.length > 1) {
      setFormData({
        ...formData,
        [field]: currentArray.filter((_, i) => i !== index)
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Import Project Requirements Document</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Import Method Selection */}
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setImportMethod('file')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                importMethod === 'file'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Upload className="h-4 w-4" />
              <span>Upload File</span>
            </button>
            <button
              onClick={() => setImportMethod('text')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                importMethod === 'text'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Paste Text</span>
            </button>
            <button
              onClick={() => setImportMethod('form')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                importMethod === 'form'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Edit3 className="h-4 w-4" />
              <span>Create New</span>
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="text-red-700 dark:text-red-300">{error}</span>
            </div>
          )}

          {/* File Upload */}
          {importMethod === 'file' && (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Drop your PRD file here, or click to browse
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Supports .md, .txt files
              </p>
              <input
                type="file"
                accept=".md,.txt"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Choose File'
                )}
              </label>
            </div>
          )}

          {/* Text Input */}
          {importMethod === 'text' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Paste your PRD content (Markdown or plain text)
                </label>
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  className="w-full h-64 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                  placeholder="# Project Title

## Description
Brief description of the project...

## Objectives
- Objective 1
- Objective 2

## Scope
Project scope details...

## Timeline
Project timeline...

## Stakeholders
- Stakeholder 1
- Stakeholder 2

## Success Criteria
- Criteria 1
- Criteria 2

## Risks
- Risk 1
- Risk 2"
                />
              </div>
              <button
                onClick={handleTextSubmit}
                disabled={isProcessing || !textInput.trim()}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                <span>{isProcessing ? 'Processing...' : 'Import PRD'}</span>
              </button>
            </div>
          )}

          {/* Form Creation */}
          {importMethod === 'form' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter project title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Timeline
                  </label>
                  <input
                    type="text"
                    value={formData.timeline}
                    onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., 3 months, Q1 2024"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full h-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                  placeholder="Brief description of the project"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Scope
                </label>
                <textarea
                  value={formData.scope}
                  onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                  className="w-full h-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                  placeholder="Define what's included and excluded from the project"
                />
              </div>

              {/* Dynamic Arrays */}
              {(['objectives', 'stakeholders', 'successCriteria', 'risks'] as const).map((field) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 capitalize">
                    {field.replace(/([A-Z])/g, ' $1').trim()}
                  </label>
                  <div className="space-y-2">
                    {(formData[field] as string[]).map((item, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => updateArrayField(field, index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder={`Enter ${field.slice(0, -1)}`}
                        />
                        <button
                          onClick={() => addArrayField(field, index)}
                          className="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                        {(formData[field] as string[]).length > 1 && (
                          <button
                            onClick={() => removeArrayField(field, index)}
                            className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <button
                onClick={handleFormSubmit}
                disabled={isProcessing || !formData.title.trim() || !formData.description.trim()}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                <span>{isProcessing ? 'Creating...' : 'Create PRD'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PRDImport;