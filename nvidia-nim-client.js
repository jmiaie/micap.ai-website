/**
 * NVIDIA NIM API Client
 * Provides unified interface for calling NVIDIA NIM models (Kimi, etc.)
 */

const https = require('https');

class NVIDIANIMClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://integrate.api.nvidia.com/v1';
    this.defaultModel = 'meta/llama-3.1-70b-instruct'; // Fallback model
  }

  /**
   * Generate content using NVIDIA NIM
   * @param {string} prompt - The prompt to send
   * @param {Object} options - Additional options
   * @returns {Promise<string>} - The generated response
   */
  async generateContent(prompt, options = {}) {
    const model = options.model || this.defaultModel;
    
    const payload = {
      model: model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: options.temperature || 0.7,
      top_p: options.top_p || 0.9,
      max_tokens: options.max_tokens || 2048
    };

    return new Promise((resolve, reject) => {
      const postData = JSON.stringify(payload);
      
      const reqOptions = {
        hostname: 'integrate.api.nvidia.com',
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(reqOptions, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            if (res.statusCode === 200) {
              const response = JSON.parse(data);
              const content = response.choices?.[0]?.message?.content;
              
              if (!content) {
                reject(new Error('No content in response'));
              } else {
                resolve(content);
              }
            } else {
              reject(new Error(`[${res.statusCode}] ${data}`));
            }
          } catch (e) {
            reject(new Error(`Failed to parse response: ${e.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.write(postData);
      req.end();
    });
  }

  /**
   * Generate use cases for ROI calculator
   * @param {Object} params - Company parameters
   * @returns {Promise<Array>} - Array of use cases
   */
  async generateUseCases(params) {
    const { companyName, industry, companySize, painPoints } = params;
    
    const prompt = `You are an AI business consultant. Generate exactly 3 specific, actionable AI use cases for this company:

Company: ${companyName}
Industry: ${industry}
Size: ${companySize}
Pain Points: ${painPoints}

For EACH use case, provide a JSON object with these exact fields:
- title: Brief title (max 50 chars)
- description: 1-2 sentence description
- annualSavings: Estimated annual savings in dollars (number, no commas or dollar signs)
- roi: ROI percentage (number, no percent sign)
- timeline: Implementation timeline (e.g., "3-6 months")

Return ONLY a valid JSON array of 3 objects. No markdown, no code fences, no explanation, just the JSON array.`;

    const response = await this.generateContent(prompt, {
      model: 'meta/llama-3.1-70b-instruct',
      temperature: 0.7,
      max_tokens: 1500
    });

    // Clean and parse JSON response
    let jsonStr = response.trim();
    
    // Remove markdown code fences if present
    jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // Extract JSON array
    const jsonMatch = jsonStr.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON array from response');
    }

    const useCases = JSON.parse(jsonMatch[0]);
    
    // Validate and coerce types
    if (!Array.isArray(useCases) || useCases.length === 0) {
      throw new Error('Response is not a valid array of use cases');
    }

    return useCases.map(uc => ({
      title: String(uc.title || '').substring(0, 50),
      description: String(uc.description || ''),
      annualSavings: Math.max(0, Number(uc.annualSavings) || 0),
      roi: Math.max(0, Number(uc.roi) || 0),
      timeline: String(uc.timeline || '3-6 months')
    }));
  }

  /**
   * Chat for ROI analysis
   * @param {string} message - User message
   * @param {Array} history - Conversation history
   * @param {Object} businessParams - Business parameters
   * @returns {Promise<string>} - Chat response
   */
  async chat(message, history = [], businessParams = {}) {
    const systemPrompt = `You are Micap AI's ROI Analysis Assistant. You help companies understand the financial impact of AI automation.

You have access to this company's information:
- Revenue: $${businessParams.revenue || 'Unknown'}
- Headcount: ${businessParams.headcount || 'Unknown'}
- Labor Rate: $${businessParams.laborRate || 'Unknown'}/hour
- Industry: ${businessParams.industry || 'Unknown'}

Your role:
1. Ask clarifying questions about their current operations
2. Identify automation opportunities
3. Calculate potential ROI and savings
4. Provide implementation recommendations
5. Explain their Capacity Multiplier

For follow-up questions, provide detailed analysis on the specific topic they ask about.`;

    // Build proper messages array with system role
    const messages = [
      {
        role: 'system',
        content: systemPrompt
      }
    ];

    // Add conversation history (last 10 messages)
    if (history && Array.isArray(history)) {
      for (const msg of history.slice(-10)) {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        });
      }
    }

    // Add current message
    messages.push({
      role: 'user',
      content: message
    });

    // Use proper chat payload with messages array
    return new Promise((resolve, reject) => {
      const payload = {
        model: 'meta/llama-3.1-70b-instruct',
        messages: messages,
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 2000
      };

      const postData = JSON.stringify(payload);
      
      const reqOptions = {
        hostname: 'integrate.api.nvidia.com',
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 10000 // 10 second timeout
      };

      const req = https.request(reqOptions, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            if (res.statusCode === 200) {
              const response = JSON.parse(data);
              const content = response.choices?.[0]?.message?.content;
              
              if (!content) {
                reject(new Error('No content in chat response'));
              } else {
                resolve(content);
              }
            } else {
              reject(new Error(`[${res.statusCode}] ${data}`));
            }
          } catch (e) {
            reject(new Error(`Failed to parse chat response: ${e.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('NVIDIA NIM API request timeout'));
      });

      req.write(postData);
      req.end();
    });
  }
}

module.exports = NVIDIANIMClient;
