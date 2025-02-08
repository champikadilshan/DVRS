// backend/routes/aiAnalysis.js

const express = require('express');
const router = express.Router();
const ollamaService = require('../services/ai/ollamaService');
const path = require('path');
const fs = require('fs/promises');

router.post('/analyze/ai', async (req, res) => {
    const { logId, data } = req.body;

    if (!data) {
        return res.status(400).json({ error: 'No data provided for analysis' });
    }

    try {
        const logs = [];
        ollamaService.on('log', (log) => {
            logs.push(log);
        });

        const analysisResult = await ollamaService.generateVulnerabilityAnalysis(data);

        const aiAnalysis = {
            timestamp: new Date().toISOString(),
            logId: logId,
            analysis: analysisResult.analysis,
            processingLogs: logs,
            technicalLogs: analysisResult.logs,
            metadata: {
                model: "mistral:latest",
                analysisVersion: "1.0"
            }
        };

        const analysisDir = path.join(__dirname, '../data/ai-analysis');
        await fs.mkdir(analysisDir, { recursive: true });
        
        const filename = `analysis-${logId}-${Date.now()}.json`;
        await fs.writeFile(
            path.join(analysisDir, filename),
            JSON.stringify(aiAnalysis, null, 2)
        );

        res.json({
            success: true,
            analysis: analysisResult.analysis,
            logs: logs,
            technicalLogs: analysisResult.logs,
            savedAs: filename
        });

    } catch (error) {
        res.status(500).json({
            error: 'Failed to generate AI analysis',
            message: error.message,
            logs: logs
        });
    }
});

router.get('/analyze/ai/:id', async (req, res) => {
    try {
        const analysisDir = path.join(__dirname, '../data/ai-analysis');
        const files = await fs.readdir(analysisDir);
        
        const analysisFile = files.find(f => f.includes(req.params.id));
        
        if (!analysisFile) {
            return res.status(404).json({ error: 'Analysis not found' });
        }

        const analysisData = await fs.readFile(
            path.join(analysisDir, analysisFile),
            'utf-8'
        );

        res.json(JSON.parse(analysisData));
    } catch (error) {
        res.status(500).json({
            error: 'Failed to retrieve analysis',
            message: error.message
        });
    }
});

module.exports = router;