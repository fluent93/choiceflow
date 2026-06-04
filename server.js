require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable JSON parsing middleware
app.use(express.json());

// Serve static files from the current folder
app.use(express.static(__dirname));

// Route to check if server-side Groq API key is configured
app.get('/api/config', (req, res) => {
    res.json({
        serverKeyAvailable: !!process.env.GROQ_API_KEY
    });
});

// Simple memory-based rate limiting (Resets every calendar day)
let dailyRequestCount = 0;
let lastResetDate = new Date().toDateString();

// Middleware to check rate limits
function checkRateLimit(req, res, next) {
    const currentDate = new Date().toDateString();
    if (currentDate !== lastResetDate) {
        dailyRequestCount = 0;
        lastResetDate = currentDate;
    }

    const maxDailyRequests = parseInt(process.env.MAX_DAILY_REQUESTS) || 150;
    if (dailyRequestCount >= maxDailyRequests) {
        return res.status(429).json({
            error: 'quota_exceeded',
            message: '서버 일일 AI 사용량 한도가 소진되었습니다. 계속 실시간 AI 분석을 사용하시려면 환경 설정에서 본인의 API 키를 등록해 주세요.'
        });
    }
    next();
}

// 1. AI Auto-populate endpoint
app.post('/api/auto-populate', checkRateLimit, async (req, res) => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'Server-side Groq API key is not configured.' });
    }

    try {
        const { dilemma, context, language } = req.body;
        const systemPrompt = `You are an expert strategic decision consultant.
Analyze the user's dilemma and context, and generate a customized Multi-Criteria Decision Analysis (MCDA) matrix structure.
You must output a JSON object in this format:
{
  "options": ["Option A", "Option B"],
  "criteria": [
    {"name": "Criterion 1", "weight": 4},
    {"name": "Criterion 2", "weight": 3}
  ],
  "scores": {
    "Criterion 1": {
      "Option A": 8,
      "Option B": 5
    },
    "Criterion 2": {
      "Option A": 4,
      "Option B": 9
    }
  }
}
Generate 2 to 4 options and 3 to 5 realistic, relevant criteria.
Weights must be integers from 1 to 5.
Scores must be integers from 1 to 10 based on the context.
Ensure all names match exactly. Output only the JSON. Language of content: ${language === 'ko' ? 'Korean' : 'English'}.`;

        const userPrompt = `Dilemma: ${dilemma}\nContext: ${context || 'None provided.'}`;

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.4,
                response_format: { type: 'json_object' }
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Groq API responded with status ${response.status}: ${errText}`);
        }

        const data = await response.json();
        const jsonText = data.choices[0].message.content;
        const cleanedText = cleanJsonString(jsonText);
        const result = JSON.parse(cleanedText);

        dailyRequestCount++;
        res.json(result);

    } catch (err) {
        console.error('Error during auto-populate:', err.message);
        res.status(500).json({ error: 'Failed to auto-populate matrix: ' + err.message });
    }
});

// 1.5. AI Instant Diagnose (MCDA generation + analysis in one call)
app.post('/api/instant-diagnose', checkRateLimit, async (req, res) => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'Server-side Groq API key is not configured.' });
    }

    try {
        const { dilemma, context, language } = req.body;
        const systemPrompt = `You are a world-class strategic decision consultant and senior psychologist.
Analyze the user's dilemma and context, and perform a complete MCDA (Multi-Criteria Decision Analysis) evaluation.
Generate the options, evaluation criteria, weights, scores, and write a deep, highly personalized recommendation report.
Be analytical, precise, and decisive. Do not sit on the fence—deliver a clear recommendation.
Your response must be in the following strict JSON format, written in ${language === 'ko' ? 'Korean' : 'English'}:
{
  "options": ["Option A", "Option B"],
  "criteria": [
    {"name": "Criterion 1", "weight": 4},
    {"name": "Criterion 2", "weight": 3}
  ],
  "scores": {
    "Criterion 1": {
      "Option A": 8,
      "Option B": 5
    },
    "Criterion 2": {
      "Option A": 4,
      "Option B": 9
    }
  },
  "summary": "Deep, multi-paragraph recommendation explaining why the winner is optimal, addressing psychological trade-offs.",
  "detailedAnalysis": [
    {
      "criterion": "Criterion 1",
      "analysis": "A detailed multi-sentence comparative analysis explaining how and why options perform on this criterion. CRITICAL: The analysis for each criterion must be extremely detailed, concrete, and rich in realistic context. You must not merely repeat the scores or say one option is better. You must draw upon your vast knowledge base to provide specific factual or highly plausible details (e.g. if dilemma is travel: compare options using concrete local delicacies like Yeosu's marinated crab vs. Tongyeong's sea squirt bibimbap, specific transit methods like KTX travel times vs. driving routes, and estimated budget ranges or lodging costs; if dilemma is career: compare typical salary numbers, growth outlooks, commute paths, or work hours). Each criterion comparison must be a full, rich paragraph of 3-5 highly detailed sentences."
    }
  ],
  "frameworkName": "Strategic framework name used (e.g., Jeff Bezos' Regret Minimization Framework)",
  "frameworkAnalysis": "Application of the framework specifically to the user's current situation.",
  "biasName": "Cognitive bias relevant to this decision (e.g., Sunk Cost Fallacy, Status Quo Bias)",
  "biasDesc": "Explanation of the bias and psychological advice tailored to the user's specific context.",
  "actions": [
    "Immediate action step within 24 hours...",
    "Action step within 48 hours...",
    "Action step within 72 hours..."
  ]
}
Generate 2 to 4 options and 3 to 5 realistic, relevant criteria.
Weights must be integers from 1 to 5.
Scores must be integers from 1 to 10.
Ensure all option and criteria names match exactly in the scores map. Provide a detailed comparative analysis for every criterion in the detailedAnalysis array. Output only JSON.`;

        const userPrompt = `Dilemma: ${dilemma}\nContext: ${context || 'None provided.'}`;

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.4,
                response_format: { type: 'json_object' }
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Groq API responded with status ${response.status}: ${errText}`);
        }

        const data = await response.json();
        const jsonText = data.choices[0].message.content;
        const cleanedText = cleanJsonString(jsonText);
        const result = JSON.parse(cleanedText);

        dailyRequestCount++;
        res.json(result);

    } catch (err) {
        console.error('Error during instant-diagnose:', err.message);
        res.status(500).json({ error: 'Failed to perform instant diagnosis: ' + err.message });
    }
});

