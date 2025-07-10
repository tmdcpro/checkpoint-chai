import { PRD, Deliverable, Task, ProjectAnalysis } from '../types';

export interface PRDAnalysisConfig {
  maxDeliverablesPerObjective?: number;
  defaultTasksPerDeliverable?: number;
  includeDetailedSubtasks?: boolean;
  generateTestingCriteria?: boolean;
}

export interface TaskGenerationResult {
  analysis: ProjectAnalysis;
  deliverables: Deliverable[];
  metadata: {
    totalTasks: number;
    estimatedTotalHours: number;
    generatedAt: string;
    version: string;
  };
}

/**
 * Enhanced PRD processing service with intelligent task generation
 */
export class PRDService {
  private config: Required<PRDAnalysisConfig>;
  private generatedTasks: Set<string> = new Set(); // Track generated tasks to avoid duplicates
  private taskIdCounter: number = 1;

  constructor(config: PRDAnalysisConfig = {}) {
    this.config = {
      maxDeliverablesPerObjective: config.maxDeliverablesPerObjective ?? 3,
      defaultTasksPerDeliverable: config.defaultTasksPerDeliverable ?? 4,
      includeDetailedSubtasks: config.includeDetailedSubtasks ?? true,
      generateTestingCriteria: config.generateTestingCriteria ?? true,
      ...config
    };
    // Reset for each instance
    this.generatedTasks.clear();
    this.taskIdCounter = 1;
  }

  /**
   * Main entry point for PRD analysis and task generation
   */
  async generateTasksFromPRD(prd: PRD): Promise<TaskGenerationResult> {
    console.log('PRDService: Starting enhanced task generation for PRD:', prd.title);
    
    // Reset state for fresh generation
    this.generatedTasks.clear();
    this.taskIdCounter = 1;
    
    // Enhanced PRD analysis
    const analysis = this.analyzePRD(prd);
    const projectDomain = this.detectProjectDomain(prd);
    
    // Extract atomic features from PRD
    const atomicFeatures = this.extractAtomicFeatures(prd, projectDomain);
    
    // Generate specific deliverables for each atomic feature
    const deliverables = this.generateAtomicDeliverables(atomicFeatures, prd, projectDomain);
    
    // Add essential infrastructure deliverable if needed
    if (deliverables.length > 0) {
      const infraDeliverable = this.generateEssentialInfrastructure(prd, projectDomain);
      if (infraDeliverable) {
        deliverables.unshift(infraDeliverable); // Add at beginning
      }
    }

    const totalTasks = deliverables.reduce((sum, d) => sum + d.tasks.length, 0);
    const estimatedTotalHours = deliverables.reduce((sum, d) => sum + d.estimatedHours, 0);

    const result: TaskGenerationResult = {
      analysis,
      deliverables,
      metadata: {
        totalTasks,
        estimatedTotalHours,
        generatedAt: new Date().toISOString(),
        version: '2.1.0'
      }
    };

    console.log('PRDService: Generated optimized result with', totalTasks, 'unique tasks');
    return result;
  }

  /**
   * Extract atomic, testable features from PRD objectives
   */
  private extractAtomicFeatures(prd: PRD, domain: string): Array<{
    id: string;
    name: string;
    description: string;
    userValue: string;
    testableOutcome: string;
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    complexity: 'Simple' | 'Moderate' | 'Complex';
    category: string;
    dependencies: string[];
  }> {
    let features: Array<{
      id: string;
      name: string;
      description: string;
      userValue: string;
      testableOutcome: string;
      priority: 'Low' | 'Medium' | 'High' | 'Critical';
      complexity: 'Simple' | 'Moderate' | 'Complex';
      category: string;
      dependencies: string[];
    }> = [];

    // Domain-specific feature extraction
    if (domain === 'cryptocurrency-trading') {
      features.push(...this.extractCryptoTradingFeatures(prd));
    } else if (domain === 'ecommerce') {
      features.push(...this.extractEcommerceFeatures(prd));
    }
    
    // Always try generic extraction if we don't have enough features
    if (features.length === 0) {
      features.push(...this.extractGenericFeatures(prd));
    }

    // Ensure we have at least some features, limit to maximum configured
    const maxFeatures = Math.min(features.length, this.config.maxDeliverablesPerObjective * Math.max(1, prd.objectives.length));
    
    return features
      .slice(0, maxFeatures)
      .map((feature, index) => ({
        ...feature,
        id: `feature-${index + 1}`,
      }));
  }

