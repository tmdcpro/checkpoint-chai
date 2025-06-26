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
 * Enhanced PRD processing service with domain-aware task generation
 */
export class PRDService {
  private config: Required<PRDAnalysisConfig>;

  constructor(config: PRDAnalysisConfig = {}) {
    this.config = {
      maxDeliverablesPerObjective: config.maxDeliverablesPerObjective ?? 3,
      defaultTasksPerDeliverable: config.defaultTasksPerDeliverable ?? 4,
      includeDetailedSubtasks: config.includeDetailedSubtasks ?? true,
      generateTestingCriteria: config.generateTestingCriteria ?? true,
      ...config
    };
  }

  /**
   * Main entry point for PRD analysis and task generation
   */
  async generateTasksFromPRD(prd: PRD): Promise<TaskGenerationResult> {
    console.log('PRDService: Starting enhanced task generation for PRD:', prd.title);
    
    // Enhanced PRD analysis with domain detection
    const analysis = this.analyzePRD(prd);
    const projectDomain = this.detectProjectDomain(prd);
    
    // Generate domain-specific deliverables
    const deliverables = this.generateDomainSpecificDeliverables(prd, analysis, projectDomain);
    
    const totalTasks = deliverables.reduce((sum, d) => sum + d.tasks.length, 0);
    const estimatedTotalHours = deliverables.reduce((sum, d) => sum + d.estimatedHours, 0);

    const result: TaskGenerationResult = {
      analysis,
      deliverables,
      metadata: {
        totalTasks,
        estimatedTotalHours,
        generatedAt: new Date().toISOString(),
        version: '2.0.0'
      }
    };

    console.log('PRDService: Generated enhanced result:', result);
    return result;
  }

  /**
   * Detect the project domain from PRD content
   */
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
    if (content.includes('analytics') || content.includes('dashboard') || content.includes('data')) {
      return 'analytics-platform';
    }
    if (content.includes('api') || content.includes('service') || content.includes('backend')) {
      return 'api-service';
    }
    
