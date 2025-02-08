// src/services/ai/aiAnalysisService.js

import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

export const aiAnalysisService = {
    async analyzeVulnerabilities(logId, data) {
        try {
            const response = await axios.post(`${API_BASE_URL}/analyze/ai`, {
                logId,
                data
            });
            return response.data;
        } catch (error) {
            console.error('AI Analysis Error:', error);
            throw new Error(error.response?.data?.message || 'Failed to perform AI analysis');
        }
    },

    async getAnalysisResult(analysisId) {
        try {
            const response = await axios.get(`${API_BASE_URL}/analyze/ai/${analysisId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching analysis:', error);
            throw new Error(error.response?.data?.message || 'Failed to fetch analysis results');
        }
    }
};