  /**
   * Extract crypto trading specific atomic features
   */
  private extractCryptoTradingFeatures(prd: PRD): Array<{
    name: string;
    description: string;
    userValue: string;
    testableOutcome: string;
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    complexity: 'Simple' | 'Moderate' | 'Complex';
    category: string;
    dependencies: string[];
  }> {
    const features = [];
    const content = `${prd.title} ${prd.description} ${prd.objectives.join(' ')}`.toLowerCase();

    if (this.containsKeywords(prd, ['auth', 'login', 'account', 'user'])) {
      features.push({
        name: 'Secure User Authentication',
        description: 'Users can securely create accounts and log in to access trading features',
        userValue: 'Users can safely access their trading account with their credentials',
        testableOutcome: 'User can register, verify email, log in, and access dashboard within 30 seconds',
        priority: 'Critical' as const,
        complexity: 'Moderate' as const,
        category: 'Authentication',
        dependencies: []
      });
    }

    if (this.containsKeywords(prd, ['market', 'data', 'price', 'real-time', 'feed'])) {
      features.push({
        name: 'Live Price Data Display',
        description: 'Display real-time cryptocurrency prices and market data',
        userValue: 'Users see up-to-date prices to make informed trading decisions',
        testableOutcome: 'Price updates within 100ms of market changes, displayed in clear charts',
        priority: 'Critical' as const,
        complexity: 'Complex' as const,
        category: 'Market Data',
        dependencies: ['feature-1'] // Depends on auth if it exists
      });
    }

    if (this.containsKeywords(prd, ['portfolio', 'balance', 'holdings'])) {
      features.push({
        name: 'Portfolio Balance Tracking',
        description: 'Track and display user cryptocurrency holdings and total portfolio value',
        userValue: 'Users can see their investment performance and current holdings value',
        testableOutcome: 'Portfolio value calculated correctly and updates when prices change',
        priority: 'High' as const,
        complexity: 'Moderate' as const,
        category: 'Portfolio Management',
        dependencies: ['feature-1', 'feature-2']
      });
    }

    if (this.containsKeywords(prd, ['trade', 'buy', 'sell', 'order'])) {
      features.push({
        name: 'Basic Trade Execution',
        description: 'Execute simple buy and sell orders for cryptocurrencies',
        userValue: 'Users can buy and sell cryptocurrencies with simple market orders',
        testableOutcome: 'Order placement completes within 5 seconds, confirmation displayed immediately',
        priority: 'High' as const,
        complexity: 'Complex' as const,
        category: 'Trading',
        dependencies: ['feature-1', 'feature-2']
      });
    }

    if (this.containsKeywords(prd, ['alert', 'notification', 'price'])) {
      features.push({
        name: 'Price Alert System',
        description: 'Set price alerts that notify users when target prices are reached',
        userValue: 'Users get notified when cryptocurrencies reach their target buy/sell prices',
        testableOutcome: 'Alert triggers within 30 seconds of price target, notification delivered',
        priority: 'Medium' as const,
        complexity: 'Simple' as const,
        category: 'Alerts',
        dependencies: ['feature-1', 'feature-2']
      });
    }

    return features;
  }

  /**
   * Extract ecommerce specific atomic features
   */
  private extractEcommerceFeatures(prd: PRD): Array<any> {
    const features = [];

    if (this.containsKeywords(prd, ['product', 'catalog', 'browse'])) {
      features.push({
        name: 'Product Catalog Browsing',
        description: 'Browse and search through product listings',
        userValue: 'Users can easily find products they want to purchase',
        testableOutcome: 'Search returns relevant results in under 2 seconds',
        priority: 'Critical' as const,
        complexity: 'Moderate' as const,
        category: 'Product Discovery',
        dependencies: []
      });
    }

    if (this.containsKeywords(prd, ['cart', 'checkout', 'purchase'])) {
      features.push({
        name: 'Shopping Cart & Checkout',
        description: 'Add products to cart and complete purchase',
        userValue: 'Users can buy products with a simple checkout process',
        testableOutcome: 'Complete purchase flow in under 3 minutes',
        priority: 'Critical' as const,
        complexity: 'Complex' as const,
        category: 'Purchase',
        dependencies: ['feature-1']
      });
    }

    return features;
  }