// New Endpoint: AI Co-creative Dialogue Setup
app.post('/api/chat-consult', checkRateLimit, async (req, res) => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'Server-side Groq API key is not configured.' });
    }

    try {
        const { dilemma, context, chatHistory, forceFinish, language } = req.body;
        
        // Count how many user turns have occurred in history
        const userMessages = chatHistory ? chatHistory.filter(m => m.role === 'user') : [];
        const isFinalTurn = forceFinish || (userMessages.length >= 3);

        const systemPrompt = `You are a world-class strategic decision consultant and senior psychologist.
You are helping the user co-create their decision matrix (Options, Criteria, Weights 1-5, Scores 1-10) for their dilemma.
Keep the conversation engaging, analytical, and supportive.

Your current mode: ${isFinalTurn ? 'FINAL_REPORT_MODE' : 'DIALOGUE_MODE'}.

Language to use: ${language === 'ko' ? 'Korean' : 'English'}.

${isFinalTurn ? `
[FINAL_REPORT_MODE]
The dialogue is complete. You must finalize the matrix and write a detailed premium consultation report.
You must output a JSON object in this format:
{
  "reply": "모든 분석이 완료되었습니다. 아래 버튼을 눌러 최종 처방 대시보드를 확인하세요.",
  "isFinished": true,
  "currentMatrix": {
    "options": ["Option A", "Option B"],
    "criteria": [
      {"name": "Criterion 1", "weight": 4},
      {"name": "Criterion 2", "weight": 3}
    ],
    "scores": {
      "Criterion 1": {"Option A": 8, "Option B": 5},
      "Criterion 2": {"Option A": 4, "Option B": 9}
    }
  },
  "finalReport": {
    "summary": "Deep overall strategic advice explaining why the winner is optimal, addressing psychological conflicts and subconscious values.",
    "detailedAnalysis": [
      {
        "criterion": "Criterion Name 1",
        "analysis": "Detailed comparison of how the options score on this criterion and why. CRITICAL: The analysis for each criterion must be extremely detailed, concrete, and rich in realistic context. You must not merely repeat the scores or say one option is better. You must draw upon your vast knowledge base to provide specific factual or highly plausible details (e.g. if dilemma is travel: compare options using concrete local delicacies like Yeosu's marinated crab vs. Tongyeong's sea squirt bibimbap, specific transit methods like KTX travel times vs. driving routes, and estimated budget ranges or lodging costs; if dilemma is career: compare typical salary numbers, growth outlooks, commute paths, or work hours). Each criterion comparison must be a full, rich paragraph of 3-5 highly detailed sentences."
      }
    ],
    "frameworkName": "Jeff Bezos' Regret Minimization Framework",
    "frameworkAnalysis": "Application of the framework to this specific decision.",
    "biasName": "Sunk Cost Fallacy",
    "biasDesc": "Explanation of bias warning and psychological advice.",
    "actions": [
      "Immediate action (within 24 hours)",
      "Medium term action (within 48 hours)",
      "Longer term action (within 72 hours)"
    ]
  }
}
Generate 2 to 4 options and 3 to 5 criteria. Weights must be integers 1-5. Scores must be integers 1-10.
Ensure detailedAnalysis has a comparative analysis for EVERY criterion in the criteria list.`
: `
[DIALOGUE_MODE]
You are asking the next question to refine the matrix. Do not generate the final report yet.
Suggest 2-3 Options and 3-4 Criteria based on the dilemma, and update them dynamically in currentMatrix as the conversation progresses.
In each turn, ask ONE specific, dilemma-relevant question (e.g., clarifying priorities or trade-offs) and offer 2-3 quick answers.
You must output a JSON object in this format:
{
  "reply": "Conversational reply acknowledging user's input, explaining the current thoughts, and asking the next question.",
  "suggestedOptions": ["Quick reply 1", "Quick reply 2"],
  "currentMatrix": {
    "options": ["Option A", "Option B"],
    "criteria": [
      {"name": "Criterion 1", "weight": 4},
      {"name": "Criterion 2", "weight": 3}
    ],
    "scores": {
      "Criterion 1": {"Option A": 8, "Option B": 5},
      "Criterion 2": {"Option A": 4, "Option B": 9}
    }
  },
  "isFinished": false
}
Generate initial options/criteria on the first turn (when history is empty) and refine them on subsequent turns based on user input. Weights must be integers 1-5, scores 1-10.`
}

Output ONLY the JSON object. Do not wrap in markdown unless needed.`;

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Dilemma: ${dilemma}\nContext: ${context || 'None'}` }
        ];

        if (chatHistory && chatHistory.length > 0) {
            chatHistory.forEach(msg => {
                messages.push({ role: msg.role, content: msg.content });
            });
        }

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: messages,
                temperature: 0.4,
                response_format: { type: 'json_object' }
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Groq API responded with status ${response.status}: ${errText}`);
        }

        const data = await response.json();
        const jsonText = data.choices[0].message.content;
        const cleanedText = cleanJsonString(jsonText);
        const result = JSON.parse(cleanedText);

        dailyRequestCount++;
        res.json(result);

    } catch (err) {
        console.error('Error during chat-consult:', err.message);
        res.status(500).json({ error: 'Failed to process co-creation chat: ' + err.message });
    }
});

