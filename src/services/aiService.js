import OpenAI from 'openai';
import logger from '../utils/logger.js';

export class AIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    // MCP Tools simulation
    this.mcpTools = {
      validatePromptRelevance: this.validatePromptRelevance.bind(this),
      searchPropertyInfo: this.searchPropertyInfo.bind(this),
      getUserChatHistory: this.getUserChatHistory.bind(this),
      getPropertyDetails: this.getPropertyDetails.bind(this),
      getInterestRates: this.getInterestRates.bind(this),
      calculateMortgage: this.calculateMortgage.bind(this),
      getUserSavedProperties: this.getUserSavedProperties.bind(this),
      getServicedProperties: this.getServicedProperties.bind(this),
      calculateMortgageAdvanced: this.calculateMortgageAdvanced.bind(this),
      getFinancialCalculator: this.getFinancialCalculator.bind(this)
    };
  }

  async processMessage({ message, sessionId, userId }) {
    const startTime = Date.now();
    
    try {
      logger.info('Processing message', { userId, sessionId, messageLength: message.length });
      
      // Step 1: Validate prompt relevance
      const isRelevant = await this.validatePromptRelevance(message);
      if (!isRelevant.isValid) {
        return {
          response: isRelevant.filteredContent,
          sessionId,
          timestamp: new Date().toISOString(),
          toolsUsed: ['validatePromptRelevance'],
          propertyData: null,
          executionTime: Date.now() - startTime
        };
      }

      // Step 2: Determine which tools to use based on message content
      const toolsToUse = this.determineRequiredTools(message);
      const toolResults = {};
      
      // Step 3: Execute MCP tools
      for (const toolName of toolsToUse) {
        if (this.mcpTools[toolName]) {
          try {
            toolResults[toolName] = await this.mcpTools[toolName](message, { userId, sessionId });
          } catch (error) {
            logger.error(`Error executing tool ${toolName}:`, error);
            toolResults[toolName] = { error: `Failed to execute ${toolName}` };
          }
        }
      }

      // Step 4: Generate AI response
      const aiResponse = await this.generateAIResponse(message, toolResults);

      // Step 5: Return structured response
      return {
        response: aiResponse,
        sessionId,
        timestamp: new Date().toISOString(),
        toolsUsed: ['validatePromptRelevance', ...toolsToUse],
        propertyData: this.extractPropertyData(toolResults),
        executionTime: Date.now() - startTime
      };

    } catch (error) {
      logger.error('Error in processMessage:', error);
      return {
        response: "I apologize, but I encountered an error processing your request. Please try again.",
        sessionId,
        timestamp: new Date().toISOString(),
        toolsUsed: [],
        propertyData: null,
        executionTime: Date.now() - startTime
      };
    }
  }

  // MCP Tool Implementations
  async validatePromptRelevance(message) {
    const propertyKeywords = [
      'property', 'house', 'home', 'apartment', 'condo', 'real estate',
      'buy', 'sell', 'rent', 'mortgage', 'loan', 'investment', 'roi',
      'bedroom', 'bathroom', 'square feet', 'price', 'location',
      'neighborhood', 'market', 'listing', 'agent', 'broker'
    ];

    const messageLower = message.toLowerCase();
    const relevantKeywords = propertyKeywords.filter(keyword => 
      messageLower.includes(keyword)
    ).length;

    const isValid = relevantKeywords > 0;

    return {
      isValid,
      relevanceScore: relevantKeywords / propertyKeywords.length,
      filteredContent: isValid ? null : "I'm here to help with property investment and real estate questions. How can I assist you with property details, market analysis, or investment calculations?"
    };
  }

  async searchPropertyInfo(message) {
    // Simulate property search
    return {
      results: [
        {
          title: "3BR/2BA Downtown House",
          snippet: "Beautiful 3-bedroom house in prime downtown location, $450,000",
          link: "https://example.com/property/123",
          price: 450000,
          bedrooms: 3,
          bathrooms: 2
        },
        {
          title: "Investment Property - High ROI",
          snippet: "Rental property with 8.5% ROI potential, $320,000",
          link: "https://example.com/property/124",
          price: 320000,
          roiEstimate: 8.5
        }
      ],
      totalResults: 2
    };
  }

  async getUserChatHistory(message, context) {
    // Simulate chat history
    return {
      history: [],
      messageCount: 0
    };
  }

  async getPropertyDetails(message) {
    // Simulate property details
    return {
      propertyId: "prop_001",
      address: "123 Main St, Downtown",
      price: 450000,
      bedrooms: 3,
      bathrooms: 2,
      squareFeet: 1800,
      propertyType: "Single Family Home",
      description: "Beautiful home in prime location",
      roiEstimate: 8.5,
      marketData: {
        pricePerSqft: 250,
        neighborhoodAvg: 425000,
        appreciationRate: 3.2
      }
    };
  }

  async getInterestRates(message) {
    // Extract location from message
    const location = this.extractLocation(message) || "United States";
    
    return {
      location,
      currentRate: 7.2,
      rateTrend: "stable",
      lastUpdated: new Date().toISOString(),
      rateHistory: [
        { date: "2024-01-01", rate: 6.8 },
        { date: "2024-02-01", rate: 7.0 },
        { date: "2024-03-01", rate: 7.2 }
      ]
    };
  }

  async calculateMortgage(message) {
    const numbers = this.extractNumbers(message);
    
    if (numbers.length < 2) {
      return { error: "Please provide property price and down payment for mortgage calculation" };
    }

    const propertyPrice = numbers[0];
    const downPayment = numbers[1];
    const interestRate = numbers[2] || 7.2;
    const loanTermYears = 30;

    const loanAmount = propertyPrice - downPayment;
    const monthlyRate = interestRate / 100 / 12;
    const numPayments = loanTermYears * 12;

    let monthlyPayment;
    if (monthlyRate > 0) {
      monthlyPayment = loanAmount * (
        monthlyRate * Math.pow(1 + monthlyRate, numPayments)
      ) / (Math.pow(1 + monthlyRate, numPayments) - 1);
    } else {
      monthlyPayment = loanAmount / numPayments;
    }

    return {
      propertyPrice,
      downPayment,
      loanAmount,
      interestRate,
      loanTermYears,
      monthlyPayment: Math.round(monthlyPayment * 100) / 100,
      totalCost: Math.round(monthlyPayment * numPayments * 100) / 100,
      totalInterest: Math.round((monthlyPayment * numPayments - loanAmount) * 100) / 100
    };
  }

  async getUserSavedProperties(message, context) {
    // Simulate saved properties
    return {
      savedProperties: [],
      totalCount: 0
    };
  }

  async getServicedProperties(message) {
    // Simulate serviced properties
    return {
      properties: [
        {
          propertyId: "prop_001",
          address: "123 Oak Street, Downtown",
          price: 450000,
          bedrooms: 3,
          bathrooms: 2,
          propertyType: "Single Family Home",
          roiEstimate: 8.5
        },
        {
          propertyId: "prop_002", 
          address: "456 Pine Avenue, Midtown",
          price: 320000,
          bedrooms: 2,
          bathrooms: 1,
          propertyType: "Condo",
          roiEstimate: 7.2
        }
      ],
      totalCount: 2
    };
  }

  async calculateMortgageAdvanced(message) {
    const basicCalc = await this.calculateMortgage(message);
    
    if (basicCalc.error) {
      return basicCalc;
    }

    // Add advanced calculations
    const downPaymentPercent = (basicCalc.downPayment / basicCalc.propertyPrice) * 100;
    const monthlyPmi = downPaymentPercent < 20 ? (basicCalc.loanAmount * 0.5 / 100) / 12 : 0;
    const monthlyPropertyTax = (basicCalc.propertyPrice * 1.2 / 100) / 12;
    const monthlyInsurance = (basicCalc.propertyPrice * 0.4 / 100) / 12;

    return {
      ...basicCalc,
      advancedDetails: {
        downPaymentPercent: Math.round(downPaymentPercent * 100) / 100,
        monthlyPmi: Math.round(monthlyPmi * 100) / 100,
        monthlyPropertyTax: Math.round(monthlyPropertyTax * 100) / 100,
        monthlyInsurance: Math.round(monthlyInsurance * 100) / 100,
        totalMonthlyPayment: Math.round((basicCalc.monthlyPayment + monthlyPmi + monthlyPropertyTax + monthlyInsurance) * 100) / 100
      }
    };
  }

  async getFinancialCalculator(message) {
    const numbers = this.extractNumbers(message);
    const messageLower = message.toLowerCase();

    if (messageLower.includes('roi') && numbers.length >= 2) {
      const initialInvestment = numbers[0];
      const annualReturn = numbers[1];
      const roiPercentage = (annualReturn / initialInvestment) * 100;

      return {
        calculationType: 'roi',
        initialInvestment,
        annualReturn,
        roiPercentage: Math.round(roiPercentage * 100) / 100
      };
    }

    if (messageLower.includes('cap rate') && numbers.length >= 2) {
      const annualIncome = numbers[0];
      const propertyValue = numbers[1];
      const capRate = (annualIncome / propertyValue) * 100;

      return {
        calculationType: 'cap_rate',
        annualIncome,
        propertyValue,
        capRatePercentage: Math.round(capRate * 100) / 100
      };
    }

    return { error: "Please specify calculation type (ROI or Cap Rate) with required numbers" };
  }

  // Helper methods
  determineRequiredTools(message) {
    const messageLower = message.toLowerCase();
    const tools = [];

    if (this.containsAny(messageLower, ['find', 'search', 'show', 'properties', 'houses'])) {
      tools.push('searchPropertyInfo');
    }

    if (this.containsAny(messageLower, ['mortgage', 'payment', 'loan', 'calculate'])) {
      tools.push('calculateMortgage');
    }

    if (this.containsAny(messageLower, ['interest', 'rate', 'rates'])) {
      tools.push('getInterestRates');
    }

    if (this.containsAny(messageLower, ['roi', 'return', 'investment', 'cap rate'])) {
      tools.push('getFinancialCalculator');
    }

    if (this.containsAny(messageLower, ['details', 'information', 'about property'])) {
      tools.push('getPropertyDetails');
    }

    return tools;
  }

  async generateAIResponse(message, toolResults) {
    try {
      const messages = [
        {
          role: 'system',
          content: `You are a Blue Pixel AI real estate assistant. You help with property investment analysis, mortgage calculations, and market insights. Use the provided tool data to give accurate, helpful responses. Be conversational but professional.`
        },
        {
          role: 'user',
          content: message
        }
      ];

      // Add tool results as context
      if (Object.keys(toolResults).length > 0) {
        let toolContext = "Available data from tools:\n";
        for (const [toolName, result] of Object.entries(toolResults)) {
          if (!result.error) {
            toolContext += `\n${toolName}: ${JSON.stringify(result, null, 2)}\n`;
          }
        }
        
        messages.push({
          role: 'system',
          content: toolContext
        });
      }

      const completion = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        messages,
        max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 500,
        temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7
      });

      return completion.choices[0].message.content;

    } catch (error) {
      logger.error('Error generating AI response:', error);
      
      // Fallback response based on tool results
      if (Object.keys(toolResults).length > 0) {
        let response = "Based on the available data:\n\n";
        
        if (toolResults.calculateMortgage && !toolResults.calculateMortgage.error) {
          const calc = toolResults.calculateMortgage;
          response += `For a $${calc.propertyPrice.toLocaleString()} property with $${calc.downPayment.toLocaleString()} down payment:\n`;
          response += `- Monthly payment: $${calc.monthlyPayment.toLocaleString()}\n`;
          response += `- Total interest: $${calc.totalInterest.toLocaleString()}\n\n`;
        }
        
        if (toolResults.searchPropertyInfo) {
          response += `Found ${toolResults.searchPropertyInfo.totalResults} properties matching your criteria.\n\n`;
        }
        
        if (toolResults.getInterestRates) {
          response += `Current interest rates: ${toolResults.getInterestRates.currentRate}%\n\n`;
        }
        
        return response + "How else can I help you with your real estate needs?";
      }
      
      return "I'm here to help with your real estate questions. You can ask me about property searches, mortgage calculations, investment analysis, and current market rates.";
    }
  }

  extractPropertyData(toolResults) {
    const propertyData = {};

    if (toolResults.searchPropertyInfo) {
      propertyData.searchResults = toolResults.searchPropertyInfo;
    }

    if (toolResults.getPropertyDetails) {
      propertyData.propertyDetails = toolResults.getPropertyDetails;
    }

    if (toolResults.calculateMortgage) {
      propertyData.mortgageCalculation = toolResults.calculateMortgage;
    }

    return Object.keys(propertyData).length > 0 ? propertyData : null;
  }

  // Utility methods
  containsAny(text, keywords) {
    return keywords.some(keyword => text.includes(keyword));
  }

  extractLocation(message) {
    const commonLocations = [
      'downtown', 'midtown', 'uptown', 'suburbs', 'california', 'texas',
      'florida', 'new york', 'chicago', 'los angeles', 'miami'
    ];

    const messageLower = message.toLowerCase();
    for (const location of commonLocations) {
      if (messageLower.includes(location)) {
        return location.charAt(0).toUpperCase() + location.slice(1);
      }
    }
    return null;
  }

  extractNumbers(message) {
    const numbers = message.match(/\d+(?:,\d{3})*(?:\.\d+)?/g);
    return numbers ? numbers.map(num => parseFloat(num.replace(/,/g, ''))) : [];
  }
}