  /**
   * Extract generic atomic features from any PRD
   */
  private extractGenericFeatures(prd: PRD): Array<any> {
    const features = [];
    
    // Generate features from all objectives, up to the maximum
    const objectivesToProcess = prd.objectives.slice(0, this.config.maxDeliverablesPerObjective);
    
    objectivesToProcess.forEach((objective, index) => {
      const feature = {
        name: this.extractAtomicFeatureName(objective),
        description: `Implement ${objective}`,
        userValue: this.extractUserValue(objective),
        testableOutcome: this.generateTestableOutcome(objective),
        priority: this.determinePriority(objective, index),
        complexity: this.assessComplexity(objective),
        category: this.categorizeFeature(objective),
        dependencies: index > 0 ? [`feature-${index}`] : []
      };
      
      features.push(feature);
    });

    // If no objectives exist, create a basic setup feature
    if (features.length === 0 && prd.objectives.length === 0) {
      features.push({
        name: 'Project Setup',
        description: `Set up basic ${prd.title} application`,
        userValue: 'Users can access the basic application',
        testableOutcome: 'Application loads successfully and displays main interface',
        priority: 'Critical' as const,
        complexity: 'Simple' as const,
        category: 'Setup',
        dependencies: []
      });
    }

    return features;
  }

  /**
   * Generate atomic deliverables for each feature
   */
  private generateAtomicDeliverables(
    features: Array<any>,
    prd: PRD,
    domain: string
  ): Deliverable[] {
    const deliverables: Deliverable[] = [];

    features.forEach((feature, index) => {
      const tasks = this.generateAtomicTasks(feature, domain);
      
      // Ensure every feature gets at least one task
      if (tasks.length === 0) {
        const fallbackTask = this.generateFallbackTask(feature);
        tasks.push(fallbackTask);
      }

      const deliverable: Deliverable = {
        id: feature.id,
        title: feature.name,
        description: feature.description,
        category: feature.category,
        priority: feature.priority,
        estimatedHours: tasks.reduce((sum, task) => sum + task.estimatedHours, 0),
        dependencies: feature.dependencies.filter(depId => 
          features.some(f => f.id === depId)
        ),
        tasks,
        successCriteria: this.generateAtomicSuccessCriteria(feature),
        status: 'Not Started'
      };

      deliverables.push(deliverable);
    });

    return deliverables;
  }

  /**
   * Generate specific, actionable tasks for an atomic feature
   */
  private generateAtomicTasks(feature: any, domain: string): Task[] {
    const tasks: Task[] = [];
    const maxTasks = this.config.defaultTasksPerDeliverable;

    // Generate specific tasks based on feature category and complexity
    const taskTemplates = this.getAtomicTaskTemplates(feature, domain);
    
    // Limit to maximum configured tasks
    const selectedTemplates = taskTemplates.slice(0, maxTasks);

    selectedTemplates.forEach((template, index) => {
      const taskSignature = `${feature.category}-${template.type}-${template.title}`;
      
      // Skip if we've already generated this type of task
      if (this.generatedTasks.has(taskSignature) && tasks.length > 0) {
        return;
      }

      const task: Task = {
        id: `task-${this.taskIdCounter++}`,
        title: template.title,
        description: template.description,
        instructions: template.instructions,
        estimatedHours: template.estimatedHours,
        priority: template.priority,
        status: 'Not Started',
        dependencies: index > 0 ? [`task-${this.taskIdCounter - 2}`] : [],
        subtasks: this.config.includeDetailedSubtasks ? template.subtasks : [],
        testingCriteria: this.config.generateTestingCriteria ? template.testingCriteria : {
          unitTests: [],
          integrationTests: [],
          userAcceptanceTests: [],
          performanceTests: [],
          securityTests: [],
          accessibilityTests: [],
          manualTests: []
        },
        tools: template.tools
      };

      tasks.push(task);
      this.generatedTasks.add(taskSignature);
    });

    return tasks;
  }

  /**
   * Generate a fallback task when no specific templates are found
   */
  private generateFallbackTask(feature: any): Task {
    return {
      id: `task-${this.taskIdCounter++}`,
      title: `Implement ${feature.name}`,
      description: feature.description,
      instructions: [
        `Plan and design ${feature.name} implementation`,
        'Build core functionality according to requirements',
        'Test thoroughly to ensure quality and reliability',
        'Document implementation and usage'
      ],
      estimatedHours: feature.complexity === 'Complex' ? 12 : feature.complexity === 'Moderate' ? 8 : 4,
      priority: feature.priority,
      status: 'Not Started',
      dependencies: [],
      subtasks: this.config.includeDetailedSubtasks ? [
        {
          id: `subtask-fallback-${Date.now()}-1`,
          title: 'Planning and design',
          description: `Plan implementation approach for ${feature.name}`,
          completed: false,
          estimatedMinutes: 90
        },
        {
          id: `subtask-fallback-${Date.now()}-2`,
          title: 'Core development',
          description: `Develop main functionality for ${feature.name}`,
          completed: false,
          estimatedMinutes: 300
        },
        {
          id: `subtask-fallback-${Date.now()}-3`,
          title: 'Testing and validation',
          description: `Test and validate ${feature.name}`,
          completed: false,
          estimatedMinutes: 90
        }
      ] : [],
      testingCriteria: this.config.generateTestingCriteria ? {
        unitTests: [`${feature.name} unit tests`],
        integrationTests: [`${feature.name} integration tests`],
        userAcceptanceTests: [feature.testableOutcome],
        performanceTests: [`${feature.name} performance tests`],
        securityTests: [`${feature.name} security tests`],
        accessibilityTests: [`${feature.name} accessibility tests`],
        manualTests: [`Manual testing of ${feature.name}`]
      } : {
        unitTests: [],
        integrationTests: [],
        userAcceptanceTests: [],
        performanceTests: [],
        securityTests: [],
        accessibilityTests: [],
        manualTests: []
      },
      tools: [
        { name: 'Development Environment', purpose: 'Implementation', implementation: feature.name, required: true }
      ]
    };
  }