    return 'general-web-app';
  }

  /**
   * Generate domain-specific deliverables based on PRD content
   */
  private generateDomainSpecificDeliverables(
    prd: PRD, 
    analysis: ProjectAnalysis, 
    domain: string
  ): Deliverable[] {
    const deliverables: Deliverable[] = [];
    
    // Extract key features and components from PRD
    const keyFeatures = this.extractKeyFeatures(prd, domain);
    const technicalComponents = this.extractTechnicalComponents(prd, domain);
    
    // Generate feature-based deliverables
    keyFeatures.forEach((feature, index) => {
      const featureDeliverables = this.generateFeatureDeliverables(feature, index, prd, domain);
      deliverables.push(...featureDeliverables);
    });
    
    // Generate technical infrastructure deliverables
    const infraDeliverables = this.generateInfrastructureDeliverables(technicalComponents, prd, domain);
    deliverables.push(...infraDeliverables);
    
    return deliverables;
  }

  /**
   * Extract key features from PRD based on domain
   */
  private extractKeyFeatures(prd: PRD, domain: string): Array<{
    name: string;
    description: string;
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    category: string;
  }> {
    const features: Array<{
      name: string;
      description: string;
      priority: 'Low' | 'Medium' | 'High' | 'Critical';
      category: string;
    }> = [];

    if (domain === 'cryptocurrency-trading') {
      // Extract crypto trading specific features
      if (this.containsKeywords(prd, ['authentication', 'login', 'user', 'account'])) {
        features.push({
          name: 'User Authentication System',
          description: 'Secure user registration, login, and account management with MFA support',
          priority: 'Critical',
          category: 'Authentication'
        });
      }
      
      if (this.containsKeywords(prd, ['market', 'data', 'price', 'chart', 'real-time'])) {
        features.push({
          name: 'Real-time Market Data Integration',
          description: 'Live cryptocurrency price feeds, charts, and market data from multiple exchanges',
          priority: 'Critical',
          category: 'Data Integration'
        });
      }
      
      if (this.containsKeywords(prd, ['strategy', 'algorithm', 'trading', 'builder'])) {
        features.push({
          name: 'Visual Strategy Builder',
          description: 'Drag-and-drop interface for creating algorithmic trading strategies',
          priority: 'High',
          category: 'Strategy Development'
        });
      }
      
      if (this.containsKeywords(prd, ['backtest', 'historical', 'simulation', 'test'])) {
        features.push({
          name: 'Backtesting Engine',
          description: 'Historical strategy testing with comprehensive performance metrics',
          priority: 'High',
          category: 'Analysis'
        });
      }
      
      if (this.containsKeywords(prd, ['paper', 'trading', 'simulation', 'practice'])) {
        features.push({
          name: 'Paper Trading Simulator',
          description: 'Risk-free trading simulation with real market conditions',
          priority: 'Medium',
          category: 'Simulation'
        });
      }
      
      if (this.containsKeywords(prd, ['risk', 'management', 'stop', 'loss', 'position'])) {
        features.push({
          name: 'Risk Management System',
          description: 'Automated risk controls, position sizing, and portfolio protection',
          priority: 'High',
          category: 'Risk Management'
        });
      }
    } else {
      // Generic feature extraction for other domains
      prd.objectives.forEach((objective, index) => {
        features.push({
          name: this.extractFeatureName(objective),
          description: objective,
          priority: index < 2 ? 'High' : index < 4 ? 'Medium' : 'Low',
          category: this.categorizeObjective(objective)
        });
      });
    }

    return features;
  }

  /**
   * Extract technical components from PRD
   */
  private extractTechnicalComponents(prd: PRD, domain: string): Array<{
    name: string;
    description: string;
    type: string;
  }> {
    const components: Array<{
      name: string;
      description: string;
      type: string;
    }> = [];

    if (domain === 'cryptocurrency-trading') {
      components.push(
        {
          name: 'WebSocket Data Streams',
          description: 'Real-time cryptocurrency price and market data streaming',
          type: 'Data Infrastructure'
        },
        {
          name: 'Time-series Database',
          description: 'High-performance storage for historical market data',
          type: 'Database'
        },
        {
          name: 'Strategy Execution Engine',
          description: 'Core engine for executing trading strategies and algorithms',
          type: 'Business Logic'
        },
        {
          name: 'API Gateway',
          description: 'Secure API gateway with rate limiting and authentication',
          type: 'Infrastructure'
        }
      );
    }

    return components;
  }

  /**
   * Generate deliverables for a specific feature
   */
  private generateFeatureDeliverables(
    feature: { name: string; description: string; priority: any; category: string },
    index: number,
    prd: PRD,
    domain: string
  ): Deliverable[] {
    const deliverables: Deliverable[] = [];
    
    // Generate implementation phases for the feature
    const phases = this.getFeatureImplementationPhases(feature, domain);
    
    phases.forEach((phase, phaseIndex) => {
      const deliverable: Deliverable = {
        id: `feature-${this.slugify(feature.name)}-${phaseIndex + 1}`,
        title: `${phase.name}: ${feature.name}`,
        description: phase.description,
        category: feature.category,
        priority: feature.priority,
        estimatedHours: phase.estimatedHours,
        dependencies: this.calculatePhaseDependencies(index, phaseIndex, phases.length),
        tasks: this.generateFeatureTasks(feature, phase, domain),
        successCriteria: this.generateFeatureSuccessCriteria(feature, phase),
        status: 'Not Started'
      };
      
      deliverables.push(deliverable);
    });
    
    return deliverables;
  }

  /**
   * Get implementation phases for a feature based on domain
   */
  private getFeatureImplementationPhases(
    feature: { name: string; description: string; category: string },
    domain: string
  ): Array<{
    name: string;
    description: string;
    estimatedHours: number;
  }> {
    if (domain === 'cryptocurrency-trading') {
      if (feature.category === 'Authentication') {
        return [
          {
            name: 'Backend Authentication',
            description: 'Implement secure user authentication APIs with JWT tokens and MFA support',
            estimatedHours: 24
          },
          {
            name: 'Frontend Authentication UI',
            description: 'Build responsive login/registration forms with security features',
            estimatedHours: 16
          }
        ];
      }
      
      if (feature.category === 'Data Integration') {
        return [
          {
            name: 'Data Pipeline Setup',
            description: 'Configure real-time data ingestion from cryptocurrency exchanges',
            estimatedHours: 20
          },
          {
            name: 'Chart Visualization',
            description: 'Implement interactive candlestick charts with technical indicators',
            estimatedHours: 28
          }
        ];
      }
      
      if (feature.category === 'Strategy Development') {
        return [
          {
            name: 'Strategy Engine Core',
            description: 'Build the core strategy execution and validation engine',
            estimatedHours: 32
          },
          {
            name: 'Visual Builder Interface',
            description: 'Create drag-and-drop strategy builder with condition blocks',
            estimatedHours: 36
          }
        ];
      }
      
      if (feature.category === 'Analysis') {
        return [
          {
            name: 'Backtesting Algorithm',
            description: 'Implement high-performance backtesting with historical data',
            estimatedHours: 28
          },
          {
            name: 'Performance Analytics',
            description: 'Build comprehensive performance metrics and reporting',
            estimatedHours: 20
          }
        ];
      }
    }
    
    // Default phases for other domains
    return [
      {
        name: 'Backend Implementation',
        description: `Implement backend services and APIs for ${feature.name}`,
        estimatedHours: 20
      },
      {
        name: 'Frontend Implementation',
        description: `Build user interface and interactions for ${feature.name}`,
        estimatedHours: 16
      }
    ];
  }

  /**
   * Generate specific tasks for a feature phase
   */
  private generateFeatureTasks(
    feature: { name: string; description: string; category: string },
    phase: { name: string; description: string; estimatedHours: number },
    domain: string
  ): Task[] {
    const tasks: Task[] = [];
    const taskTemplates = this.getTaskTemplatesForFeaturePhase(feature, phase, domain);
    
    taskTemplates.forEach((template, index) => {
      const task: Task = {
        id: `${this.slugify(feature.name)}-${this.slugify(phase.name)}-task-${index + 1}`,
        title: template.title,
        description: template.description,
        instructions: template.instructions,
        estimatedHours: template.estimatedHours,
        priority: template.priority,
        status: 'Not Started',
        dependencies: index > 0 ? [`${this.slugify(feature.name)}-${this.slugify(phase.name)}-task-${index}`] : [],
        subtasks: template.subtasks,
        testingCriteria: template.testingCriteria,
        tools: template.tools
      };
      
      tasks.push(task);
    });
    
    return tasks;
  }

  /**
   * Get task templates for specific feature phases
   */
  private getTaskTemplatesForFeaturePhase(
    feature: { name: string; description: string; category: string },
    phase: { name: string; description: string; estimatedHours: number },
    domain: string
  ): Array<{
    title: string;
    description: string;
    instructions: string[];
    estimatedHours: number;
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    subtasks: Array<{
      id: string;
      title: string;
      description: string;
      completed: boolean;
      estimatedMinutes: number;
    }>;
    testingCriteria: any;
    tools: Array<{
      name: string;
      purpose: string;
      implementation: string;
      required: boolean;
    }>;
  }> {
    if (domain === 'cryptocurrency-trading') {
      if (feature.category === 'Authentication' && phase.name === 'Backend Authentication') {
        return [
          {
            title: 'Implement User Registration API',
            description: 'Create secure user registration endpoint with email verification and password validation',
            instructions: [
              'Design user database schema with proper indexing',
              'Implement password hashing using bcrypt with salt rounds',
              'Add email verification workflow with secure tokens',
              'Create input validation and sanitization middleware'
            ],
            estimatedHours: 8,
            priority: 'Critical',
            subtasks: [
              {
                id: 'subtask-1',
                title: 'Database schema design',
                description: 'Create users table with proper constraints and indexes',
                completed: false,
                estimatedMinutes: 90
              },
              {
                id: 'subtask-2',
                title: 'Password hashing implementation',
                description: 'Implement secure password hashing with bcrypt',
                completed: false,
                estimatedMinutes: 60
              },
              {
                id: 'subtask-3',
                title: 'Email verification system',
                description: 'Build email verification workflow',
                completed: false,
                estimatedMinutes: 120
              },
              {
                id: 'subtask-4',
                title: 'Input validation middleware',
                description: 'Create comprehensive input validation',
                completed: false,
                estimatedMinutes: 90
              }
            ],
            testingCriteria: {
              unitTests: [
                'Password hashing and verification',
                'Email validation logic',
                'Input sanitization functions'
              ],
              integrationTests: [
                'Registration API endpoint',
                'Email verification flow',
                'Database operations'
              ],
              userAcceptanceTests: [
                'User can register with valid email and password',
                'Email verification link works correctly',
                'Invalid inputs are properly rejected'
              ],
              performanceTests: [
                'Registration completes within 2 seconds',
                'Password hashing performance under load'
              ],
              securityTests: [
                'SQL injection prevention',
                'Password strength enforcement',
                'Rate limiting on registration attempts'
              ],
              accessibilityTests: [],
              manualTests: [
                'Manual registration flow testing',
                'Email delivery verification'
              ]
            },
            tools: [
              {
                name: 'bcrypt',
                purpose: 'Password hashing',
                implementation: 'Secure password storage with salt',
                required: true
              },
              {
                name: 'joi',
                purpose: 'Input validation',
                implementation: 'Schema-based validation middleware',
                required: true
              },
              {
                name: 'nodemailer',
                purpose: 'Email sending',
                implementation: 'Email verification system',
                required: true
              }
            ]
          },
          {
            title: 'Implement JWT Authentication System',
            description: 'Build JWT token generation, validation, and refresh token mechanism',
            instructions: [
              'Set up JWT token generation with proper claims and expiration',
              'Implement token validation middleware for protected routes',
              'Create refresh token mechanism for seamless user experience',
              'Add token blacklisting for secure logout functionality'
            ],
            estimatedHours: 10,
            priority: 'Critical',
            subtasks: [
              {
                id: 'subtask-1',
                title: 'JWT token generation',
                description: 'Implement secure JWT token creation',
                completed: false,
                estimatedMinutes: 120
              },
              {
                id: 'subtask-2',
                title: 'Token validation middleware',
                description: 'Create middleware for route protection',
                completed: false,
                estimatedMinutes: 90
              },
              {
                id: 'subtask-3',
                title: 'Refresh token system',
                description: 'Implement automatic token refresh',
                completed: false,
                estimatedMinutes: 150
              },
              {
                id: 'subtask-4',
                title: 'Token blacklisting',
                description: 'Add secure logout with token invalidation',
                completed: false,
                estimatedMinutes: 90
              }
            ],
            testingCriteria: {
              unitTests: [
                'JWT token generation and validation',
                'Refresh token logic',
                'Token blacklisting functionality'
              ],
              integrationTests: [
                'Protected route access',
                'Token refresh flow',
                'Logout and token invalidation'
              ],
              userAcceptanceTests: [
                'User stays logged in across sessions',
                'Automatic token refresh works seamlessly',
                'Logout properly invalidates tokens'
              ],
              performanceTests: [
                'Token validation under high load',
                'Refresh token performance'
              ],
              securityTests: [
                'Token tampering detection',
                'Expired token rejection',
                'Blacklisted token validation'
              ],
              accessibilityTests: [],
              manualTests: [
                'Manual authentication flow testing',
                'Token expiration handling'
              ]
            },
            tools: [
              {
                name: 'jsonwebtoken',
                purpose: 'JWT token management',
                implementation: 'Token generation and validation',
                required: true
              },
              {
                name: 'Redis',
                purpose: 'Token blacklisting',
                implementation: 'Fast token invalidation storage',
                required: true
              }
            ]
          },
          {
            title: 'Implement Multi-Factor Authentication',
            description: 'Add TOTP-based MFA support with backup codes and recovery options',
            instructions: [
              'Integrate TOTP library for authenticator app support',
              'Generate and validate backup recovery codes',
              'Create MFA enrollment and verification flows',
              'Add MFA requirement enforcement for sensitive operations'
            ],
            estimatedHours: 6,
            priority: 'High',
            subtasks: [
              {
                id: 'subtask-1',
                title: 'TOTP integration',
                description: 'Implement authenticator app support',
                completed: false,
                estimatedMinutes: 120
              },
              {
                id: 'subtask-2',
                title: 'Backup codes system',
                description: 'Generate and manage recovery codes',
                completed: false,
                estimatedMinutes: 90
              },
              {
                id: 'subtask-3',
                title: 'MFA enrollment flow',
                description: 'Create user-friendly MFA setup process',
                completed: false,
                estimatedMinutes: 90
              },
              {
                id: 'subtask-4',
                title: 'MFA enforcement',
                description: 'Require MFA for sensitive operations',
                completed: false,
                estimatedMinutes: 60
              }
            ],
            testingCriteria: {
              unitTests: [
                'TOTP generation and validation',
                'Backup code generation and verification',
                'MFA enforcement logic'
              ],
              integrationTests: [
                'MFA enrollment API',
                'MFA verification flow',
                'Backup code usage'
              ],
              userAcceptanceTests: [
                'User can set up MFA with authenticator app',
                'Backup codes work for account recovery',
                'MFA is required for sensitive operations'
              ],
              performanceTests: [
                'TOTP validation performance',
                'MFA flow completion time'
              ],
              securityTests: [
                'TOTP secret protection',
                'Backup code security',
                'MFA bypass prevention'
              ],
              accessibilityTests: [
                'MFA setup accessibility',
                'Screen reader compatibility'
              ],
              manualTests: [
                'Manual MFA setup testing',
                'Recovery code validation'
              ]
            },
            tools: [
              {
                name: 'speakeasy',
                purpose: 'TOTP implementation',
                implementation: 'Authenticator app integration',
                required: true
              },
              {
                name: 'qrcode',
                purpose: 'QR code generation',
                implementation: 'MFA setup QR codes',
                required: true
              }
            ]
          }
        ];
      }
      
      if (feature.category === 'Data Integration' && phase.name === 'Data Pipeline Setup') {
        return [
          {
            title: 'Integrate Binance WebSocket API',
            description: 'Establish real-time connection to Binance for live cryptocurrency price feeds',
            instructions: [
              'Set up WebSocket connection with automatic reconnection logic',
              'Implement data parsing and normalization for price feeds',
              'Add connection health monitoring and error handling',
              'Create subscription management for multiple trading pairs'
            ],
            estimatedHours: 8,
            priority: 'Critical',
            subtasks: [
              {
                id: 'subtask-1',
                title: 'WebSocket connection setup',
                description: 'Establish stable connection to Binance API',
                completed: false,
                estimatedMinutes: 120
              },
              {
                id: 'subtask-2',
                title: 'Data parsing and normalization',
                description: 'Process incoming price data into standard format',
                completed: false,
                estimatedMinutes: 90
              },
              {
                id: 'subtask-3',
                title: 'Connection monitoring',
                description: 'Implement health checks and reconnection logic',
                completed: false,
                estimatedMinutes: 90
              },
              {
                id: 'subtask-4',
                title: 'Subscription management',
                description: 'Handle multiple trading pair subscriptions',
                completed: false,
                estimatedMinutes: 60
              }
            ],
            testingCriteria: {
              unitTests: [
                'Data parsing functions',
                'Connection management logic',
                'Subscription handling'
              ],
              integrationTests: [
                'Binance API connection',
                'Data flow validation',
                'Reconnection scenarios'
              ],
              userAcceptanceTests: [
                'Real-time price updates display correctly',
                'Connection remains stable during market volatility',
                'Multiple trading pairs update simultaneously'
              ],
              performanceTests: [
                'Data processing latency under 50ms',
                'Memory usage optimization',
                'Connection stability under load'
              ],
              securityTests: [
                'API key protection',
                'Data integrity validation'
              ],
              accessibilityTests: [],
              manualTests: [
                'Manual connection testing',
                'Data accuracy verification'
              ]
            },
            tools: [
              {
                name: 'ws',
                purpose: 'WebSocket client',
                implementation: 'Real-time data connection',
                required: true
              },
              {
                name: 'binance-api-node',
                purpose: 'Binance API integration',
                implementation: 'Exchange data access',
                required: true
              }
            ]
          }
        ];
      }
    }
    
    // Default generic tasks
    return [
      {
        title: `Implement ${feature.name} Core Logic`,
        description: `Build the core functionality for ${feature.name}`,
        instructions: [
          'Design and implement core business logic',
          'Add proper error handling and validation',
          'Implement comprehensive logging',
          'Add performance monitoring'
        ],
        estimatedHours: Math.floor(phase.estimatedHours * 0.6),
        priority: 'High',
        subtasks: [
          {
            id: 'subtask-1',
            title: 'Core implementation',
            description: 'Build main functionality',
            completed: false,
            estimatedMinutes: Math.floor(phase.estimatedHours * 0.6 * 60 * 0.7)
          },
          {
            id: 'subtask-2',
            title: 'Error handling',
            description: 'Add comprehensive error handling',
            completed: false,
            estimatedMinutes: Math.floor(phase.estimatedHours * 0.6 * 60 * 0.3)
          }
        ],
        testingCriteria: {
          unitTests: ['Core functionality tests'],
          integrationTests: ['Integration with other components'],
          userAcceptanceTests: ['Feature works as expected'],
          performanceTests: ['Performance meets requirements'],
          securityTests: ['Security validation'],
          accessibilityTests: [],
          manualTests: ['Manual feature testing']
        },
        tools: [
          {
            name: 'Development Framework',
            purpose: 'Core development',
            implementation: 'Feature implementation',
            required: true
          }
        ]
      }
    ];
  }

  /**
   * Generate infrastructure deliverables
   */
  private generateInfrastructureDeliverables(
    components: Array<{ name: string; description: string; type: string }>,
    prd: PRD,
    domain: string
  ): Deliverable[] {
    const deliverables: Deliverable[] = [];
    
    // Always include project setup
    deliverables.push({
      id: 'infrastructure-setup',
      title: 'Project Infrastructure Setup',
      description: 'Set up development environment, CI/CD pipeline, and deployment infrastructure',
      category: 'Infrastructure',
      priority: 'Critical',
      estimatedHours: 16,
      dependencies: [],
      tasks: this.generateInfrastructureTasks(domain),
      successCriteria: this.generateInfrastructureSuccessCriteria(),
      status: 'Not Started'
    });
    
    return deliverables;
  }

  /**
   * Generate infrastructure tasks based on domain
   */
  private generateInfrastructureTasks(domain: string): Task[] {
    if (domain === 'cryptocurrency-trading') {
      return [
        {
          id: 'infra-task-1',
          title: 'Set up Development Environment',
          description: 'Configure local development environment with all necessary tools and dependencies',
          instructions: [
            'Set up Node.js and npm/yarn package management',
            'Configure TypeScript with strict type checking',
            'Set up React development environment with hot reloading',
            'Configure ESLint and Prettier for code quality'
          ],
          estimatedHours: 4,
          priority: 'Critical',
          status: 'Not Started',
          dependencies: [],
          subtasks: [
            {
              id: 'subtask-1',
              title: 'Node.js setup',
              description: 'Install and configure Node.js environment',
              completed: false,
              estimatedMinutes: 60
            },
            {
              id: 'subtask-2',
              title: 'TypeScript configuration',
              description: 'Set up TypeScript with proper configuration',
              completed: false,
              estimatedMinutes: 90
            },
            {
              id: 'subtask-3',
              title: 'React environment',
              description: 'Configure React development setup',
              completed: false,
              estimatedMinutes: 60
            },
            {
              id: 'subtask-4',
              title: 'Code quality tools',
              description: 'Set up linting and formatting tools',
              completed: false,
              estimatedMinutes: 30
            }
          ],
          testingCriteria: {
            unitTests: [],
            integrationTests: [],
            userAcceptanceTests: [
              'Development server starts without errors',
              'Hot reloading works correctly',
              'TypeScript compilation succeeds'
            ],
            performanceTests: [
              'Development build completes in under 30 seconds'
            ],
            securityTests: [],
            accessibilityTests: [],
            manualTests: [
              'Manual verification of development environment'
            ]
          },
          tools: [
            {
              name: 'Node.js',
              purpose: 'JavaScript runtime',
              implementation: 'Backend and build tools',
              required: true
            },
            {
              name: 'TypeScript',
              purpose: 'Type safety',
              implementation: 'Static type checking',
              required: true
            },
            {
              name: 'React',
              purpose: 'Frontend framework',
              implementation: 'User interface development',
              required: true
            }
          ]
        },
        {
          id: 'infra-task-2',
          title: 'Configure Database Infrastructure',
          description: 'Set up PostgreSQL for user data and InfluxDB for time-series market data',
          instructions: [
            'Set up PostgreSQL database with proper schema design',
            'Configure InfluxDB for high-performance time-series data',
            'Implement database connection pooling and optimization',
            'Set up database migrations and backup strategies'
          ],
          estimatedHours: 6,
          priority: 'High',
          status: 'Not Started',
          dependencies: ['infra-task-1'],
          subtasks: [
            {
              id: 'subtask-1',
              title: 'PostgreSQL setup',
              description: 'Configure relational database',
              completed: false,
              estimatedMinutes: 120
            },
            {
              id: 'subtask-2',
              title: 'InfluxDB configuration',
              description: 'Set up time-series database',
              completed: false,
              estimatedMinutes: 90
            },
            {
              id: 'subtask-3',
              title: 'Connection pooling',
              description: 'Optimize database connections',
              completed: false,
              estimatedMinutes: 60
            },
            {
              id: 'subtask-4',
              title: 'Migration system',
              description: 'Set up database migration tools',
              completed: false,
              estimatedMinutes: 90
            }
          ],
          testingCriteria: {
            unitTests: [
              'Database connection functions',
              'Migration scripts'
            ],
            integrationTests: [
              'Database connectivity',
              'Data persistence',
              'Query performance'
            ],
            userAcceptanceTests: [
              'Database accepts and retrieves data correctly',
              'Migrations run without errors'
            ],
            performanceTests: [
              'Query response time under 100ms',
              'Connection pool efficiency'
            ],
            securityTests: [
              'Database access controls',
              'SQL injection prevention'
            ],
            accessibilityTests: [],
            manualTests: [
              'Manual database operation testing'
            ]
          },
          tools: [
            {
              name: 'PostgreSQL',
              purpose: 'Relational database',
              implementation: 'User and application data storage',
              required: true
            },
            {
              name: 'InfluxDB',
              purpose: 'Time-series database',
              implementation: 'Market data storage',
              required: true
            },
            {
              name: 'Prisma',
              purpose: 'Database ORM',
              implementation: 'Type-safe database access',
              required: true
            }
          ]
        }
      ];
    }
    
    return [
      {
        id: 'infra-task-1',
        title: 'Project Setup and Configuration',
        description: 'Initialize project structure and development environment',
        instructions: [
          'Set up project repository and folder structure',
          'Configure package.json with necessary dependencies',
          'Set up development and build scripts',
          'Configure environment variables and settings'
        ],
        estimatedHours: 4,
        priority: 'Critical',
        status: 'Not Started',
        dependencies: [],
        subtasks: [
          {
            id: 'subtask-1',
            title: 'Repository setup',
            description: 'Initialize git repository and project structure',
            completed: false,
            estimatedMinutes: 60
          },
          {
            id: 'subtask-2',
            title: 'Dependencies configuration',
            description: 'Set up package.json and install dependencies',
            completed: false,
            estimatedMinutes: 90
          }
        ],
        testingCriteria: {
          unitTests: [],
          integrationTests: [],
          userAcceptanceTests: ['Project builds successfully'],
          performanceTests: [],
          securityTests: [],
          accessibilityTests: [],
          manualTests: ['Manual project setup verification']
        },
        tools: [
          {
            name: 'Git',
            purpose: 'Version control',
            implementation: 'Source code management',
            required: true
          }
        ]
      }
    ];
  }

  // Helper methods
  private containsKeywords(prd: PRD, keywords: string[]): boolean {
    const content = `${prd.title} ${prd.description} ${prd.objectives.join(' ')}`.toLowerCase();
    return keywords.some(keyword => content.includes(keyword.toLowerCase()));
  }

  private extractFeatureName(objective: string): string {
    // Extract a clean feature name from objective
    const words = objective.split(' ');
    if (words.length <= 3) return objective;
    
    // Take first few meaningful words
    const meaningfulWords = words.filter(word => 
      !['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'].includes(word.toLowerCase())
    );
    
    return meaningfulWords.slice(0, 3).join(' ');
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private calculatePhaseDependencies(featureIndex: number, phaseIndex: number, totalPhases: number): string[] {
    const dependencies: string[] = [];
    
    // Previous phase in same feature
    if (phaseIndex > 0) {
      // This would need the actual feature name, but for now we'll keep it simple
    }
    
    // Infrastructure dependency for first feature
    if (featureIndex === 0 && phaseIndex === 0) {
      dependencies.push('infrastructure-setup');
    }
    
    return dependencies;
  }

  private generateFeatureSuccessCriteria(
    feature: { name: string; description: string; category: string },
    phase: { name: string; description: string; estimatedHours: number }
  ): any {
    return {
      measurableMetrics: [
        {
          id: 'metric-functionality',
          name: 'Feature Functionality',
          description: `${feature.name} works as specified`,
          type: 'boolean',
          targetValue: true,
          unit: '',
          automated: false,
          testingMethod: 'Manual testing and automated tests'
        },
        {
          id: 'metric-performance',
          name: 'Performance Benchmark',
          description: `${phase.name} meets performance requirements`,
          type: 'numerical',
          targetValue: 200,
          unit: 'ms',
          automated: true,
          testingMethod: 'Automated performance testing'
        }
      ],
      qualitativeFactors: [
        {
          id: 'qual-usability',
          name: 'User Experience Quality',
          description: `${feature.name} provides excellent user experience`,
          importance: 'High',
          evaluationMethod: 'User testing and feedback',
          criteria: ['Intuitive interface', 'Responsive design', 'Error handling'],
          maxScore: 10
        }
      ],
      testingRequirements: [
        `All ${feature.name} functionality tested`,
        'Performance benchmarks met',
        'Security requirements validated'
      ],
      acceptanceCriteria: [
        `${feature.name} works according to specifications`,
        'All tests pass successfully',
        'Code review completed and approved'
      ]
    };
  }

  private generateInfrastructureSuccessCriteria(): any {
    return {
      measurableMetrics: [
        {
          id: 'metric-setup-time',
          name: 'Setup Completion Time',
          description: 'Time to complete infrastructure setup',
          type: 'numerical',
          targetValue: 30,
          unit: 'minutes',
          automated: false,
          testingMethod: 'Manual timing of setup process'
        }
      ],
      qualitativeFactors: [
        {
          id: 'qual-reliability',
          name: 'Infrastructure Reliability',
          description: 'Stability and reliability of development environment',
          importance: 'Critical',
          evaluationMethod: 'Development team feedback',
          criteria: ['Stable builds', 'Fast development cycles', 'Easy deployment'],
          maxScore: 10
        }
      ],
      testingRequirements: [
        'All development tools working',
        'Build process successful',
        'Deployment pipeline functional'
      ],
      acceptanceCriteria: [
        'Development environment fully functional',
        'All team members can build and run project',
        'CI/CD pipeline operational'
      ]
    };
  }

  // Existing helper methods (simplified versions)
  private analyzePRD(prd: PRD): ProjectAnalysis {
    const complexity = this.determineComplexity(prd);
    const estimatedDuration = this.estimateProjectDuration(prd);
    const riskLevel = this.assessRiskLevel(prd);
    
    return {
      complexity,
      estimatedDuration,
      riskLevel,
      resourceRequirements: ['Full-stack Developer', 'DevOps Engineer', 'UI/UX Designer'],
      technicalChallenges: ['Real-time data processing', 'Security implementation', 'Performance optimization'],
      recommendations: ['Use microservices architecture', 'Implement comprehensive testing', 'Focus on security']
    };
  }

  private determineComplexity(prd: PRD): 'Low' | 'Medium' | 'High' | 'Very High' {
    const factors = [
      prd.objectives.length > 5,
      prd.stakeholders.length > 3,
      prd.risks.length > 3,
      prd.description.length > 500,
      this.containsKeywords(prd, ['real-time', 'algorithm', 'trading', 'security'])
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
      'Low': 4,
      'Medium': 8,
      'High': 16,
      'Very High': 24
    }[complexity];
    
    const adjustedWeeks = baseWeeks + Math.floor(objectiveCount / 2);
    
    if (adjustedWeeks <= 8) return `${adjustedWeeks} weeks`;
    return `${Math.ceil(adjustedWeeks / 4)} months`;
  }

  private assessRiskLevel(prd: PRD): 'Low' | 'Medium' | 'High' | 'Critical' {
    const riskCount = prd.risks.length;
    const hasHighRiskKeywords = this.containsKeywords(prd, ['security', 'real-time', 'financial', 'trading']);
    
    if (riskCount >= 5 || hasHighRiskKeywords) return 'Critical';
    if (riskCount >= 3) return 'High';
    if (riskCount >= 1) return 'Medium';
    return 'Low';
  }

  private categorizeObjective(objective: string): string {
    const lower = objective.toLowerCase();
    if (lower.includes('auth') || lower.includes('login') || lower.includes('security')) return 'Authentication';
    if (lower.includes('data') || lower.includes('api') || lower.includes('integration')) return 'Data Integration';
    if (lower.includes('ui') || lower.includes('interface') || lower.includes('design')) return 'User Interface';
    if (lower.includes('test') || lower.includes('quality')) return 'Testing';
    return 'General';
  }
}

// Export factory function for easy instantiation
export const createPRDService = (config?: PRDAnalysisConfig): PRDService => {
  return new PRDService(config);
};

// Export types for external use
export type { PRDAnalysisConfig, TaskGenerationResult };