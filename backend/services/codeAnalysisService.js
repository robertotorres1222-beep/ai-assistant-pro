const winston = require('winston');
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class CodeAnalysisService {
  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [new winston.transports.Console()]
    });

    // Supported languages and their analysis capabilities
    this.supportedLanguages = {
      javascript: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
        linters: ['eslint', 'jshint'],
        complexity: true,
        security: true,
        performance: true
      },
      python: {
        extensions: ['.py'],
        linters: ['pylint', 'flake8'],
        complexity: true,
        security: true,
        performance: true
      },
      java: {
        extensions: ['.java'],
        linters: ['checkstyle', 'pmd'],
        complexity: true,
        security: true,
        performance: true
      },
      cpp: {
        extensions: ['.cpp', '.c', '.h'],
        linters: ['cppcheck'],
        complexity: true,
        security: true,
        performance: true
      },
      go: {
        extensions: ['.go'],
        linters: ['golint', 'go vet'],
        complexity: true,
        security: true,
        performance: true
      }
    };

    // Analysis patterns and rules
    this.analysisPatterns = {
      security: this.initializeSecurityPatterns(),
      performance: this.initializePerformancePatterns(),
      maintainability: this.initializeMaintainabilityPatterns(),
      complexity: this.initializeComplexityPatterns()
    };

    // Code quality metrics
    this.qualityMetrics = {
      cyclomaticComplexity: this.calculateCyclomaticComplexity.bind(this),
      codeSmells: this.detectCodeSmells.bind(this),
      duplicateCode: this.detectDuplicateCode.bind(this),
      testCoverage: this.estimateTestCoverage.bind(this)
    };

    this.logger.info('🔍 Code Analysis Service initialized with comprehensive analysis capabilities');
  }

  async analyzeCode({ code, language, analysisType = 'comprehensive', deepAnalysis = false }) {
    const startTime = Date.now();
    
    try {
      // Validate input
      if (!code || !language) {
        throw new Error('Code and language are required');
      }

      if (!this.supportedLanguages[language.toLowerCase()]) {
        throw new Error(`Unsupported language: ${language}`);
      }

      const normalizedLanguage = language.toLowerCase();
      
      // Step 1: Basic syntax and structure analysis
      const syntaxAnalysis = await this.analyzeSyntax(code, normalizedLanguage);
      
      // Step 2: Security vulnerability analysis
      const securityAnalysis = await this.analyzeSecurityIssues(code, normalizedLanguage);
      
      // Step 3: Performance analysis
      const performanceAnalysis = await this.analyzePerformance(code, normalizedLanguage);
      
      // Step 4: Maintainability analysis
      const maintainabilityAnalysis = await this.analyzeMaintainability(code, normalizedLanguage);
      
      // Step 5: Complexity analysis
      const complexityAnalysis = await this.analyzeComplexity(code, normalizedLanguage);
      
      // Step 6: Generate suggestions
      const suggestions = await this.generateSuggestions(
        code, 
        normalizedLanguage, 
        { syntaxAnalysis, securityAnalysis, performanceAnalysis, maintainabilityAnalysis, complexityAnalysis }
      );

      // Step 7: Deep analysis if requested
      let deepAnalysisResults = null;
      if (deepAnalysis) {
        deepAnalysisResults = await this.performDeepAnalysis(code, normalizedLanguage);
      }

      const processingTime = Date.now() - startTime;
      const tokens = this.estimateTokens(code);
      
      return {
        result: this.formatAnalysisResult({
          syntaxAnalysis,
          securityAnalysis,
          performanceAnalysis,
          maintainabilityAnalysis,
          complexityAnalysis,
          deepAnalysisResults
        }),
        suggestions,
        securityIssues: securityAnalysis.issues,
        performanceInsights: performanceAnalysis.insights,
        maintainabilityScore: maintainabilityAnalysis.score,
        complexityAnalysis: complexityAnalysis.metrics,
        tokens,
        cost: this.calculateAnalysisCost(tokens, deepAnalysis),
        processingTime,
        language: normalizedLanguage,
        analysisType
      };

    } catch (error) {
      this.logger.error('Code analysis error:', error);
      throw new Error(`Code analysis failed: ${error.message}`);
    }
  }

  async analyzeSyntax(code, language) {
    const analysis = {
      valid: true,
      errors: [],
      warnings: [],
      lineCount: code.split('\n').length,
      characterCount: code.length,
      structure: {}
    };

    try {
      // Language-specific syntax analysis
      switch (language) {
        case 'javascript':
          analysis.structure = this.analyzeJavaScriptStructure(code);
          break;
        case 'python':
          analysis.structure = this.analyzePythonStructure(code);
          break;
        case 'java':
          analysis.structure = this.analyzeJavaStructure(code);
          break;
        default:
          analysis.structure = this.analyzeGenericStructure(code);
      }

      // Check for common syntax issues
      analysis.errors = this.detectSyntaxErrors(code, language);
      analysis.warnings = this.detectSyntaxWarnings(code, language);
      analysis.valid = analysis.errors.length === 0;

    } catch (error) {
      analysis.valid = false;
      analysis.errors.push({
        type: 'syntax_error',
        message: error.message,
        severity: 'high'
      });
    }

    return analysis;
  }

  analyzeJavaScriptStructure(code) {
    const structure = {
      functions: [],
      classes: [],
      variables: [],
      imports: [],
      exports: []
    };

    // Extract functions
    const functionRegex = /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s+)?\(|(\w+)\s*:\s*(?:async\s+)?function)/g;
    let match;
    while ((match = functionRegex.exec(code)) !== null) {
      const functionName = match[1] || match[2] || match[3];
      if (functionName) {
        structure.functions.push({
          name: functionName,
          line: code.substring(0, match.index).split('\n').length,
          type: match[1] ? 'declaration' : 'expression'
        });
      }
    }

    // Extract classes
    const classRegex = /class\s+(\w+)/g;
    while ((match = classRegex.exec(code)) !== null) {
      structure.classes.push({
        name: match[1],
        line: code.substring(0, match.index).split('\n').length
      });
    }

    // Extract variables
    const variableRegex = /(?:const|let|var)\s+(\w+)/g;
    while ((match = variableRegex.exec(code)) !== null) {
      structure.variables.push({
        name: match[1],
        line: code.substring(0, match.index).split('\n').length
      });
    }

    return structure;
  }

  analyzePythonStructure(code) {
    const structure = {
      functions: [],
      classes: [],
      variables: [],
      imports: []
    };

    // Extract functions
    const functionRegex = /def\s+(\w+)/g;
    let match;
    while ((match = functionRegex.exec(code)) !== null) {
      structure.functions.push({
        name: match[1],
        line: code.substring(0, match.index).split('\n').length
      });
    }

    // Extract classes
    const classRegex = /class\s+(\w+)/g;
    while ((match = classRegex.exec(code)) !== null) {
      structure.classes.push({
        name: match[1],
        line: code.substring(0, match.index).split('\n').length
      });
    }

    return structure;
  }

  analyzeJavaStructure(code) {
    const structure = {
      classes: [],
      methods: [],
      fields: [],
      imports: []
    };

    // Extract classes
    const classRegex = /(?:public\s+)?class\s+(\w+)/g;
    let match;
    while ((match = classRegex.exec(code)) !== null) {
      structure.classes.push({
        name: match[1],
        line: code.substring(0, match.index).split('\n').length
      });
    }

    // Extract methods
    const methodRegex = /(?:public|private|protected)?\s*(?:static\s+)?(?:\w+\s+)?(\w+)\s*\([^)]*\)\s*{/g;
    while ((match = methodRegex.exec(code)) !== null) {
      structure.methods.push({
        name: match[1],
        line: code.substring(0, match.index).split('\n').length
      });
    }

    return structure;
  }

  analyzeGenericStructure(code) {
    return {
      lineCount: code.split('\n').length,
      wordCount: code.split(/\s+/).length,
      characterCount: code.length
    };
  }

  detectSyntaxErrors(code, language) {
    const errors = [];
    
    // Common syntax error patterns
    const errorPatterns = {
      javascript: [
        { pattern: /\)\s*{[^}]*$/, message: 'Unclosed brace', severity: 'high' },
        { pattern: /\([^)]*$/, message: 'Unclosed parenthesis', severity: 'high' },
        { pattern: /=\s*$/, message: 'Incomplete assignment', severity: 'medium' }
      ],
      python: [
        { pattern: /:\s*$/, message: 'Empty code block after colon', severity: 'medium' },
        { pattern: /def\s+\w+\([^)]*$/, message: 'Incomplete function definition', severity: 'high' }
      ]
    };

    const patterns = errorPatterns[language] || [];
    const lines = code.split('\n');
    
    lines.forEach((line, index) => {
      patterns.forEach(({ pattern, message, severity }) => {
        if (pattern.test(line)) {
          errors.push({
            type: 'syntax_error',
            message,
            severity,
            line: index + 1,
            code: line.trim()
          });
        }
      });
    });

    return errors;
  }

  detectSyntaxWarnings(code, language) {
    const warnings = [];
    
    // Common warning patterns
    const warningPatterns = {
      javascript: [
        { pattern: /console\.log/, message: 'Console.log statement found', severity: 'low' },
        { pattern: /var\s+/, message: 'Use const/let instead of var', severity: 'medium' },
        { pattern: /==\s*/, message: 'Use === for strict equality', severity: 'medium' }
      ],
      python: [
        { pattern: /print\s*\(/, message: 'Print statement found', severity: 'low' },
        { pattern: /import\s+\*/, message: 'Avoid wildcard imports', severity: 'medium' }
      ]
    };

    const patterns = warningPatterns[language] || [];
    const lines = code.split('\n');
    
    lines.forEach((line, index) => {
      patterns.forEach(({ pattern, message, severity }) => {
        if (pattern.test(line)) {
          warnings.push({
            type: 'syntax_warning',
            message,
            severity,
            line: index + 1,
            code: line.trim()
          });
        }
      });
    });

    return warnings;
  }

  async analyzeSecurityIssues(code, language) {
    const issues = [];
    const patterns = this.analysisPatterns.security[language] || this.analysisPatterns.security.generic;
    
    patterns.forEach(({ pattern, message, severity, cwe }) => {
      const matches = [...code.matchAll(new RegExp(pattern, 'gi'))];
      matches.forEach(match => {
        const lineNumber = code.substring(0, match.index).split('\n').length;
        issues.push({
          type: 'security',
          message,
          severity,
          cwe,
          line: lineNumber,
          code: match[0],
          recommendation: this.getSecurityRecommendation(message)
        });
      });
    });

    return {
      issues,
      riskLevel: this.calculateSecurityRiskLevel(issues),
      summary: this.generateSecuritySummary(issues)
    };
  }

  async analyzePerformance(code, language) {
    const insights = [];
    const patterns = this.analysisPatterns.performance[language] || this.analysisPatterns.performance.generic;
    
    patterns.forEach(({ pattern, message, impact, suggestion }) => {
      const matches = [...code.matchAll(new RegExp(pattern, 'gi'))];
      matches.forEach(match => {
        const lineNumber = code.substring(0, match.index).split('\n').length;
        insights.push({
          type: 'performance',
          message,
          impact,
          suggestion,
          line: lineNumber,
          code: match[0]
        });
      });
    });

    return {
      insights,
      overallScore: this.calculatePerformanceScore(insights),
      recommendations: this.generatePerformanceRecommendations(insights)
    };
  }

  async analyzeMaintainability(code, language) {
    const issues = [];
    const patterns = this.analysisPatterns.maintainability[language] || this.analysisPatterns.maintainability.generic;
    
    // Check for maintainability issues
    patterns.forEach(({ pattern, message, impact }) => {
      const matches = [...code.matchAll(new RegExp(pattern, 'gi'))];
      matches.forEach(match => {
        const lineNumber = code.substring(0, match.index).split('\n').length;
        issues.push({
          type: 'maintainability',
          message,
          impact,
          line: lineNumber,
          code: match[0]
        });
      });
    });

    // Calculate maintainability metrics
    const metrics = {
      functionLength: this.calculateAverageFunctionLength(code, language),
      cyclomaticComplexity: this.calculateCyclomaticComplexity(code),
      codeSmells: this.detectCodeSmells(code, language),
      duplicateCode: this.detectDuplicateCode(code)
    };

    const score = this.calculateMaintainabilityScore(metrics, issues);

    return {
      score,
      issues,
      metrics,
      recommendations: this.generateMaintainabilityRecommendations(issues, metrics)
    };
  }

  async analyzeComplexity(code, language) {
    const metrics = {
      cyclomaticComplexity: this.calculateCyclomaticComplexity(code),
      cognitiveComplexity: this.calculateCognitiveComplexity(code),
      nestingDepth: this.calculateMaxNestingDepth(code),
      functionCount: this.countFunctions(code, language),
      lineCount: code.split('\n').length
    };

    return {
      metrics,
      overallComplexity: this.calculateOverallComplexity(metrics),
      recommendations: this.generateComplexityRecommendations(metrics)
    };
  }

  calculateCyclomaticComplexity(code) {
    // Count decision points
    const decisionPatterns = [
      /if\s*\(/g,
      /else\s+if\s*\(/g,
      /while\s*\(/g,
      /for\s*\(/g,
      /switch\s*\(/g,
      /case\s+/g,
      /catch\s*\(/g,
      /&&/g,
      /\|\|/g,
      /\?/g // ternary operator
    ];

    let complexity = 1; // Base complexity
    
    decisionPatterns.forEach(pattern => {
      const matches = code.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    });

    return complexity;
  }

  calculateCognitiveComplexity(code) {
    // Simplified cognitive complexity calculation
    let complexity = 0;
    let nestingLevel = 0;
    
    const lines = code.split('\n');
    
    lines.forEach(line => {
      const trimmed = line.trim();
      
      // Increase nesting for control structures
      if (/^(if|for|while|switch|try)\s*\(/.test(trimmed)) {
        complexity += 1 + nestingLevel;
        nestingLevel++;
      } else if (/^}/.test(trimmed)) {
        nestingLevel = Math.max(0, nestingLevel - 1);
      } else if (/^(else|catch|finally)/.test(trimmed)) {
        complexity += 1;
      }
    });

    return complexity;
  }

  calculateMaxNestingDepth(code) {
    let maxDepth = 0;
    let currentDepth = 0;
    
    for (const char of code) {
      if (char === '{') {
        currentDepth++;
        maxDepth = Math.max(maxDepth, currentDepth);
      } else if (char === '}') {
        currentDepth = Math.max(0, currentDepth - 1);
      }
    }
    
    return maxDepth;
  }

  countFunctions(code, language) {
    const functionPatterns = {
      javascript: [/function\s+\w+/g, /\w+\s*=\s*function/g, /\w+\s*=>\s*/g],
      python: [/def\s+\w+/g],
      java: [/(?:public|private|protected)?\s*(?:static\s+)?\w+\s+\w+\s*\(/g]
    };

    const patterns = functionPatterns[language] || [/function/g];
    let count = 0;
    
    patterns.forEach(pattern => {
      const matches = code.match(pattern);
      if (matches) {
        count += matches.length;
      }
    });
    
    return count;
  }

  detectCodeSmells(code, language) {
    const smells = [];
    
    // Long parameter lists
    const longParamRegex = /\([^)]{50,}\)/g;
    const longParamMatches = [...code.matchAll(longParamRegex)];
    longParamMatches.forEach(match => {
      smells.push({
        type: 'long_parameter_list',
        message: 'Function has too many parameters',
        severity: 'medium',
        line: code.substring(0, match.index).split('\n').length
      });
    });

    // Large functions (simplified check)
    const functionBodies = this.extractFunctionBodies(code, language);
    functionBodies.forEach(({ name, body, line }) => {
      if (body.split('\n').length > 50) {
        smells.push({
          type: 'large_function',
          message: `Function '${name}' is too long (${body.split('\n').length} lines)`,
          severity: 'high',
          line
        });
      }
    });

    return smells;
  }

  extractFunctionBodies(code, language) {
    // Simplified function body extraction
    const functions = [];
    
    if (language === 'javascript') {
      const functionRegex = /function\s+(\w+)[^{]*{([^}]*)}/g;
      let match;
      while ((match = functionRegex.exec(code)) !== null) {
        functions.push({
          name: match[1],
          body: match[2],
          line: code.substring(0, match.index).split('\n').length
        });
      }
    }
    
    return functions;
  }

  detectDuplicateCode(code) {
    const duplicates = [];
    const lines = code.split('\n').map(line => line.trim()).filter(line => line.length > 10);
    const lineMap = new Map();
    
    lines.forEach((line, index) => {
      if (lineMap.has(line)) {
        duplicates.push({
          type: 'duplicate_line',
          message: 'Duplicate code detected',
          originalLine: lineMap.get(line) + 1,
          duplicateLine: index + 1,
          code: line
        });
      } else {
        lineMap.set(line, index);
      }
    });
    
    return duplicates;
  }

  async generateSuggestions(code, language, analysisResults) {
    const suggestions = [];
    
    // Security suggestions
    if (analysisResults.securityAnalysis.issues.length > 0) {
      suggestions.push({
        category: 'security',
        priority: 'high',
        message: 'Address security vulnerabilities found in the code',
        details: analysisResults.securityAnalysis.issues.map(issue => issue.message)
      });
    }
    
    // Performance suggestions
    if (analysisResults.performanceAnalysis.insights.length > 0) {
      suggestions.push({
        category: 'performance',
        priority: 'medium',
        message: 'Optimize code for better performance',
        details: analysisResults.performanceAnalysis.recommendations
      });
    }
    
    // Complexity suggestions
    if (analysisResults.complexityAnalysis.metrics.cyclomaticComplexity > 10) {
      suggestions.push({
        category: 'complexity',
        priority: 'medium',
        message: 'Reduce code complexity for better maintainability',
        details: ['Break down complex functions', 'Reduce nesting levels', 'Simplify conditional logic']
      });
    }
    
    // Language-specific suggestions
    const languageSpecificSuggestions = this.getLanguageSpecificSuggestions(code, language);
    suggestions.push(...languageSpecificSuggestions);
    
    return suggestions;
  }

  getLanguageSpecificSuggestions(code, language) {
    const suggestions = [];
    
    switch (language) {
      case 'javascript':
        if (code.includes('var ')) {
          suggestions.push({
            category: 'best_practices',
            priority: 'low',
            message: 'Use const/let instead of var for better scoping',
            details: ['Replace var declarations with const or let']
          });
        }
        break;
        
      case 'python':
        if (!code.includes('"""') && !code.includes("'''")) {
          suggestions.push({
            category: 'documentation',
            priority: 'low',
            message: 'Add docstrings to functions and classes',
            details: ['Use triple quotes for function documentation']
          });
        }
        break;
    }
    
    return suggestions;
  }

  async performDeepAnalysis(code, language) {
    // Deep analysis includes more sophisticated checks
    return {
      architecturalPatterns: this.detectArchitecturalPatterns(code, language),
      designPatterns: this.detectDesignPatterns(code, language),
      testability: this.analyzeTestability(code, language),
      dependencies: this.analyzeDependencies(code, language)
    };
  }

  detectArchitecturalPatterns(code, language) {
    const patterns = [];
    
    // MVC pattern detection
    if (code.includes('controller') && code.includes('model') && code.includes('view')) {
      patterns.push({
        pattern: 'MVC',
        confidence: 0.8,
        description: 'Model-View-Controller pattern detected'
      });
    }
    
    // Singleton pattern detection
    if (code.includes('getInstance') || code.includes('instance')) {
      patterns.push({
        pattern: 'Singleton',
        confidence: 0.6,
        description: 'Possible Singleton pattern usage'
      });
    }
    
    return patterns;
  }

  detectDesignPatterns(code, language) {
    // Simplified design pattern detection
    return [];
  }

  analyzeTestability(code, language) {
    const score = 0.5; // Base score
    const issues = [];
    
    // Check for testable structure
    if (this.countFunctions(code, language) === 0) {
      issues.push('No functions found - code may be difficult to test');
    }
    
    return {
      score,
      issues,
      recommendations: ['Write unit tests', 'Use dependency injection', 'Avoid global state']
    };
  }

  analyzeDependencies(code, language) {
    const dependencies = [];
    
    // Extract imports/requires based on language
    const importPatterns = {
      javascript: [/import\s+.*\s+from\s+['"]([^'"]+)['"]/g, /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g],
      python: [/import\s+(\w+)/g, /from\s+(\w+)\s+import/g],
      java: [/import\s+([\w.]+);/g]
    };
    
    const patterns = importPatterns[language] || [];
    
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(code)) !== null) {
        dependencies.push({
          name: match[1],
          type: 'external',
          line: code.substring(0, match.index).split('\n').length
        });
      }
    });
    
    return {
      external: dependencies,
      count: dependencies.length,
      recommendations: dependencies.length > 10 ? ['Consider reducing dependencies'] : []
    };
  }

  // Initialize analysis patterns
  initializeSecurityPatterns() {
    return {
      javascript: [
        {
          pattern: 'eval\\s*\\(',
          message: 'Use of eval() can lead to code injection vulnerabilities',
          severity: 'high',
          cwe: 'CWE-95'
        },
        {
          pattern: 'innerHTML\\s*=',
          message: 'Direct innerHTML assignment can lead to XSS vulnerabilities',
          severity: 'medium',
          cwe: 'CWE-79'
        },
        {
          pattern: 'document\\.write\\s*\\(',
          message: 'document.write can be exploited for XSS attacks',
          severity: 'medium',
          cwe: 'CWE-79'
        }
      ],
      python: [
        {
          pattern: 'exec\\s*\\(',
          message: 'Use of exec() can lead to code injection vulnerabilities',
          severity: 'high',
          cwe: 'CWE-95'
        },
        {
          pattern: 'pickle\\.loads?\\s*\\(',
          message: 'Pickle deserialization can execute arbitrary code',
          severity: 'high',
          cwe: 'CWE-502'
        }
      ],
      generic: [
        {
          pattern: 'password\\s*=\\s*["\'][^"\']+["\']',
          message: 'Hardcoded password detected',
          severity: 'high',
          cwe: 'CWE-798'
        }
      ]
    };
  }

  initializePerformancePatterns() {
    return {
      javascript: [
        {
          pattern: 'for\\s*\\([^)]*\\.length[^)]*\\)',
          message: 'Cache array length in loops for better performance',
          impact: 'medium',
          suggestion: 'Store array.length in a variable before the loop'
        },
        {
          pattern: 'document\\.getElementById',
          message: 'Frequent DOM queries can impact performance',
          impact: 'low',
          suggestion: 'Cache DOM element references'
        }
      ],
      python: [
        {
          pattern: '\\+\\s*=\\s*\\[',
          message: 'List concatenation with += is inefficient',
          impact: 'medium',
          suggestion: 'Use list.extend() or list comprehension instead'
        }
      ],
      generic: [
        {
          pattern: 'while\\s*\\(\\s*true\\s*\\)',
          message: 'Infinite loops can cause performance issues',
          impact: 'high',
          suggestion: 'Ensure proper exit conditions'
        }
      ]
    };
  }

  initializeMaintainabilityPatterns() {
    return {
      generic: [
        {
          pattern: '\\w{50,}',
          message: 'Very long identifier names reduce readability',
          impact: 'low'
        },
        {
          pattern: '//\\s*TODO',
          message: 'TODO comments indicate incomplete work',
          impact: 'low'
        },
        {
          pattern: '//\\s*FIXME',
          message: 'FIXME comments indicate known issues',
          impact: 'medium'
        }
      ]
    };
  }

  initializeComplexityPatterns() {
    return {
      generic: [
        {
          pattern: 'if\\s*\\([^)]*&&[^)]*&&[^)]*\\)',
          message: 'Complex conditional with multiple AND operators',
          impact: 'medium'
        }
      ]
    };
  }

  // Utility methods for scoring and recommendations
  calculateSecurityRiskLevel(issues) {
    const highRiskCount = issues.filter(i => i.severity === 'high').length;
    const mediumRiskCount = issues.filter(i => i.severity === 'medium').length;
    
    if (highRiskCount > 0) return 'high';
    if (mediumRiskCount > 2) return 'medium';
    return 'low';
  }

  generateSecuritySummary(issues) {
    return `Found ${issues.length} security issues: ${issues.filter(i => i.severity === 'high').length} high risk, ${issues.filter(i => i.severity === 'medium').length} medium risk`;
  }

  getSecurityRecommendation(message) {
    const recommendations = {
      'eval()': 'Use JSON.parse() for data parsing or Function constructor for safer code evaluation',
      'innerHTML': 'Use textContent or createElement() with proper sanitization',
      'pickle': 'Use JSON or other safe serialization formats',
      'password': 'Store passwords securely using environment variables or secure vaults'
    };
    
    for (const [key, recommendation] of Object.entries(recommendations)) {
      if (message.toLowerCase().includes(key)) {
        return recommendation;
      }
    }
    
    return 'Review security best practices for this issue';
  }

  calculatePerformanceScore(insights) {
    const highImpactCount = insights.filter(i => i.impact === 'high').length;
    const mediumImpactCount = insights.filter(i => i.impact === 'medium').length;
    
    let score = 100;
    score -= highImpactCount * 20;
    score -= mediumImpactCount * 10;
    score -= insights.filter(i => i.impact === 'low').length * 5;
    
    return Math.max(0, score);
  }

  generatePerformanceRecommendations(insights) {
    return insights.map(insight => insight.suggestion).filter(Boolean);
  }

  calculateMaintainabilityScore(metrics, issues) {
    let score = 100;
    
    // Penalize based on complexity
    if (metrics.cyclomaticComplexity > 10) score -= 20;
    if (metrics.cyclomaticComplexity > 20) score -= 30;
    
    // Penalize based on issues
    score -= issues.length * 5;
    
    // Penalize based on code smells
    score -= metrics.codeSmells.length * 10;
    
    return Math.max(0, Math.min(100, score));
  }

  generateMaintainabilityRecommendations(issues, metrics) {
    const recommendations = [];
    
    if (metrics.cyclomaticComplexity > 10) {
      recommendations.push('Break down complex functions into smaller, more focused functions');
    }
    
    if (metrics.codeSmells.length > 0) {
      recommendations.push('Address code smells to improve maintainability');
    }
    
    if (issues.length > 5) {
      recommendations.push('Reduce the number of maintainability issues');
    }
    
    return recommendations;
  }

  calculateOverallComplexity(metrics) {
    const weights = {
      cyclomaticComplexity: 0.3,
      cognitiveComplexity: 0.3,
      nestingDepth: 0.2,
      functionCount: 0.1,
      lineCount: 0.1
    };
    
    // Normalize metrics and calculate weighted score
    const normalizedMetrics = {
      cyclomaticComplexity: Math.min(metrics.cyclomaticComplexity / 20, 1),
      cognitiveComplexity: Math.min(metrics.cognitiveComplexity / 30, 1),
      nestingDepth: Math.min(metrics.nestingDepth / 10, 1),
      functionCount: Math.min(metrics.functionCount / 50, 1),
      lineCount: Math.min(metrics.lineCount / 1000, 1)
    };
    
    let complexity = 0;
    for (const [metric, value] of Object.entries(normalizedMetrics)) {
      complexity += value * weights[metric];
    }
    
    if (complexity < 0.3) return 'low';
    if (complexity < 0.7) return 'medium';
    return 'high';
  }

  generateComplexityRecommendations(metrics) {
    const recommendations = [];
    
    if (metrics.cyclomaticComplexity > 10) {
      recommendations.push('Reduce cyclomatic complexity by simplifying conditional logic');
    }
    
    if (metrics.nestingDepth > 4) {
      recommendations.push('Reduce nesting depth by extracting methods or using early returns');
    }
    
    if (metrics.cognitiveComplexity > 15) {
      recommendations.push('Simplify code logic to reduce cognitive load');
    }
    
    return recommendations;
  }

  calculateAverageFunctionLength(code, language) {
    const functions = this.extractFunctionBodies(code, language);
    if (functions.length === 0) return 0;
    
    const totalLines = functions.reduce((sum, func) => sum + func.body.split('\n').length, 0);
    return totalLines / functions.length;
  }

  formatAnalysisResult(analysisData) {
    return `
Code Analysis Results:

Syntax Analysis:
- Valid: ${analysisData.syntaxAnalysis.valid}
- Errors: ${analysisData.syntaxAnalysis.errors.length}
- Warnings: ${analysisData.syntaxAnalysis.warnings.length}
- Lines of Code: ${analysisData.syntaxAnalysis.lineCount}

Security Analysis:
- Risk Level: ${analysisData.securityAnalysis.riskLevel}
- Issues Found: ${analysisData.securityAnalysis.issues.length}
- Summary: ${analysisData.securityAnalysis.summary}

Performance Analysis:
- Score: ${analysisData.performanceAnalysis.overallScore}/100
- Issues: ${analysisData.performanceAnalysis.insights.length}

Maintainability Analysis:
- Score: ${analysisData.maintainabilityAnalysis.score}/100
- Code Smells: ${analysisData.maintainabilityAnalysis.metrics.codeSmells.length}

Complexity Analysis:
- Cyclomatic Complexity: ${analysisData.complexityAnalysis.metrics.cyclomaticComplexity}
- Overall Complexity: ${analysisData.complexityAnalysis.overallComplexity}
- Max Nesting Depth: ${analysisData.complexityAnalysis.metrics.nestingDepth}

${analysisData.deepAnalysisResults ? `
Deep Analysis:
- Architectural Patterns: ${analysisData.deepAnalysisResults.architecturalPatterns.length}
- Dependencies: ${analysisData.deepAnalysisResults.dependencies.count}
- Testability Score: ${analysisData.deepAnalysisResults.testability.score}
` : ''}
    `.trim();
  }

  estimateTokens(code) {
    // Rough estimation: 1 token per 4 characters
    return Math.ceil(code.length / 4);
  }

  calculateAnalysisCost(tokens, deepAnalysis) {
    const baseRate = 0.01; // $0.01 per 1K tokens
    const deepAnalysisMultiplier = deepAnalysis ? 2 : 1;
    return (tokens / 1000) * baseRate * deepAnalysisMultiplier;
  }

  isHealthy() {
    return {
      status: 'healthy',
      supportedLanguages: Object.keys(this.supportedLanguages),
      analysisPatterns: Object.keys(this.analysisPatterns).length,
      qualityMetrics: Object.keys(this.qualityMetrics).length
    };
  }
}

module.exports = CodeAnalysisService;