  /**
   * Get specific task templates for atomic features
   */
  private getAtomicTaskTemplates(feature: any, domain: string): Array<any> {
    const templates = [];

    if (feature.category === 'Authentication') {
      templates.push({
        type: 'backend-auth',
        title: 'Build Authentication API',
        description: 'Create secure user registration and login endpoints',
        instructions: [
          'Design user database schema with email and password fields',
          'Implement bcrypt password hashing with salt rounds >= 12',
          'Create JWT token generation with 15-minute expiry',
          'Add input validation for email format and password strength',
          'Implement rate limiting (5 attempts per minute per IP)'
        ],
        estimatedHours: 8,
        priority: 'Critical' as const,
        subtasks: [
          {
            id: `subtask-${Date.now()}-1`,
            title: 'Database schema setup',
            description: 'Create users table with proper indexes',
            completed: false,
            estimatedMinutes: 60
          },
          {
            id: `subtask-${Date.now()}-2`,
            title: 'Password hashing implementation',
            description: 'Implement secure bcrypt hashing',
            completed: false,
            estimatedMinutes: 45
          },
          {
            id: `subtask-${Date.now()}-3`,
            title: 'JWT token system',
            description: 'Create token generation and validation',
            completed: false,
            estimatedMinutes: 90
          },
          {
            id: `subtask-${Date.now()}-4`,
            title: 'Rate limiting setup',
            description: 'Implement login attempt rate limiting',
            completed: false,
            estimatedMinutes: 45
          }
        ],
        testingCriteria: {
          unitTests: [
            'Password hashing function',
            'JWT token generation',
            'Input validation functions'
          ],
          integrationTests: [
            'Registration endpoint returns 201 for valid data',
            'Login endpoint returns JWT for valid credentials',
            'Rate limiting blocks after 5 failed attempts'
          ],
          userAcceptanceTests: [
            'User can register with valid email and strong password',
            'User receives JWT token after successful login',
            'Invalid credentials are rejected with appropriate error'
          ],
          performanceTests: [
            'Registration completes within 2 seconds',
            'Login completes within 1 second'
          ],
          securityTests: [
            'Password is hashed before storage',
            'JWT tokens expire after 15 minutes',
            'SQL injection attacks are prevented'
          ],
          accessibilityTests: [],
          manualTests: [
            'Test registration flow manually',
            'Verify JWT token in browser storage'
          ]
        },
        tools: [
          { name: 'bcrypt', purpose: 'Password hashing', implementation: 'Secure password storage', required: true },
          { name: 'jsonwebtoken', purpose: 'JWT tokens', implementation: 'User session management', required: true },
          { name: 'express-rate-limit', purpose: 'Rate limiting', implementation: 'Prevent brute force attacks', required: true }
        ]
      });

      templates.push({
        type: 'frontend-auth',
        title: 'Build Authentication UI',
        description: 'Create responsive login and registration forms',
        instructions: [
          'Design mobile-first login form with email and password fields',
          'Add real-time validation feedback (email format, password strength)',
          'Implement loading states and error message display',
          'Create registration form with email verification flow',
          'Add "Remember me" functionality with local storage'
        ],
        estimatedHours: 6,
        priority: 'High' as const,
        subtasks: [
          {
            id: `subtask-${Date.now()}-5`,
            title: 'Login form component',
            description: 'Create responsive login form',
            completed: false,
            estimatedMinutes: 120
          },
          {
            id: `subtask-${Date.now()}-6`,
            title: 'Form validation',
            description: 'Add real-time input validation',
            completed: false,
            estimatedMinutes: 90
          },
          {
            id: `subtask-${Date.now()}-7`,
            title: 'Registration form',
            description: 'Build user registration interface',
            completed: false,
            estimatedMinutes: 90
          },
          {
            id: `subtask-${Date.now()}-8`,
            title: 'State management',
            description: 'Implement authentication state handling',
            completed: false,
            estimatedMinutes: 60
          }
        ],
        testingCriteria: {
          unitTests: [
            'Form validation functions',
            'Authentication state management',
            'Input sanitization'
          ],
          integrationTests: [
            'Login form submits to API correctly',
            'Registration form handles API responses',
            'Error messages display appropriately'
          ],
          userAcceptanceTests: [
            'User can log in with valid credentials',
            'Form validation prevents invalid submissions',
            'Loading states provide clear feedback'
          ],
          performanceTests: [
            'Form renders within 100ms',
            'Validation feedback appears within 200ms'
          ],
          securityTests: [
            'Password field is properly masked',
            'Form data is not logged in console',
            'CSRF protection is implemented'
          ],
          accessibilityTests: [
            'Forms are keyboard navigable',
            'Screen readers can access all form fields',
            'Color contrast meets WCAG 2.1 AA standards'
          ],
          manualTests: [
            'Test form on mobile devices',
            'Verify error message clarity'
          ]
        },
        tools: [
          { name: 'React Hook Form', purpose: 'Form management', implementation: 'Efficient form handling', required: true },
          { name: 'Zod', purpose: 'Schema validation', implementation: 'Type-safe input validation', required: true }
        ]
      });
    }

    if (feature.category === 'Market Data') {
      templates.push({
        type: 'websocket-integration',
        title: 'Real-time Price Data Stream',
        description: 'Connect to cryptocurrency exchange WebSocket for live price feeds',
        instructions: [
          'Establish WebSocket connection to Binance or CoinGecko API',
          'Implement automatic reconnection with exponential backoff',
          'Parse incoming price data and normalize format',
          'Store last 100 price points in memory for chart display',
          'Implement connection health monitoring'
        ],
        estimatedHours: 10,
        priority: 'Critical' as const,
        subtasks: [
          {
            id: `subtask-${Date.now()}-9`,
            title: 'WebSocket connection',
            description: 'Establish stable connection to price API',
            completed: false,
            estimatedMinutes: 180
          },
          {
            id: `subtask-${Date.now()}-10`,
            title: 'Data parsing',
            description: 'Parse and normalize price data',
            completed: false,
            estimatedMinutes: 120
          },
          {
            id: `subtask-${Date.now()}-11`,
            title: 'Reconnection logic',
            description: 'Implement automatic reconnection',
            completed: false,
            estimatedMinutes: 90
          },
          {
            id: `subtask-${Date.now()}-12`,
            title: 'Health monitoring',
            description: 'Monitor connection status',
            completed: false,
            estimatedMinutes: 60
          }
        ],
        testingCriteria: {
          unitTests: [
            'Data parsing functions',
            'Reconnection logic',
            'Health check functions'
          ],
          integrationTests: [
            'WebSocket connects successfully',
            'Price data is received and parsed',
            'Reconnection works after connection loss'
          ],
          userAcceptanceTests: [
            'Real-time prices update on screen',
            'Connection remains stable for 24+ hours',
            'Price data is accurate compared to exchange'
          ],
          performanceTests: [
            'Price updates appear within 100ms',
            'Memory usage stays under 50MB',
            'No memory leaks after 24 hours'
          ],
          securityTests: [
            'WebSocket connection uses secure protocol',
            'API keys are properly protected',
            'Data integrity is validated'
          ],
          accessibilityTests: [],
          manualTests: [
            'Test connection stability during market volatility',
            'Verify price accuracy against multiple sources'
          ]
        },
        tools: [
          { name: 'ws', purpose: 'WebSocket client', implementation: 'Real-time data connection', required: true },
          { name: 'axios', purpose: 'HTTP requests', implementation: 'API fallback requests', required: true }
        ]
      });
    }

    // Generic task templates for any feature category
    if (templates.length === 0) {
      templates.push({
        type: 'implementation',
        title: `Implement ${feature.name}`,
        description: feature.description,
        instructions: [
          `Analyze requirements for ${feature.name}`,
          'Design component architecture and data flow',
          'Implement core functionality with proper error handling',
          'Add comprehensive testing and documentation',
          'Optimize performance and user experience'
        ],
        estimatedHours: Math.max(4, Math.min(12, feature.complexity === 'Complex' ? 12 : feature.complexity === 'Moderate' ? 8 : 4)),
        priority: feature.priority,
        subtasks: [
          {
            id: `subtask-${Date.now()}-generic-1`,
            title: 'Requirements analysis',
            description: `Analyze and document requirements for ${feature.name}`,
            completed: false,
            estimatedMinutes: 60
          },
          {
            id: `subtask-${Date.now()}-generic-2`,
            title: 'Core implementation',
            description: `Build main functionality for ${feature.name}`,
            completed: false,
            estimatedMinutes: 240
          },
          {
            id: `subtask-${Date.now()}-generic-3`,
            title: 'Testing and validation',
            description: `Test and validate ${feature.name} functionality`,
            completed: false,
            estimatedMinutes: 120
          }
        ],
        testingCriteria: {
          unitTests: [`${feature.name} functionality tests`],
          integrationTests: [`${feature.name} integration tests`],
          userAcceptanceTests: [feature.testableOutcome],
          performanceTests: [`${feature.name} performance requirements`],
          securityTests: [`${feature.name} security validation`],
          accessibilityTests: [`${feature.name} accessibility compliance`],
          manualTests: [`Manual testing of ${feature.name}`]
        },
        tools: [
          { name: 'Development Framework', purpose: 'Core development', implementation: feature.name, required: true }
        ]
      });
    }

    return templates;
  }

