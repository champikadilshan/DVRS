// backend/services/ai/ollamaService.js

const axios = require('axios');
const EventEmitter = require('events');

class OllamaService extends EventEmitter {
    constructor() {
        super();
        this.baseUrl = 'http://localhost:11434';
    }

    async generateVulnerabilityAnalysis(data) {
        try {
            this.emit('log', { 
                type: 'info', 
                message: 'Initializing Mistral model...',
                timestamp: new Date()
            });

            this.emit('log', { 
                type: 'info', 
                message: 'Preparing vulnerability data for analysis...',
                timestamp: new Date()
            });

            const prompt = this.constructPrompt(data);
            
            this.emit('log', { 
                type: 'info', 
                message: 'Sending request to Mistral model...',
                timestamp: new Date()
            });

            const response = await axios.post(`${this.baseUrl}/api/generate`, {
                model: "mistral:latest",
                prompt: prompt,
                stream: false
            });

            this.emit('log', { 
                type: 'success', 
                message: 'Analysis completed successfully',
                timestamp: new Date()
            });

            return {
                analysis: response.data.response,
                logs: this.formatAnalysisLogs(response.data)
            };
        } catch (error) {
            this.emit('log', { 
                type: 'error', 
                message: `Error: ${error.message}`,
                timestamp: new Date()
            });
            throw error;
        }
    }

    formatAnalysisLogs(responseData) {
        return {
            modelInfo: 'Mistral Latest',
            processingTime: responseData.total_duration,
            tokenCount: responseData.eval_count,
            promptTokens: responseData.prompt_eval_count,
            timestamp: new Date()
        };
    }

    constructPrompt(data) {
        const findings = data.data?.findings || [];
        const findingsText = findings.map(f => 
            `- Name: ${f.name}\n  Severity: ${f.severity}\n  Description: ${f.description}`
        ).join('\n');

        return `As a security expert, analyze the following vulnerability findings and provide a detailed report with specific mitigation strategies. Focus on practical, actionable solutions.

Vulnerability Findings:
${findingsText}

Please provide a detailed analysis in the following format:

1. SEVERITY OVERVIEW
[Provide a brief overview of the severity levels found]

2. CRITICAL FINDINGS
[List and analyze any critical vulnerabilities]

3. MITIGATION STRATEGIES
[Provide specific, actionable steps for mitigation]

4. SECURITY RECOMMENDATIONS
[List best practices and long-term security improvements]

5. PRIORITIZATION PLAN
[Provide a prioritized list of actions to take]

Please be specific and include technical details where relevant.`;
    }
}

module.exports = new OllamaService();