// New Endpoint: Post-cockpit continuous Q&A consulting
app.post('/api/chat-consulting-continuous', checkRateLimit, async (req, res) => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'Server-side Groq API key is not configured.' });
    }

    try {
        const { dilemma, matrix, chatHistory, message, language } = req.body;

        const systemPrompt = `You are a world-class strategic decision consultant and senior psychologist.
The user has completed their decision cockpit matrix and is asking questions about the final report, matrix values, or trade-offs.

Dilemma: "${dilemma}"
Matrix Data: ${JSON.stringify(matrix)}

Your goal is to provide a deep, highly helpful, and analytical response in markdown format. 
Answer their specific query, explain underlying trade-offs, and suggest alternatives or modifications if requested.
Do not sit on the fence—give clear, professional guidance.

Write your response in ${language === 'ko' ? 'Korean' : 'English'}.
You must output a JSON object in this format:
{
  "reply": "Markdown formatted reply..."
}
Output ONLY the JSON.`;

        const messages = [
            { role: 'system', content: systemPrompt }
        ];

        if (chatHistory && chatHistory.length > 0) {
            chatHistory.forEach(msg => {
                messages.push({ role: msg.role, content: msg.content });
            });
        }
        messages.push({ role: 'user', content: message });

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: messages,
                temperature: 0.5,
                response_format: { type: 'json_object' }
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Groq API responded with status ${response.status}: ${errText}`);
        }

        const data = await response.json();
        const jsonText = data.choices[0].message.content;
        const cleanedText = cleanJsonString(jsonText);
        const result = JSON.parse(cleanedText);

        dailyRequestCount++;
        res.json(result);

    } catch (err) {
        console.error('Error during continuous consulting:', err.message);
        res.status(500).json({ error: 'Failed to process continuous consulting: ' + err.message });
    }
});

// 2. AI Generate breakthrough questions endpoint
app.post('/api/generate-questions', checkRateLimit, async (req, res) => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'Server-side Groq API key is not configured.' });
    }

    try {
        const { dilemma, options, criteria, scores, language } = req.body;
        const systemPrompt = `You are an expert decision psychologist.
Analyze the user's decision matrix (dilemma, options, criteria, and scores) to find the core underlying trade-offs and psychological conflicts.
Generate exactly 3 deep, breakthrough psychological questions that will help the user clarify their true priorities.
Each question must have 2 or 3 clear options representing different value priorities.
You must output a JSON object in this format:
{
  "questions": [
    {
      "id": "q1",
      "text": "Deep question...",
      "options": [
        {"text": "Answer option 1...", "value": "Option 1 value..."},
        {"text": "Answer option 2...", "value": "Option 2 value..."}
      ]
    },
    ...
  ]
}
Write the questions and options in ${language === 'ko' ? 'Korean' : 'English'}. Output only the JSON.`;

        const userPrompt = `Dilemma: ${dilemma}\nOptions: ${JSON.stringify(options)}\nCriteria: ${JSON.stringify(criteria)}\nScores: ${JSON.stringify(scores)}`;

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.6,
                response_format: { type: 'json_object' }
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Groq API responded with status ${response.status}: ${errText}`);
        }

        const data = await response.json();
        const jsonText = data.choices[0].message.content;
        const cleanedText = cleanJsonString(jsonText);
        const result = JSON.parse(cleanedText);

        dailyRequestCount++;
        res.json(result);

    } catch (err) {
        console.error('Error during generate-questions:', err.message);
        res.status(500).json({ error: 'Failed to generate questions: ' + err.message });
    }
});