  /**
   * Generate essential infrastructure deliverable
   */
  private generateEssentialInfrastructure(prd: PRD, domain: string): Deliverable | null {
    const infraTasks = this.generateInfrastructureTasks(domain);
    
    if (infraTasks.length === 0) return null;

    return {
      id: 'infrastructure-foundation',
      title: 'Development Infrastructure Setup',
      description: 'Essential project setup and development environment configuration',
      category: 'Infrastructure',
      priority: 'Critical',
      estimatedHours: infraTasks.reduce((sum, task) => sum + task.estimatedHours, 0),
      dependencies: [],
      tasks: infraTasks,
      successCriteria: {
        measurableMetrics: [
          {
            id: 'build-success',
            name: 'Build Success Rate',
            description: 'Project builds without errors',
            type: 'boolean',
            targetValue: true,
            unit: '',
            automated: true,
            testingMethod: 'Automated build process'
          }
        ],
        qualitativeFactors: [
          {
            id: 'dev-experience',
            name: 'Developer Experience',
            description: 'Easy setup and development workflow',
            importance: 'High',
            evaluationMethod: 'Developer feedback',
            criteria: ['Quick setup', 'Clear documentation', 'Reliable builds'],
            maxScore: 10
          }
        ],
        testingRequirements: [
          'Project builds successfully',
          'Development server starts without errors',
          'All dependencies install correctly'
        ],
        acceptanceCriteria: [
          'Any developer can set up project in under 15 minutes',
          'Build process completes without warnings',
          'Development server runs on first attempt'
        ]
      },
      status: 'Not Started'
    };
  }

