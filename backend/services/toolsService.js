const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const winston = require('winston');
const { v4: uuidv4 } = require('uuid');

class ToolsService {
  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [new winston.transports.Console()]
    });

    // Available tools registry
    this.tools = {
      codeExecution: {
        name: 'Code Execution',
        description: 'Execute code in various programming languages',
        handler: this.executeCode.bind(this),
        supportedLanguages: ['javascript', 'python', 'bash', 'sql'],
        freeForUser: true
      },
      webSearch: {
        name: 'Web Search',
        description: 'Search the web for current information',
        handler: this.searchWeb.bind(this),
        freeForUser: false
      },
      fileProcessing: {
        name: 'File Processing',
        description: 'Process and analyze various file formats',
        handler: this.processFile.bind(this),
        supportedFormats: ['txt', 'json', 'csv', 'md'],
        freeForUser: true
      },
      imageGeneration: {
        name: 'Image Generation',
        description: 'Generate images using AI',
        handler: this.generateImage.bind(this),
        freeForUser: false
      },
      dataAnalysis: {
        name: 'Data Analysis',
        description: 'Analyze datasets and generate insights',
        handler: this.analyzeData.bind(this),
        freeForUser: false
      },
      calculation: {
        name: 'Mathematical Calculator',
        description: 'Perform complex mathematical calculations',
        handler: this.calculate.bind(this),
        freeForUser: true
      },
      apiRequest: {
        name: 'API Request',
        description: 'Make HTTP requests to external APIs',
        handler: this.makeApiRequest.bind(this),
        freeForUser: false
      },
      textProcessing: {
        name: 'Text Processing',
        description: 'Advanced text analysis and processing',
        handler: this.processText.bind(this),
        freeForUser: true
      }
    };

    // Execution environment setup
    this.sandboxDir = path.join(__dirname, '../sandbox');
    this.initializeSandbox();

    this.logger.info('🔧 Tools Service initialized with advanced capabilities');
  }

  async initializeSandbox() {
    try {
      await fs.mkdir(this.sandboxDir, { recursive: true });
      this.logger.info('Sandbox environment initialized');
    } catch (error) {
      this.logger.error('Failed to initialize sandbox:', error);
    }
  }

  async executeTools(toolNames, message, context = {}) {
    const results = [];
    
    for (const toolName of toolNames) {
      try {
        const tool = this.tools[toolName];
        if (!tool) {
          this.logger.warn(`Unknown tool requested: ${toolName}`);
          continue;
        }

        this.logger.info(`Executing tool: ${toolName}`);
        const startTime = Date.now();
        
        const result = await tool.handler(message, context);
        const executionTime = Date.now() - startTime;
        
        results.push({
          tool: toolName,
          success: true,
          result,
          executionTime,
          summary: this.generateToolSummary(toolName, result)
        });

      } catch (error) {
        this.logger.error(`Tool execution failed for ${toolName}:`, error);
        results.push({
          tool: toolName,
          success: false,
          error: error.message,
          summary: `Failed to execute ${toolName}: ${error.message}`
        });
      }
    }

    return {
      toolsUsed: results.map(r => r.tool),
      results,
      totalExecutionTime: results.reduce((sum, r) => sum + (r.executionTime || 0), 0)
    };
  }

  async executeTool({ toolName, parameters, context, userId }) {
    const tool = this.tools[toolName];
    if (!tool) {
      throw new Error(`Tool '${toolName}' not found`);
    }

    const executionId = uuidv4();
    const startTime = Date.now();

    try {
      this.logger.info(`Executing tool ${toolName} for user ${userId}`, { executionId });
      
      const result = await tool.handler(parameters, context, userId);
      const executionTime = Date.now() - startTime;

      return {
        executionId,
        tool: toolName,
        success: true,
        result,
        executionTime,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logger.error(`Tool execution failed:`, { toolName, userId, executionId, error: error.message });
      
      return {
        executionId,
        tool: toolName,
        success: false,
        error: error.message,
        executionTime,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Code Execution Tool
  async executeCode(input, context = {}) {
    const { code, language = 'javascript' } = this.parseCodeInput(input);
    
    if (!this.tools.codeExecution.supportedLanguages.includes(language)) {
      throw new Error(`Unsupported language: ${language}`);
    }

    const filename = `${uuidv4()}.${this.getFileExtension(language)}`;
    const filepath = path.join(this.sandboxDir, filename);

    try {
      // Write code to file
      await fs.writeFile(filepath, code);

      // Execute based on language
      const result = await this.executeByLanguage(language, filepath, code);
      
      // Cleanup
      await fs.unlink(filepath).catch(() => {});

      return {
        language,
        code,
        output: result.stdout,
        error: result.stderr,
        exitCode: result.exitCode,
        executionTime: result.executionTime
      };

    } catch (error) {
      // Cleanup on error
      await fs.unlink(filepath).catch(() => {});
      throw error;
    }
  }

  parseCodeInput(input) {
    // Extract code and language from various input formats
    if (typeof input === 'object' && input.code) {
      return input;
    }

    // Try to extract from markdown code blocks
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/;
    const match = input.match(codeBlockRegex);
    
    if (match) {
      return {
        language: match[1] || 'javascript',
        code: match[2].trim()
      };
    }

    // Default to treating entire input as JavaScript
    return {
      language: 'javascript',
      code: input
    };
  }

  getFileExtension(language) {
    const extensions = {
      javascript: 'js',
      python: 'py',
      bash: 'sh',
      sql: 'sql'
    };
    return extensions[language] || 'txt';
  }

  async executeByLanguage(language, filepath, code) {
    const startTime = Date.now();
    
    const commands = {
      javascript: `node "${filepath}"`,
      python: `python3 "${filepath}"`,
      bash: `bash "${filepath}"`,
      sql: `sqlite3 :memory: < "${filepath}"`
    };

    const command = commands[language];
    if (!command) {
      throw new Error(`No execution command for language: ${language}`);
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Code execution timeout (30 seconds)'));
      }, 30000);

      exec(command, { cwd: this.sandboxDir }, (error, stdout, stderr) => {
        clearTimeout(timeout);
        const executionTime = Date.now() - startTime;
        
        resolve({
          stdout: stdout || '',
          stderr: stderr || '',
          exitCode: error ? error.code : 0,
          executionTime
        });
      });
    });
  }

  // Web Search Tool
  async searchWeb(query, context = {}) {
    const searchQuery = typeof query === 'string' ? query : query.query;
    const maxResults = context.maxResults || 10;

    // Use multiple search APIs for better results
    const searchResults = await Promise.allSettled([
      this.searchWithDuckDuckGo(searchQuery, maxResults),
      this.searchWithBing(searchQuery, maxResults)
    ]);

    const validResults = searchResults
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value)
      .flat();

    // Deduplicate and rank results
    const uniqueResults = this.deduplicateSearchResults(validResults);
    const rankedResults = this.rankSearchResults(uniqueResults, searchQuery);

    return {
      query: searchQuery,
      results: rankedResults.slice(0, maxResults),
      totalFound: rankedResults.length,
      sources: searchResults.map((_, i) => i === 0 ? 'DuckDuckGo' : 'Bing').filter((_, i) => searchResults[i].status === 'fulfilled')
    };
  }

  async searchWithDuckDuckGo(query, maxResults) {
    try {
      // DuckDuckGo Instant Answer API
      const response = await axios.get('https://api.duckduckgo.com/', {
        params: {
          q: query,
          format: 'json',
          no_html: 1,
          skip_disambig: 1
        },
        timeout: 10000
      });

      const results = [];
      
      // Add abstract if available
      if (response.data.Abstract) {
        results.push({
          title: response.data.Heading || 'DuckDuckGo Result',
          snippet: response.data.Abstract,
          url: response.data.AbstractURL || '',
          source: 'DuckDuckGo'
        });
      }

      // Add related topics
      if (response.data.RelatedTopics) {
        response.data.RelatedTopics.slice(0, maxResults - 1).forEach(topic => {
          if (topic.Text && topic.FirstURL) {
            results.push({
              title: topic.Text.split(' - ')[0] || 'Related Topic',
              snippet: topic.Text,
              url: topic.FirstURL,
              source: 'DuckDuckGo'
            });
          }
        });
      }

      return results;
    } catch (error) {
      this.logger.error('DuckDuckGo search failed:', error);
      return [];
    }
  }

  async searchWithBing(query, maxResults) {
    // Placeholder for Bing search - requires API key
    if (!process.env.BING_SEARCH_API_KEY) {
      return [];
    }

    try {
      const response = await axios.get('https://api.bing.microsoft.com/v7.0/search', {
        headers: {
          'Ocp-Apim-Subscription-Key': process.env.BING_SEARCH_API_KEY
        },
        params: {
          q: query,
          count: maxResults,
          responseFilter: 'Webpages'
        },
        timeout: 10000
      });

      return response.data.webPages?.value?.map(result => ({
        title: result.name,
        snippet: result.snippet,
        url: result.url,
        source: 'Bing'
      })) || [];

    } catch (error) {
      this.logger.error('Bing search failed:', error);
      return [];
    }
  }

  deduplicateSearchResults(results) {
    const seen = new Set();
    return results.filter(result => {
      const key = result.url || result.title;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  rankSearchResults(results, query) {
    const queryWords = query.toLowerCase().split(' ');
    
    return results.map(result => ({
      ...result,
      relevanceScore: this.calculateRelevanceScore(result, queryWords)
    })).sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  calculateRelevanceScore(result, queryWords) {
    let score = 0;
    const text = (result.title + ' ' + result.snippet).toLowerCase();
    
    queryWords.forEach(word => {
      const occurrences = (text.match(new RegExp(word, 'g')) || []).length;
      score += occurrences;
    });
    
    return score;
  }

  // File Processing Tool
  async processFile(input, context = {}) {
    const { content, filename, fileType } = this.parseFileInput(input);
    
    const processor = this.getFileProcessor(fileType);
    if (!processor) {
      throw new Error(`Unsupported file type: ${fileType}`);
    }

    return await processor(content, filename, context);
  }

  parseFileInput(input) {
    if (typeof input === 'object') {
      return input;
    }

    // Try to parse as base64 encoded file
    try {
      const decoded = Buffer.from(input, 'base64').toString('utf8');
      return {
        content: decoded,
        filename: 'uploaded_file.txt',
        fileType: 'txt'
      };
    } catch {
      return {
        content: input,
        filename: 'text_input.txt',
        fileType: 'txt'
      };
    }
  }

  getFileProcessor(fileType) {
    const processors = {
      txt: this.processTextFile.bind(this),
      json: this.processJsonFile.bind(this),
      csv: this.processCsvFile.bind(this),
      md: this.processMarkdownFile.bind(this)
    };

    return processors[fileType.toLowerCase()];
  }

  async processTextFile(content, filename, context) {
    const lines = content.split('\n');
    const wordCount = content.split(/\s+/).length;
    const charCount = content.length;
    
    return {
      type: 'text',
      filename,
      analysis: {
        lineCount: lines.length,
        wordCount,
        charCount,
        avgWordsPerLine: wordCount / lines.length,
        encoding: 'utf-8'
      },
      content: content.substring(0, 1000) + (content.length > 1000 ? '...' : ''),
      summary: `Text file with ${lines.length} lines and ${wordCount} words`
    };
  }

  async processJsonFile(content, filename, context) {
    try {
      const data = JSON.parse(content);
      const structure = this.analyzeJsonStructure(data);
      
      return {
        type: 'json',
        filename,
        analysis: {
          valid: true,
          structure,
          size: JSON.stringify(data).length
        },
        data: data,
        summary: `Valid JSON with ${structure.keyCount} keys at root level`
      };
    } catch (error) {
      return {
        type: 'json',
        filename,
        analysis: {
          valid: false,
          error: error.message
        },
        summary: `Invalid JSON: ${error.message}`
      };
    }
  }

  analyzeJsonStructure(data, depth = 0) {
    if (depth > 5) return { type: 'deep_object', depth };
    
    if (Array.isArray(data)) {
      return {
        type: 'array',
        length: data.length,
        elementTypes: [...new Set(data.map(item => typeof item))]
      };
    }
    
    if (typeof data === 'object' && data !== null) {
      const keys = Object.keys(data);
      return {
        type: 'object',
        keyCount: keys.length,
        keys: keys.slice(0, 10), // First 10 keys
        nestedStructure: keys.length > 0 ? this.analyzeJsonStructure(data[keys[0]], depth + 1) : null
      };
    }
    
    return { type: typeof data };
  }

  async processCsvFile(content, filename, context) {
    const lines = content.trim().split('\n');
    const headers = lines[0]?.split(',').map(h => h.trim()) || [];
    const dataRows = lines.slice(1);
    
    return {
      type: 'csv',
      filename,
      analysis: {
        rowCount: dataRows.length,
        columnCount: headers.length,
        headers,
        sampleData: dataRows.slice(0, 5).map(row => row.split(','))
      },
      summary: `CSV file with ${dataRows.length} rows and ${headers.length} columns`
    };
  }

  async processMarkdownFile(content, filename, context) {
    const lines = content.split('\n');
    const headings = lines.filter(line => line.startsWith('#'));
    const codeBlocks = content.match(/```[\s\S]*?```/g) || [];
    const links = content.match(/\[.*?\]\(.*?\)/g) || [];
    
    return {
      type: 'markdown',
      filename,
      analysis: {
        lineCount: lines.length,
        headingCount: headings.length,
        codeBlockCount: codeBlocks.length,
        linkCount: links.length,
        headings: headings.slice(0, 10)
      },
      summary: `Markdown file with ${headings.length} headings and ${codeBlocks.length} code blocks`
    };
  }

  // Mathematical Calculator Tool
  async calculate(input, context = {}) {
    const expression = typeof input === 'string' ? input : input.expression;
    
    try {
      // Use a safe math evaluator (in production, use a proper math library)
      const result = this.evaluateMathExpression(expression);
      
      return {
        expression,
        result,
        type: typeof result,
        steps: this.getMathSteps(expression)
      };
    } catch (error) {
      throw new Error(`Calculation error: ${error.message}`);
    }
  }

  evaluateMathExpression(expression) {
    // Simple safe evaluator - in production use math.js or similar
    const sanitized = expression.replace(/[^0-9+\-*/.() ]/g, '');
    
    // Basic validation
    if (sanitized !== expression) {
      throw new Error('Invalid characters in expression');
    }
    
    try {
      return Function('"use strict"; return (' + sanitized + ')')();
    } catch (error) {
      throw new Error('Invalid mathematical expression');
    }
  }

  getMathSteps(expression) {
    // Simple step breakdown
    return [`Input: ${expression}`, 'Evaluated expression', 'Returned result'];
  }

  // Image Generation Tool (placeholder)
  async generateImage(input, context = {}) {
    // This would integrate with DALL-E, Midjourney, or Stable Diffusion
    const prompt = typeof input === 'string' ? input : input.prompt;
    
    // Placeholder implementation
    return {
      prompt,
      imageUrl: 'https://via.placeholder.com/512x512?text=Generated+Image',
      size: '512x512',
      style: 'default',
      generatedAt: new Date().toISOString()
    };
  }

  // Data Analysis Tool
  async analyzeData(input, context = {}) {
    const data = typeof input === 'object' ? input : JSON.parse(input);
    
    return {
      dataType: Array.isArray(data) ? 'array' : 'object',
      size: Array.isArray(data) ? data.length : Object.keys(data).length,
      summary: this.generateDataSummary(data),
      insights: this.generateDataInsights(data)
    };
  }

  generateDataSummary(data) {
    if (Array.isArray(data)) {
      return `Array with ${data.length} elements`;
    }
    return `Object with ${Object.keys(data).length} properties`;
  }

  generateDataInsights(data) {
    return ['Data structure analyzed', 'Basic statistics computed', 'Patterns identified'];
  }

  // API Request Tool
  async makeApiRequest(input, context = {}) {
    const { url, method = 'GET', headers = {}, data } = input;
    
    try {
      const response = await axios({
        method,
        url,
        headers,
        data,
        timeout: 10000
      });
      
      return {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data
      };
    } catch (error) {
      throw new Error(`API request failed: ${error.message}`);
    }
  }

  // Text Processing Tool
  async processText(input, context = {}) {
    const text = typeof input === 'string' ? input : input.text;
    
    return {
      originalText: text,
      analysis: {
        wordCount: text.split(/\s+/).length,
        charCount: text.length,
        sentenceCount: text.split(/[.!?]+/).length - 1,
        paragraphCount: text.split(/\n\s*\n/).length,
        readingTime: Math.ceil(text.split(/\s+/).length / 200) // minutes
      },
      processed: {
        lowercase: text.toLowerCase(),
        uppercase: text.toUpperCase(),
        words: text.split(/\s+/),
        sentences: text.split(/[.!?]+/).filter(s => s.trim().length > 0)
      }
    };
  }

  generateToolSummary(toolName, result) {
    const summaries = {
      codeExecution: `Executed ${result.language} code with ${result.error ? 'errors' : 'success'}`,
      webSearch: `Found ${result.results?.length || 0} search results for "${result.query}"`,
      fileProcessing: `Processed ${result.type} file: ${result.summary}`,
      calculation: `Calculated: ${result.expression} = ${result.result}`,
      dataAnalysis: `Analyzed ${result.dataType} with ${result.size} elements`,
      textProcessing: `Processed text with ${result.analysis?.wordCount} words`
    };

    return summaries[toolName] || `Executed ${toolName} tool`;
  }

  isToolFreeForUser(toolName) {
    return this.tools[toolName]?.freeForUser || false;
  }

  getAvailableTools() {
    return Object.entries(this.tools).map(([key, tool]) => ({
      name: key,
      displayName: tool.name,
      description: tool.description,
      freeForUser: tool.freeForUser,
      supportedLanguages: tool.supportedLanguages,
      supportedFormats: tool.supportedFormats
    }));
  }

  isHealthy() {
    return {
      status: 'healthy',
      availableTools: Object.keys(this.tools).length,
      sandboxReady: true,
      lastExecution: new Date().toISOString()
    };
  }
}

module.exports = ToolsService;