// 3. Route to proxy Groq API analysis requests (Updated for Premium Prescription Report)
app.post('/api/analyze', checkRateLimit, async (req, res) => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'Server-side Groq API key is not configured.' });
    }

    try {
        const payload = req.body;
        const systemPrompt = `You are an expert strategic decision consultant and senior psychologist.
Analyze the user's dilemma, options, criteria scores, weights, and interview answers, and provide an insightful final prescription report.
Be analytical, precise, and decisive. Do not sit on the fence—deliver a clear, robust recommendation.
You must output your analysis in the following strict JSON format, containing no other text:
{
  "summary": "A deep, multi-paragraph recommendation and diagnostic report explaining why the winner is optimal, addressing psychological trade-offs and subconscious values.",
  "detailedAnalysis": [
    {
      "criterion": "Criterion Name",
      "analysis": "A detailed comparative analysis explaining how and why options perform on this criterion. CRITICAL: The analysis for each criterion must be extremely detailed, concrete, and rich in realistic context. You must not merely repeat the scores or say one option is better. You must draw upon your vast knowledge base to provide specific factual or highly plausible details (e.g. if dilemma is travel: compare options using concrete local delicacies like Yeosu's marinated crab vs. Tongyeong's sea squirt bibimbap, specific transit methods like KTX travel times vs. driving routes, and estimated budget ranges or lodging costs; if dilemma is career: compare typical salary numbers, growth outlooks, commute paths, or work hours). Each criterion comparison must be a full, rich paragraph of 3-5 highly detailed sentences."
    }
  ],
  "frameworkName": "Strategic framework name used (e.g. Jeff Bezos' Regret Minimization Framework, Asymmetric Risk-Reward, SWOT Matrix, etc.)",
  "frameworkAnalysis": "Application of the framework specifically to the user's current situation.",
  "biasName": "Name of the cognitive bias relevant to this decision (e.g., Sunk Cost Fallacy, Status Quo Bias, Loss Aversion, etc.)",
  "biasDesc": "Explanation of the cognitive bias and psychological guidance tailored to the user's specific context.",
  "actions": [
    "Immediate action step within 24 hours...",
    "Action step within 48 hours...",
    "Action step within 72 hours..."
  ]
}
CRITICAL: You must write the report in ${payload.language}. Ensure detailedAnalysis has a comparative analysis for every criterion in the matrix. Output only JSON.`;

        const userPrompt = `Input Data: ${JSON.stringify(payload)}`;

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.3,
                response_format: { type: 'json_object' }
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Groq API responded with status ${response.status}: ${errText}`);
        }

        const data = await response.json();
        const jsonText = data.choices[0].message.content;
        
        // Clean JSON text in case Groq wraps it in markdown blocks
        const cleanedText = cleanJsonString(jsonText);
        const result = JSON.parse(cleanedText);

        dailyRequestCount++;
        res.json(result);

    } catch (err) {
        console.error('Error during Groq API analysis:', err.message);
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
        if (process.env.GROQ_API_KEY) {
            console.log('Groq API key configured and ready for Llama 3.3.');
        } else {
            console.log('WARNING: GROQ_API_KEY env variable is not set. Server proxy will fall back to local engines.');
        }
    });
}