  /**
   * Generate infrastructure tasks with no redundancy
   */
  private generateInfrastructureTasks(domain: string): Task[] {
    const tasks: Task[] = [];

    // Only generate essential, non-redundant infrastructure tasks
    tasks.push({
      id: `task-${this.taskIdCounter++}`,
      title: 'Project Foundation Setup',
      description: 'Initialize project structure with development tools and configuration',
      instructions: [
        'Create project directory structure (src/, public/, etc.)',
        'Initialize package.json with project metadata',
        'Configure TypeScript with strict type checking enabled',
        'Set up ESLint and Prettier for code quality',
        'Create environment configuration files (.env.example)'
      ],
      estimatedHours: 3,
      priority: 'Critical',
      status: 'Not Started',
      dependencies: [],
      subtasks: this.config.includeDetailedSubtasks ? [
        {
          id: `subtask-${Date.now()}-13`,
          title: 'Directory structure',
          description: 'Create organized folder structure',
          completed: false,
          estimatedMinutes: 30
        },
        {
          id: `subtask-${Date.now()}-14`,
          title: 'Package configuration',
          description: 'Set up package.json and dependencies',
          completed: false,
          estimatedMinutes: 45
        },
        {
          id: `subtask-${Date.now()}-15`,
          title: 'TypeScript setup',
          description: 'Configure TypeScript compiler options',
          completed: false,
          estimatedMinutes: 30
        },
        {
          id: `subtask-${Date.now()}-16`,
          title: 'Code quality tools',
          description: 'Set up linting and formatting',
          completed: false,
          estimatedMinutes: 45
        }
      ] : [],
      testingCriteria: this.config.generateTestingCriteria ? {
        unitTests: [],
        integrationTests: [],
        userAcceptanceTests: [
          'Project builds without errors',
          'TypeScript compilation succeeds',
          'Linting passes with no warnings'
        ],
        performanceTests: [
          'Initial build completes within 30 seconds'
        ],
        securityTests: [
          'No sensitive data in version control',
          'Environment variables properly configured'
        ],
        accessibilityTests: [],
        manualTests: [
          'Verify project structure is logical',
          'Test development server startup'
        ]
      } : {
        unitTests: [],
        integrationTests: [],
        userAcceptanceTests: [],
        performanceTests: [],
        securityTests: [],
        accessibilityTests: [],
        manualTests: []
      },
      tools: [
        { name: 'TypeScript', purpose: 'Type safety', implementation: 'Static type checking', required: true },
        { name: 'ESLint', purpose: 'Code linting', implementation: 'Code quality enforcement', required: true },
        { name: 'Prettier', purpose: 'Code formatting', implementation: 'Consistent code style', required: true }
      ]
    });

    return tasks;
  }

