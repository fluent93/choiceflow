require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable JSON parsing middleware
app.use(express.json());

// Serve static files from the current folder
app.use(express.static(__dirname));

// Route to check if server-side Gemini API key is configured
app.get('/api/config', (req, res) => {
    res.json({
        serverKeyAvailable: !!process.env.GEMINI_API_KEY
    });
});

// Simple memory-based rate limiting (Resets every calendar day)
let dailyRequestCount = 0;
let lastResetDate = new Date().toDateString();

// Route to proxy Gemini API analysis requests
app.post('/api/analyze', async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'Server-side Gemini API key is not configured.' });
    }

    // 1. Reset daily request limit if date has changed
    const currentDate = new Date().toDateString();
    if (currentDate !== lastResetDate) {
        dailyRequestCount = 0;
        lastResetDate = currentDate;
    }

    // 2. Check daily request limit
    const maxDailyRequests = parseInt(process.env.MAX_DAILY_REQUESTS) || 100;
    if (dailyRequestCount >= maxDailyRequests) {
        return res.status(429).json({
            error: 'quota_exceeded',
            message: '서버 일일 AI 사용량 한도가 소진되었습니다. 계속 실시간 AI 분석을 사용하시려면 환경 설정에서 본인의 API 키를 등록해 주세요.'
        });
    }

    try {
        const payload = req.body;
        const systemPrompt = `You are an expert AI consulting assistant specialized in human decision psychology.
Analyze the user's dilemma, options, criteria scores, weights, and interview answers, and provide an insightful final recommendation report.
CRITICAL: You must write the report in ${payload.language}.

Please output your analysis in the following strict JSON format, containing no other text:
{
  "summary": "Detailed final analysis text explaining why the winner is optimal based on the weights.",
  "biasName": "Name of the cognitive bias warning relevant to this decision",
  "biasDesc": "Explanation of the cognitive bias and psychological guidance.",
  "actions": ["Action item 1", "Action item 2", "Action item 3"]
}`;

        const userPrompt = `Input Data: ${JSON.stringify(payload)}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `${systemPrompt}\n\n${userPrompt}`
                    }]
                }],
                generationConfig: {
                    responseMimeType: "application/json"
                }
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Gemini API responded with status ${response.status}: ${errText}`);
        }

        const data = await response.json();
        const jsonText = data.candidates[0].content.parts[0].text;
        
        // Clean JSON text in case Gemini wraps it in markdown blocks
        const cleanedText = cleanJsonString(jsonText);
        const result = JSON.parse(cleanedText);

        // Increment count on successful request
        dailyRequestCount++;

        res.json(result);

    } catch (err) {
        console.error('Error during Gemini API analysis:', err.message);
        res.status(500).json({ error: 'Failed to process AI analysis: ' + err.message });
    }
});

// Helper function to clean markdown wrappers around JSON strings
function cleanJsonString(text) {
    let clean = text.trim();
    if (clean.startsWith('```json')) {
        clean = clean.substring(7);
    } else if (clean.startsWith('```')) {
        clean = clean.substring(3);
    }
    if (clean.endsWith('```')) {
        clean = clean.substring(0, clean.length - 3);
    }
    return clean.trim();
}

// Fallback to serve index.html for client-side routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Export app for serverless deployment on platforms like Vercel
module.exports = app;

// Listen only when run locally (not in serverless environments)
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`ChoiceFlow server running at http://localhost:${PORT}`);
        if (process.env.GEMINI_API_KEY) {
            console.log('Gemini API key configured and ready.');
        } else {
            console.log('WARNING: GEMINI_API_KEY env variable is not set. Server proxy will fall back to local engines.');
        }
    });
}