  /**
   * Generate atomic success criteria
   */
  private generateAtomicSuccessCriteria(feature: any): any {
    return {
      measurableMetrics: [
        {
          id: `metric-${feature.id}-functionality`,
          name: 'Feature Functionality',
          description: feature.testableOutcome,
          type: 'boolean',
          targetValue: true,
          unit: '',
          automated: true,
          testingMethod: 'Automated testing suite'
        }
      ],
      qualitativeFactors: [
        {
          id: `qual-${feature.id}-value`,
          name: 'User Value Delivery',
          description: feature.userValue,
          importance: feature.priority,
          evaluationMethod: 'User testing and feedback',
          criteria: ['Intuitive interface', 'Fast performance', 'Reliable functionality'],
          maxScore: 10
        }
      ],
      testingRequirements: [
        `${feature.name} works as specified`,
        'Performance meets requirements',
        'User can complete intended workflow'
      ],
      acceptanceCriteria: [
        feature.testableOutcome,
        'All automated tests pass',
        'Code review approved'
      ]
    };
  }

  // Helper methods
  private containsKeywords(prd: PRD, keywords: string[]): boolean {
    const content = `${prd.title} ${prd.description} ${prd.objectives.join(' ')}`.toLowerCase();
    return keywords.some(keyword => content.includes(keyword.toLowerCase()));
  }

  private extractAtomicFeatureName(objective: string): string {
    // Extract actionable feature name
    const cleanedObjective = objective.replace(/^(implement|create|build|develop|add)\s+/i, '');
    const words = cleanedObjective.split(' ');
    return words.slice(0, 4).join(' ').replace(/[^a-zA-Z0-9\s]/g, '');
  }

  private extractUserValue(objective: string): string {
    return `Users can ${objective.toLowerCase().replace(/^(implement|create|build|develop|add)\s+/i, 'use ')}`;
  }

  private generateTestableOutcome(objective: string): string {
    return `Feature completes successfully and provides expected functionality for: ${objective}`;
  }

  private determinePriority(objective: string, index: number): 'Low' | 'Medium' | 'High' | 'Critical' {
    const urgentKeywords = ['auth', 'security', 'login', 'critical', 'essential'];
    const highKeywords = ['core', 'main', 'primary', 'key'];
    
    const lower = objective.toLowerCase();
    
    if (urgentKeywords.some(keyword => lower.includes(keyword))) return 'Critical';
    if (index === 0) return 'Critical'; // First objective is usually critical
    if (highKeywords.some(keyword => lower.includes(keyword)) || index < 2) return 'High';
    if (index < 4) return 'Medium';
    return 'Low';
  }

  private assessComplexity(objective: string): 'Simple' | 'Moderate' | 'Complex' {
    const complexKeywords = ['integration', 'algorithm', 'real-time', 'advanced', 'machine learning'];
    const moderateKeywords = ['api', 'database', 'authentication', 'validation'];
    
    const lower = objective.toLowerCase();
    
    if (complexKeywords.some(keyword => lower.includes(keyword))) return 'Complex';
    if (moderateKeywords.some(keyword => lower.includes(keyword))) return 'Moderate';
    return 'Simple';
  }

  private categorizeFeature(objective: string): string {
    const lower = objective.toLowerCase();
    
    if (lower.includes('auth') || lower.includes('login') || lower.includes('security')) return 'Authentication';
    if (lower.includes('data') || lower.includes('api') || lower.includes('integration')) return 'Data Integration';
    if (lower.includes('ui') || lower.includes('interface') || lower.includes('frontend')) return 'User Interface';
    if (lower.includes('payment') || lower.includes('checkout') || lower.includes('billing')) return 'Payment';
    if (lower.includes('notification') || lower.includes('alert') || lower.includes('email')) return 'Notifications';
    if (lower.includes('search') || lower.includes('filter') || lower.includes('browse')) return 'Search & Discovery';
    
    return 'Core Functionality';
  }

  // Existing helper methods (simplified)
  private detectProjectDomain(prd: PRD): string {
    const content = `${prd.title} ${prd.description} ${prd.objectives.join(' ')}`.toLowerCase();
    
    if (content.includes('crypto') || content.includes('trading') || content.includes('blockchain')) {
      return 'cryptocurrency-trading';
    }
    if (content.includes('ecommerce') || content.includes('shop') || content.includes('store')) {
      return 'ecommerce';
    }
    if (content.includes('social') || content.includes('chat') || content.includes('messaging')) {
      return 'social-platform';
    }
    
    return 'general-web-app';
  }

  private analyzePRD(prd: PRD): ProjectAnalysis {
    const complexity = this.determineComplexity(prd);
    const estimatedDuration = this.estimateProjectDuration(prd);
    const riskLevel = this.assessRiskLevel(prd);
    
    return {
      complexity,
      estimatedDuration,
      riskLevel,
      resourceRequirements: ['Full-stack Developer', 'UI/UX Designer'],
      technicalChallenges: this.identifyTechnicalChallenges(prd),
      recommendations: this.generateProjectRecommendations(prd, complexity)
    };
  }

  private identifyTechnicalChallenges(prd: PRD): string[] {
    const challenges = [];
    const content = `${prd.description} ${prd.objectives.join(' ')}`.toLowerCase();
    
    if (content.includes('real-time')) challenges.push('Real-time data processing');
    if (content.includes('security') || content.includes('auth')) challenges.push('Security implementation');
    if (content.includes('scale') || content.includes('performance')) challenges.push('Performance optimization');
    if (content.includes('integration') || content.includes('api')) challenges.push('Third-party integrations');
    
    return challenges.length > 0 ? challenges : ['Standard web development challenges'];
  }

  private generateProjectRecommendations(prd: PRD, complexity: string): string[] {
    const recommendations = ['Start with core functionality first'];
    
    if (complexity === 'Very High' || complexity === 'High') {
      recommendations.push('Break down into smaller, testable components');
      recommendations.push('Implement comprehensive testing strategy');
    }
    
    if (this.containsKeywords(prd, ['real-time', 'trading', 'financial'])) {
      recommendations.push('Prioritize security and data integrity');
    }
    
    recommendations.push('Focus on user experience and performance');
    
    return recommendations;
  }

  private determineComplexity(prd: PRD): 'Low' | 'Medium' | 'High' | 'Very High' {
    const factors = [
      prd.objectives.length > 5,
      prd.stakeholders.length > 3,
      prd.risks.length > 3,
      prd.description.length > 500,
      this.containsKeywords(prd, ['real-time', 'algorithm', 'trading', 'security', 'integration'])
    ];
    
    const score = factors.filter(Boolean).length;
    if (score >= 4) return 'Very High';
    if (score >= 3) return 'High';
    if (score >= 2) return 'Medium';
    return 'Low';
  }

  private estimateProjectDuration(prd: PRD): string {
    const complexity = this.determineComplexity(prd);
    const objectiveCount = prd.objectives.length;
    
    const baseWeeks = {
      'Low': 3,
      'Medium': 6,
      'High': 12,
      'Very High': 20
    }[complexity];
    
    const adjustedWeeks = baseWeeks + Math.floor(objectiveCount / 3);
    
    if (adjustedWeeks <= 8) return `${adjustedWeeks} weeks`;
    return `${Math.ceil(adjustedWeeks / 4)} months`;
  }

  private assessRiskLevel(prd: PRD): 'Low' | 'Medium' | 'High' | 'Critical' {
    const riskCount = prd.risks.length;
    const hasHighRiskKeywords = this.containsKeywords(prd, ['security', 'real-time', 'financial', 'trading', 'integration']);
    
    if (riskCount >= 5 || hasHighRiskKeywords) return 'Critical';
    if (riskCount >= 3) return 'High';
    if (riskCount >= 1) return 'Medium';
    return 'Low';
  }
}

// Export factory function for easy instantiation
export const createPRDService = (config?: PRDAnalysisConfig): PRDService => {
  return new PRDService(config);
};

// Export types for external use
export type { PRDAnalysisConfig, TaskGenerationResult };