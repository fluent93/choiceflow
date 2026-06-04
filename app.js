/**
 * ChoiceFlow Application Logic
 * State Management, Multilingual Support (KO/EN), Decision Matrix Calculations, and Gemini API integration.
 */

const STATE = {
    lang: localStorage.getItem('choiceflow_lang') || 'ko',
    dilemma: '',
    options: [],
    criteria: [],
    scores: {}, // Format: { "비용": { "선택지 A": 7, "선택지 B": 5 } }
    currentStep: 1,
    chatAnswers: {},
    geminiApiKey: localStorage.getItem('gemini_api_key') || '',
    serverKeyAvailable: false,
    localAiAvailable: false,
    isAiDraft: false,
    dynamicQuestions: null
};

// Multilingual Dictionary
const TRANSLATIONS = {
    ko: {
        badge: "현대인의 결정 장애 해결사",
        heroTitle: "더 나은 결정을 위한<br><span class=\"gradient-text\">데이터와 AI 분석</span>",
        heroSubtitle: "선택의 늪에서 벗어나세요. 선택지들을 구조화하고 가중치를 매겨 최선의 결정을 도출해 드립니다.",
        dilemmaPrompt: "어떤 고민을 하고 계신가요?",
        dilemmaPlaceholder: "예: 이번 휴가지는 어디로 갈까? / 이직을 할까 말까?",
        btnStart: "시작하기",
        settingsTitle: "환경 설정",
        engineStatusTitle: "활성 AI 엔진 상태",
        engineStatusServerActive: "서버 API: 연결됨 (인증키 불필요)",
        engineStatusServerInactive: "서버 API: 환경변수 미등록 (미사용)",
        engineStatusLocalActive: "내장 AI (Gemini Nano): 사용 가능",
        engineStatusLocalInactive: "내장 AI (Gemini Nano): 미지원",
        engineStatusUserActive: "수동 인증키: 오버라이드 활성",
        engineStatusUserInactive: "수동 인증키: 미설정",
        presetsTitle: "자주 하는 고민 템플릿",
        stepLabel1: "선택지 입력",
        stepLabel2: "기준 설정",
        stepLabel3: "점수 매기기",
        stepLabel4: "가중치 튜닝",
        stepDesc1: "비교할 선택지들을 최소 2개 이상 입력해 주세요.",
        btnAddOption: "선택지 추가",
        stepDesc2: "의사결정 시 중요하게 고려할 기준들을 설정하세요. (예: 비용, 재미, 스트레스 등)",
        btnAddCriteria: "기준 추가",
        suggestionsTitle: "추천 고려 기준 (클릭해서 추가)",
        stepDesc3: "각 기준별로 어떤 선택지가 더 우수한지 점수(1~10점)를 매겨주세요.",
        stepDesc4: "AI와의 대화를 통해 무엇이 당신에게 가장 중요한 가치인지 파악하고 가중치를 최종 튜닝합니다.",
        btnPrev: "이전",
        btnNext: "다음",
        dashboardBadge: "최종 분석 결과",
        matrixChartTitle: "의사결정 매트릭스 결과",
        aiTitle: "AI Choice Assistant 분석",
        verdictHeader: "최종 제언 및 분석",
        biasHeader: "인지적 편향 경고 (Cognitive Bias Alert)",
        actionHeader: "결정 후 즉시 실행할 Action Items",
        btnRestart: "처음부터 다시하기",
        btnExport: "결과 인쇄 및 PDF 저장",
        btnUpdateReport: "수정치로 AI 리포트 업데이트",
        btnOpenChat: "AI 1:1 상담",
        apiDesc: "실제 실시간 AI 맞춤형 처방을 받기 원하시면 Gemini API 키를 등록하세요. 키는 브라우저의 로컬 스토리지에만 안전하게 보관됩니다.",
        apiKeyLabel: "Gemini API Key",
        apiHelp: "키가 없을 시에는 내장된 결정 심리학 엔진(Simulated)이 합리적으로 결과를 도출해 드립니다.",
        btnSaveApi: "설정 저장",
        
        // Dynamic Texts inside JS
        defaultOption: "선택지",
        defaultCriterion: "기준",
        weightLabel: "가중치",
        scoreLabel: "점수",
        winnerTitle: "종합 매트릭스 1순위 대안",
        aiWinnerTitle: "실시간 AI 종합 처방 대안",
        scoreUnit: "점",
        outOfTen: "점 / 10점",
        matrixTableHeader1: "평가 기준",
        matrixTableHeader2: "가중치",
        
        alertStartDilemma: "고민하고 계신 주제를 먼저 적어주세요!",
        alertMinOptions: "비교를 위해 최소 2개 이상의 선택지를 채워주세요!",
        alertMinCriteria: "의사결정을 위한 기준을 최소 1개 이상 입력해 주세요!",
        
        chatAiIntro: "반갑습니다. 선택의 본질을 파악하기 위해 딱 3가지 질문을 드릴게요. 첫 번째 질문입니다: ",
        chatAiComplete: "대화 분석이 완료되었습니다! 가중치가 조절되어 보다 개인 맞춤형 의사결정 모델이 튜닝되었습니다. [결과 도출하기]를 눌러 결과를 확인하세요.",
        
        // Simulated output components
        verdictPrefix: "의사결정 매트릭스 분석 결과, \"{winner}\" 대안이 가중 평균 점수 1위를 달성하며 가장 논리적인 합의점에 도달했습니다. ",
        verdictTopCriterion: "특히 질문자님이 가장 무겁게 세팅한 주요 핵심 가치인 [{name}] 영역에서 좋은 가성비를 제공하거나 심리적 만족을 주기 때문에 우위를 점할 수 있었습니다. ",
        verdictRunnerUp: "차선책으로 떠오른 [{name}]은(는) 매력적이나 종합적인 가중치 밸런스 면에서 아쉬운 지점이 있었습니다.",
        
        biasStatusQuoName: "현상 유지 편향 (Status Quo Bias)",
        biasStatusQuoDesc: "결정에 어려움을 느낄 때 아무것도 선택하지 않거나 익숙한 기존 상태를 유지하고 싶어 하는 심리 현상입니다. 이 경우 합리적 점수 지표를 이성적으로 직시해야 합니다.",
        biasSunkCostName: "매몰 비용 편향 (Sunk Cost Fallacy)",
        biasSunkCostDesc: "이미 들어간 비용(시간, 노력, 돈)에 대한 아까움 때문에 손실이 발생하는 줄 알면서도 비효율적인 선택지를 버리지 못하고 있는 것은 아닌지 최종 점검이 필요합니다.",
        biasChoiceParadoxName: "선택의 역설 (Paradox of Choice)",
        biasChoiceParadoxDesc: "선택 대안이 너무 많아 결정 자체를 미루고 감정적 스트레스를 받고 있을 수 있습니다. 가중 평균 최하위 대안들을 미련 없이 지우는 것부터 시작하세요.",
        
        actionItem1: "가장 가중치가 큰 [{name}] 조건에 최적화된 리서치 24시간 동안 추가 수행하기",
        actionItem2: "결정된 대안 [{name}]을 선택했을 때 포기하게 되는 기회비용 최종 수용하기",
        actionItem3: "주변 동료 혹은 조력자에게 이 분석 결과를 공유하며 타당성 검증받기",
        
        // New Premium Additions
        contextLabel: "고민의 상세 맥락 & 상황 설명 (선택사항)",
        contextPlaceholder: "예: 연봉이 15% 많지만 왕복 3시간 통근인 스타트업으로 이직할지, 가깝고 편하지만 연봉이 정체된 대기업에 남을지 고민입니다. 내년에 결혼이 계획되어 있습니다.",
        btnStartManual: "직접 매트릭스 작성",
        btnStartAi: "AI 초간편 분석 시작",
        aiDraftBadge: "AI가 상황을 분석하여 옵션, 기준, 점수 초안을 작성했습니다. 원하는 대로 자유롭게 수정하세요.",
        frameworkHeader: "의사결정 프레임워크 분석",
        frameworkTitle: "분석 프레임워크",
        chatGeneratingQuestions: "AI가 고민을 심층 분석하여 내면의 핵심 가치를 파고드는 맞춤형 질문을 생성 중입니다...",
        chatGeneratingFailed: "맞춤형 질문 생성에 실패했습니다. 기본 질문으로 대체합니다.",
        btnSkipSetup: "대화 건너뛰고 바로 결과 보기",
        btnGoDashboard: "최종 분석 대시보드 보기",
        coCreationTitle: "AI 공동 창작실",
        coCreationSubtitle: "고민의 숨겨진 가치를 끌어내고 최적의 매트릭스를 함께 설계합니다. (최대 3턴)",
        matrixPreviewTitle: "매트릭스 실시간 프리뷰",
        matrixPreviewDesc: "대화가 진행되면서 실시간으로 콕핏 데이터가 업데이트됩니다.",
        previewOptions: "비교 선택지",
        previewCriteria: "평가 기준 및 가중치",
        criteriaAnalysisHeader: "평가 기준별 상세 비교 분석",
        chatDrawerTitle: "AI 1:1 심층 상담",
        chatTipPrefix: "분석 결과에 대해 궁금한 점이나 추가 문의가 있으시다면, 하단의",
        chatTipSuffix: "버튼을 통해 AI와 심층 대화를 나눠보세요!"
    },
    en: {
        badge: "Modern Decision Assistant",
        heroTitle: "Better Decisions via<br><span class=\"gradient-text\">Data & AI Analysis</span>",
        heroSubtitle: "Escape the trap of overthinking. Structure your choices, weight what matters, and let AI guide you to the optimal path.",
        dilemmaPrompt: "What decision are you facing?",
        dilemmaPlaceholder: "e.g., Where should I go on vacation? / Should I switch jobs?",
        btnStart: "Get Started",
        presetsTitle: "Popular Decision Templates",
        stepLabel1: "Enter Options",
        stepLabel2: "Set Criteria",
        stepLabel3: "Score Options",
        stepLabel4: "Tune Weights",
        stepDesc1: "Please enter at least 2 options to compare.",
        btnAddOption: "Add Option",
        stepDesc2: "Define criteria important for this decision. (e.g., Cost, Fun, Stress)",
        btnAddCriteria: "Add Criteria",
        suggestionsTitle: "Recommended Criteria (Click to add)",
        stepDesc3: "Rate how well each option fits each criterion (from 1 to 10).",
        stepDesc4: "Have a quick chat with our AI helper to weight your values and auto-tune your matrix.",
        btnPrev: "Previous",
        btnNext: "Next",
        dashboardBadge: "Final Analysis Verdict",
        matrixChartTitle: "Decision Matrix Results",
        aiTitle: "AI Choice Assistant Analysis",
        verdictHeader: "Final Recommendation",
        biasHeader: "Cognitive Bias Alert",
        actionHeader: "Immediate Action Items Post-Decision",
        btnRestart: "Start Over",
        btnExport: "Print / Export PDF",
        btnUpdateReport: "Update AI Report with changes",
        btnOpenChat: "AI 1:1 Q&A Chat",
        apiDesc: "Enter your Gemini API key to receive real-time customized AI consulting. The key is stored securely in your browser's localStorage.",
        apiKeyLabel: "Gemini API Key",
        apiHelp: "If no key is provided, our built-in decision psychology engine (Simulated) will formulate the response.",
        btnSaveApi: "Save Settings",
        
        defaultOption: "Option",
        defaultCriterion: "Criterion",
        weightLabel: "Weight",
        scoreLabel: "Score",
        winnerTitle: "Top Decision Alternative",
        aiWinnerTitle: "AI Recommended Alternative",
        scoreUnit: "pts",
        outOfTen: "pts / 10 pts",
        matrixTableHeader1: "Criteria",
        matrixTableHeader2: "Weight",
        
        alertStartDilemma: "Please enter your dilemma first!",
        alertMinOptions: "Please enter at least 2 options to compare!",
        alertMinCriteria: "Please enter at least 1 criterion for evaluation!",
        
        chatAiIntro: "Hello! I'll ask you 3 quick questions to help analyze your core priorities. First question: ",
        chatAiComplete: "Conversation analysis complete! Your matrix weights have been custom-tuned. Click [Get Results] to view the dashboard.",
        
        verdictPrefix: "Based on the decision matrix calculation, \"{winner}\" scored the highest weighted average and represents the most logical choice. ",
        verdictTopCriterion: "Notably, it excelled in [{name}], which you marked as a key priority, providing high efficiency or satisfaction. ",
        verdictRunnerUp: "The runner-up [{name}] is a strong alternative but was less balanced across your core criteria weights.",
        
        biasStatusQuoName: "Status Quo Bias",
        biasStatusQuoDesc: "The psychological preference for the current state of affairs. When overwhelmed, people default to doing nothing. Trust the objective numbers and take action.",
        biasSunkCostName: "Sunk Cost Fallacy",
        biasSunkCostDesc: "Continuing a behavior or choice because of previously invested resources (time, money, effort) even when it no longer makes sense. Check if you are holding onto options due to pride.",
        biasChoiceParadoxName: "Paradox of Choice",
        biasChoiceParadoxDesc: "Having too many choices leads to stress and decision paralysis. Eliminate the lowest-scoring options immediately to declutter your mind.",
        
        actionItem1: "Spend 24 hours researching details optimized specifically for [{name}].",
        actionItem2: "Accept and embrace the opportunity cost of choosing [{name}].",
        actionItem3: "Share this visual report with a colleague or mentor to validate your logic.",
        settingsTitle: "Settings",
        engineStatusTitle: "Active AI Engine Status",
        engineStatusServerActive: "Server API: Connected (No key needed)",
        engineStatusServerInactive: "Server API: Not Configured (Unused)",
        engineStatusLocalActive: "On-Device AI (Gemini Nano): Available",
        engineStatusLocalInactive: "On-Device AI (Gemini Nano): Not Supported",
        engineStatusUserActive: "Custom Key: Override Active",
        engineStatusUserInactive: "Custom Key: Not Configured",
        
        // New Premium Additions
        contextLabel: "Detailed Context & Situation (Optional)",
        contextPlaceholder: "e.g. switch to a startup with 15% pay rise but 3hr commute, vs stay at a stable but stagnant big company. Getting married next year.",
        btnStartManual: "Manual Matrix Setup",
        btnStartAi: "Start AI Smart Assessment",
        aiDraftBadge: "AI has generated a draft for options, criteria, and scores based on your context. Feel free to adjust them.",
        frameworkHeader: "Strategic Framework Analysis",
        frameworkTitle: "Analysis Framework",
        chatGeneratingQuestions: "AI is analyzing your matrix to generate tailored psychological questions...",
        chatGeneratingFailed: "Failed to generate tailored questions. Using general questions instead.",
        btnSkipSetup: "Skip Chat & View Results",
        btnGoDashboard: "Go to Analysis Dashboard",
        coCreationTitle: "AI Co-Creative Lab",
        coCreationSubtitle: "Uncover hidden values and co-create your optimal decision matrix. (Max 3 turns)",
        matrixPreviewTitle: "Live Matrix Preview",
        matrixPreviewDesc: "Matrix data updates dynamically as the conversation progresses.",
        previewOptions: "Options",
        previewCriteria: "Criteria & Weights",
        criteriaAnalysisHeader: "Detailed Criteria Comparison",
        chatDrawerTitle: "AI 1:1 Consultation",
        chatTipPrefix: "If you have any questions or need further analysis, click the",
        chatTipSuffix: "button below to start a deep conversation with our AI!"
    }
};

// Preset Templates
const PRESETS = {
    ko: {
        career: {
            dilemma: '나에게 가장 알맞은 커리어 선택은?',
            options: ['현 직장 잔류하기', '조건 좋은 곳으로 이직하기', '부트캠프 거쳐 직무 전환하기'],
            criteria: [
                { name: '연봉/보상', weight: 4 },
                { name: '커리어 성장성', weight: 5 },
                { name: '워라밸(WLB)', weight: 3 },
                { name: '직무 흥미도', weight: 4 }
            ]
        },
        purchase: {
            dilemma: '고가의 전자기기 무엇을 살까?',
            options: ['모델 A (기본형)', '모델 B (고급형/오버스펙)'],
            criteria: [
                { name: '가성비/가격', weight: 5 },
                { name: '성능/스펙', weight: 4 },
                { name: '디자인/감성', weight: 3 },
                { name: '휴대성/크기', weight: 3 }
            ]
        },
        lifestyle: {
            dilemma: '다음 이사 갈 보금자리는?',
            options: ['학군 좋고 비싼 아파트', '출퇴근 편리한 역세권 오피스텔', '가성비 좋은 빌라'],
            criteria: [
                { name: '주거 비용(월세/이자)', weight: 5 },
                { name: '직주근접(통근 시간)', weight: 4 },
                { name: '주변 편의시설', weight: 3 },
                { name: '치안/거주 안정성', weight: 4 }
            ]
        }
    },
    en: {
        career: {
            dilemma: 'What is the best career choice for me?',
            options: ['Stay at current job', 'Switch to a better offer', 'Join bootcamp for transition'],
            criteria: [
                { name: 'Salary & Compensation', weight: 4 },
                { name: 'Career Growth', weight: 5 },
                { name: 'Work-Life Balance', weight: 3 },
                { name: 'Job Interest', weight: 4 }
            ]
        },
        purchase: {
            dilemma: 'Which electronic device should I buy?',
            options: ['Model A (Base Model)', 'Model B (High-end Spec)'],
            criteria: [
                { name: 'Value / Price', weight: 5 },
                { name: 'Performance / Spec', weight: 4 },
                { name: 'Design / Aesthetics', weight: 3 },
                { name: 'Portability / Size', weight: 3 }
            ]
        },
        lifestyle: {
            dilemma: 'Where should I move to next?',
            options: ['Apartment in premium school district', 'Studio near office', 'Budget villa'],
            criteria: [
                { name: 'Housing Cost (Rent/Interest)', weight: 5 },
                { name: 'Commute Time', weight: 4 },
                { name: 'Amenities / Convenience', weight: 3 },
                { name: 'Safety / Stability', weight: 4 }
            ]
        }
    }
};

// Suggestion criteria tags pool
const SUGGESTED_CRITERIA = {
    ko: ['비용/예산', '시간/노력', '성장/미래', '행복/만족도', '안정성/리스크', '재미/즐거움', '주변 시선', '건강/체력'],
    en: ['Cost/Budget', 'Time/Effort', 'Growth/Future', 'Happiness/Satisfaction', 'Stability/Risk', 'Fun/Enjoyment', 'Others\' Opinions', 'Health/Energy']
};

// Tuning questions for Step 4
const TUNING_QUESTIONS = {
    ko: [
        {
            id: 'budget',
            text: '이번 결정에서 "비용(예산)"이나 "금전적 절약"이 최우선 고려 대상인가요?',
            options: [
                { text: '네, 비용 절약이 제일 중요합니다.', value: 'high' },
                { text: '어느 정도는 고려하지만 절대적이진 않습니다.', value: 'medium' },
                { text: '돈보다는 다른 가치(행복, 시간)가 훨씬 중요합니다.', value: 'low' }
            ]
        },
        {
            id: 'longevity',
            text: '이 결정으로 인한 영향은 얼마나 장기적으로 지속되나요?',
            options: [
                { text: '3년 이상 지속될 중요한 결정입니다.', value: 'long' },
                { text: '1년 내외의 단기~중기적 결정입니다.', value: 'medium' },
                { text: '당장 이번 주나 이번 달에 끝나는 단기적인 결정입니다.', value: 'short' }
            ]
        },
        {
            id: 'stress',
            text: '이 결정을 내리거나 진행하는 과정에서 감정적 소모(스트레스)가 클 것 같나요?',
            options: [
                { text: '스트레스를 최소화하는 안정성이 가장 중요합니다.', value: 'stable' },
                { text: '도전적이고 재미있는 일이라면 약간의 스트레스는 괜찮습니다.', value: 'challenge' }
            ]
        }
    ],
    en: [
        {
            id: 'budget',
            text: 'Is "Cost (Budget)" or "Financial Saving" the top priority in this decision?',
            options: [
                { text: 'Yes, saving money is the absolute key.', value: 'high' },
                { text: 'It matters somewhat, but it is not absolute.', value: 'medium' },
                { text: 'Other values (happiness, time) matter much more than money.', value: 'low' }
            ]
        },
        {
            id: 'longevity',
            text: 'How long will the impact of this decision last?',
            options: [
                { text: 'It is a major decision lasting 3+ years.', value: 'long' },
                { text: 'Medium term, around 1 year.', value: 'medium' },
                { text: 'Short term, wrapping up within weeks or months.', value: 'short' }
            ]
        },
        {
            id: 'stress',
            text: 'Do you expect high emotional stress/energy drain from this decision?',
            options: [
                { text: 'Minimizing stress and maintaining stability is key.', value: 'stable' },
                { text: 'I don\'t mind stress if it is challenging and fun.', value: 'challenge' }
            ]
        }
    ]
};

// Document Elements Map (Upgraded)
const el = {
    viewLanding: document.getElementById('view-landing'),
    viewWizard: document.getElementById('view-wizard'),
    viewDashboard: document.getElementById('view-dashboard'),
    viewAiChatSetup: document.getElementById('view-ai-chat-setup'),
    
    inputDilemma: document.getElementById('input-dilemma'),
    inputContext: document.getElementById('input-context'),
    btnStartManual: document.getElementById('btn-start-manual'),
    btnStartAi: document.getElementById('btn-start-ai'),
    
    wizardDilemmaTitle: document.getElementById('wizard-dilemma-title'),
    wizardAiBadge: document.getElementById('wizard-ai-badge'),
    optionsList: document.getElementById('options-list'),
    btnAddOption: document.getElementById('btn-add-option'),
    
    criteriaList: document.getElementById('criteria-list'),
    btnAddCriteria: document.getElementById('btn-add-criteria'),
    suggestionsTags: document.getElementById('suggestions-tags'),
    
    scoringMatrixContainer: document.getElementById('scoring-matrix-container'),
    
    chatMessages: document.getElementById('chat-messages'),
    chatLoading: document.getElementById('chat-loading'),
    chatInputArea: document.getElementById('chat-input-area'),
    chatTextInput: document.getElementById('chat-text-input'),
    btnSendChat: document.getElementById('btn-send-chat'),
    
    aiSetupChatMessages: document.getElementById('ai-setup-chat-messages'),
    aiSetupChatLoading: document.getElementById('ai-setup-chat-loading'),
    aiSetupChatText: document.getElementById('ai-setup-chat-text'),
    btnSendSetupChat: document.getElementById('btn-send-setup-chat'),
    btnSkipSetup: document.getElementById('btn-skip-setup'),
    btnGoDashboard: document.getElementById('btn-go-dashboard'),
    setupQuickReplies: document.getElementById('setup-quick-replies'),
    previewOptionsList: document.getElementById('preview-options-list'),
    previewCriteriaList: document.getElementById('preview-criteria-list'),
    
    btnPrev: document.getElementById('btn-prev'),
    btnNext: document.getElementById('btn-next'),
    
    dashboardDilemmaTitle: document.getElementById('dashboard-dilemma-title'),
    resultsChartContainer: document.getElementById('results-chart-container'),
    matrixTable: document.getElementById('matrix-table'),
    btnUpdateReport: document.getElementById('btn-update-report'),
    btnOpenChat: document.getElementById('btn-open-chat'),
    btnCloseChat: document.getElementById('btn-close-chat'),
    chatDrawer: document.getElementById('chat-drawer'),
    winnerBox: document.getElementById('winner-box'),
    verdictSummary: document.getElementById('verdict-summary'),
    criteriaAnalysisSection: document.getElementById('criteria-analysis-section'),
    criteriaAnalysisList: document.getElementById('criteria-analysis-list'),
    frameworkName: document.getElementById('framework-name'),
    frameworkAnalysis: document.getElementById('framework-analysis'),
    biasAlert: document.getElementById('bias-alert'),
    actionList: document.getElementById('action-list'),
    verdictApiStatus: document.getElementById('verdict-api-status'),
    
    btnRestart: document.getElementById('btn-restart'),
    btnExport: document.getElementById('btn-export'),
    presetsContainer: document.getElementById('presets-container')
};

// Initialize Application
window.addEventListener('DOMContentLoaded', async () => {
    setupEventListeners();
    setLanguage(STATE.lang); // Triggers initial render
    await checkAiCapabilities();
});

// Setup Event Listeners
function setupEventListeners() {
    // Language Switcher Events
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            setLanguage(e.target.dataset.lang);
        });
    });

    // Landing: Start custom dilemma (Manual)
    el.btnStartManual.addEventListener('click', () => {
        const text = el.inputDilemma.value.trim();
        if (!text) {
            alert(t('alertStartDilemma'));
            return;
        }
        STATE.isAiDraft = false;
        el.wizardAiBadge.classList.add('hidden');
        startWizard(text);
    });

    // Landing: Start custom dilemma (AI Auto-Populate & Instant Diagnosis)
    el.btnStartAi.addEventListener('click', () => {
        const text = el.inputDilemma.value.trim();
        const contextText = el.inputContext.value.trim();
        if (!text) {
            alert(t('alertStartDilemma'));
            return;
        }

        STATE.dilemma = text;
        STATE.context = contextText;
        startSetupChat();
    });

    // Co-creation Chat Room Events
    el.btnSendSetupChat.addEventListener('click', () => {
        const txt = el.aiSetupChatText.value.trim();
        if (txt) sendSetupChatMessage(txt);
    });

    el.aiSetupChatText.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const txt = el.aiSetupChatText.value.trim();
            if (txt) sendSetupChatMessage(txt);
        }
    });

    el.btnSkipSetup.addEventListener('click', async () => {
        el.btnSkipSetup.disabled = true;
        el.btnSkipSetup.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Finalizing...`;
        try {
            await finalizeSetupChat(true);
        } catch (e) {
            console.error('Failed to skip setup:', e);
            startWizard(STATE.dilemma, false);
        } finally {
            el.btnSkipSetup.disabled = false;
            el.btnSkipSetup.innerHTML = `<i class="fa-solid fa-forward"></i> <span data-i18n="btnSkipSetup">대화 건너뛰고 바로 결과 보기</span>`;
        }
    });

    el.btnGoDashboard.addEventListener('click', () => {
        showFinalDashboard();
    });

    // Wizard Option Management
    el.btnAddOption.addEventListener('click', () => {
        STATE.options.push('');
        renderOptionsInputs();
    });

    // Wizard Criteria Management
    el.btnAddCriteria.addEventListener('click', () => {
        STATE.criteria.push({ name: '', weight: 3 });
        renderCriteriaInputs();
    });

    // Navigation Controls
    el.btnNext.addEventListener('click', handleNextStep);
    el.btnPrev.addEventListener('click', handlePrevStep);

    // Dashboard actions
    el.btnRestart.addEventListener('click', restartApp);
    el.btnExport.addEventListener('click', () => window.print());

    // Dashboard: Regenerate AI report with modified values
    el.btnUpdateReport.addEventListener('click', async () => {
        el.btnUpdateReport.classList.remove('pulse-highlight');
        // Show loading state
        const originalHtml = el.btnUpdateReport.innerHTML;
        el.btnUpdateReport.disabled = true;
        el.btnUpdateReport.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Updating...`;

        try {
            // Re-calculate scores
            const finalScores = {};
            let totalWeight = 0;
            STATE.criteria.forEach(c => { totalWeight += c.weight; });
            STATE.options.forEach(opt => {
                let weightedSum = 0;
                STATE.criteria.forEach(c => {
                    const score = STATE.scores[c.name][opt] || 5;
                    weightedSum += score * c.weight;
                });
                finalScores[opt] = totalWeight > 0 ? (weightedSum / totalWeight).toFixed(2) : 0;
            });

            let winner = '';
            let highestScore = -1;
            STATE.options.forEach(opt => {
                const s = parseFloat(finalScores[opt]);
                if (s > highestScore) {
                    highestScore = s;
                    winner = opt;
                }
            });

            // Call API analyze
            if (STATE.geminiApiKey) {
                await fetchGeminiVerdict(finalScores, winner);
            } else if (STATE.serverKeyAvailable) {
                await fetchServerVerdict(finalScores, winner);
            } else if (STATE.localAiAvailable) {
                await fetchLocalAiVerdict(finalScores, winner);
            } else {
                generateSimulatedVerdict(finalScores, winner);
            }
        } catch (e) {
            console.error('Failed to update report:', e);
        } finally {
            el.btnUpdateReport.disabled = false;
            el.btnUpdateReport.innerHTML = originalHtml;
        }
    });

    // Dashboard: Toggle AI Chat Drawer
    el.btnOpenChat.addEventListener('click', () => {
        openContinuousChat();
    });

    el.btnCloseChat.addEventListener('click', () => {
        el.chatDrawer.classList.remove('active');
    });

    // Continuous Chat Open-ended controls
    el.btnSendChat.addEventListener('click', sendContinuousChatMessage);
    el.chatTextInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            sendContinuousChatMessage();
        }
    });
}

// Translations Helper Function
function t(key) {
    return TRANSLATIONS[STATE.lang][key] || key;
}

// Update Language State and UI Static text
function setLanguage(lang) {
    STATE.lang = lang;
    localStorage.setItem('choiceflow_lang', lang);

    // Update active class on header buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    // Translate DOM elements with data-i18n
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.dataset.i18n;
        const text = t(key);
        if (text) {
            if (text.includes('<br>') || text.includes('\n')) {
                element.innerHTML = text.replace(/\n/g, '<br>');
            } else {
                element.textContent = text;
            }
        }
    });

    // Translate Placeholders with data-i18n-placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.dataset.i18nPlaceholder;
        const text = t(key);
        if (text) {
            element.placeholder = text;
        }
    });

    // Render preset cards in selected language
    renderPresets();

    // Render suggestion criteria tags
    renderSuggestedCriteria();

    // If currently inside the wizard, refresh current step elements
    if (el.viewWizard.classList.contains('active')) {
        el.wizardDilemmaTitle.textContent = `Q. ${STATE.dilemma}`;
        renderStep();
    }
    updateEngineStatusUI();
}

// Render landing page presets
function renderPresets() {
    el.presetsContainer.innerHTML = '';
    const currentPresets = PRESETS[STATE.lang];
    
    const icons = {
        career: 'fa-briefcase',
        purchase: 'fa-cart-shopping',
        lifestyle: 'fa-house-chimney'
    };

    const descriptions = {
        career: STATE.lang === 'ko' ? '이직 vs 잔류, 부트캠프 신청 여부 등' : 'Stay vs Switch, Bootcamps, etc.',
        purchase: STATE.lang === 'ko' ? '맥북 에어 vs 맥북 프로, 테슬라 vs 아이오닉' : 'Air vs Pro, Tesla vs Ioniq, etc.',
        lifestyle: STATE.lang === 'ko' ? '이사 갈 지역 선택, 전세 vs 월세' : 'Where to live, Buy vs Rent, etc.'
    };

    const titles = {
        career: STATE.lang === 'ko' ? '커리어 결정' : 'Career Choice',
        purchase: STATE.lang === 'ko' ? '고가 장비 구매' : 'Buying Gear',
        lifestyle: STATE.lang === 'ko' ? '라이프스타일' : 'Lifestyle Setup'
    };

    Object.keys(currentPresets).forEach(key => {
        const p = currentPresets[key];
        const card = document.createElement('div');
        card.className = 'preset-card';
        card.dataset.preset = key;
        card.innerHTML = `
            <i class="fa-solid ${icons[key]} preset-icon"></i>
            <h4>${titles[key]}</h4>
            <p>${descriptions[key]}</p>
        `;

        card.addEventListener('click', () => {
            STATE.dilemma = p.dilemma;
            STATE.options = [...p.options];
            STATE.criteria = p.criteria.map(c => ({...c}));
            startWizard(p.dilemma, true);
        });

        el.presetsContainer.appendChild(card);
    });
}

// Router Logic: Switch Views
function switchView(viewName) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    
    if (viewName === 'landing') {
        el.viewLanding.classList.add('active');
    } else if (viewName === 'wizard') {
        el.viewWizard.classList.add('active');
    } else if (viewName === 'dashboard') {
        el.viewDashboard.classList.add('active');
    } else if (viewName === 'ai-chat-setup') {
        el.viewAiChatSetup.classList.add('active');
    }
}

// Start decision matrix wizard
function startWizard(title, isPreset = false) {
    STATE.dilemma = title;
    STATE.currentStep = 1;
    el.wizardDilemmaTitle.textContent = `Q. ${title}`;
    
    if (!isPreset) {
        // Reset defaults for clean custom session in correct language
        if (STATE.lang === 'ko') {
            STATE.options = ['선택지 A', '선택지 B'];
            STATE.criteria = [
                { name: '비용', weight: 3 },
                { name: '행복/만족도', weight: 4 },
                { name: '난이도/노력', weight: 2 }
            ];
        } else {
            STATE.options = ['Option A', 'Option B'];
            STATE.criteria = [
                { name: 'Cost', weight: 3 },
                { name: 'Happiness', weight: 4 },
                { name: 'Effort/Difficulty', weight: 2 }
            ];
        }
    }
    
    renderStep();
    switchView('wizard');
}

// Render the active step UI
function renderStep() {
    // Update progress tracker visually
    document.querySelectorAll('.step-indicator').forEach(indicator => {
        const stepNum = parseInt(indicator.dataset.step);
        indicator.classList.remove('active', 'completed');
        if (stepNum < STATE.currentStep) {
            indicator.classList.add('completed');
        } else if (stepNum === STATE.currentStep) {
            indicator.classList.add('active');
        }
    });

    const progressFillPercent = ((STATE.currentStep - 1) / 3) * 100;
    document.querySelector('.progress-fill').style.width = `${progressFillPercent}%`;

    // Toggle step content container views
    document.querySelectorAll('.step-content').forEach(content => {
        content.classList.remove('active');
        if (parseInt(content.dataset.step) === STATE.currentStep) {
            content.classList.add('active');
        }
    });

    // Toggle Navigation Buttons state
    if (STATE.currentStep === 1) {
        el.btnPrev.classList.add('hidden');
    } else {
        el.btnPrev.classList.remove('hidden');
    }

    if (STATE.currentStep === 4) {
        el.btnNext.innerHTML = `${t('btnNext')} <i class="fa-solid fa-wand-magic-sparkles"></i>`;
    } else {
        el.btnNext.innerHTML = `${t('btnNext')} <i class="fa-solid fa-arrow-right"></i>`;
    }

    // Step-specific renders
    if (STATE.currentStep === 1) {
        renderOptionsInputs();
    } else if (STATE.currentStep === 2) {
        renderCriteriaInputs();
    } else if (STATE.currentStep === 3) {
        renderScoringSliders();
    } else if (STATE.currentStep === 4) {
        startTuningChat();
    }
}

// Wizard - Step 1: Render Options Input fields
function renderOptionsInputs() {
    el.optionsList.innerHTML = '';
    STATE.options.forEach((val, idx) => {
        const div = document.createElement('div');
        div.className = 'dynamic-item';
        div.innerHTML = `
            <input type="text" placeholder="${t('defaultOption')} ${idx + 1}" value="${val}">
            <button class="remove-btn icon-btn-sm" ${STATE.options.length <= 2 ? 'disabled style="opacity: 0.3; cursor: default;"' : ''}>
                <i class="fa-solid fa-trash-can"></i>
            </button>
        `;

        const input = div.querySelector('input');
        input.addEventListener('input', (e) => {
            STATE.options[idx] = e.target.value;
        });

        const rBtn = div.querySelector('.remove-btn');
        rBtn.addEventListener('click', () => {
            if (STATE.options.length > 2) {
                STATE.options.splice(idx, 1);
                renderOptionsInputs();
            }
        });

        el.optionsList.appendChild(div);
    });
}

// Wizard - Step 2: Render Criteria Input fields
function renderCriteriaInputs() {
    el.criteriaList.innerHTML = '';
    STATE.criteria.forEach((crit, idx) => {
        const div = document.createElement('div');
        div.className = 'dynamic-item';
        div.innerHTML = `
            <input type="text" placeholder="${t('defaultCriterion')} ${idx + 1}" value="${crit.name}">
            <button class="remove-btn icon-btn-sm" ${STATE.criteria.length <= 1 ? 'disabled style="opacity: 0.3; cursor: default;"' : ''}>
                <i class="fa-solid fa-trash-can"></i>
            </button>
        `;

        const input = div.querySelector('input');
        input.addEventListener('input', (e) => {
            STATE.criteria[idx].name = e.target.value;
        });

        const rBtn = div.querySelector('.remove-btn');
        rBtn.addEventListener('click', () => {
            if (STATE.criteria.length > 1) {
                STATE.criteria.splice(idx, 1);
                renderCriteriaInputs();
            }
        });

        el.criteriaList.appendChild(div);
    });
}

// Wizard - Step 2 Helper: Suggested tags container
function renderSuggestedCriteria() {
    el.suggestionsTags.innerHTML = '';
    SUGGESTED_CRITERIA[STATE.lang].forEach(name => {
        const span = document.createElement('span');
        span.className = 'suggestion-tag';
        span.textContent = name;
        span.addEventListener('click', () => {
            // Check if criteria exists already
            if (!STATE.criteria.some(c => c.name === name)) {
                // If the last criteria input is empty, overwrite it. Otherwise, add.
                if (STATE.criteria.length > 0 && STATE.criteria[STATE.criteria.length - 1].name === '') {
                    STATE.criteria[STATE.criteria.length - 1].name = name;
                } else {
                    STATE.criteria.push({ name, weight: 3 });
                }
                renderCriteriaInputs();
            }
        });
        el.suggestionsTags.appendChild(span);
    });
}

// Wizard - Step 3: Render scoring sliders matrix
function renderScoringSliders() {
    el.scoringMatrixContainer.innerHTML = '';
    
    // Initialize empty scores state if not set
    STATE.criteria.forEach(c => {
        if (!STATE.scores[c.name]) {
            STATE.scores[c.name] = {};
        }
        STATE.options.forEach(opt => {
            if (STATE.scores[c.name][opt] === undefined) {
                STATE.scores[c.name][opt] = 5; // Default score: 5
            }
        });
    });

    STATE.criteria.forEach(crit => {
        const card = document.createElement('div');
        card.className = 'matrix-criterion-card';
        card.innerHTML = `
            <div class="matrix-criterion-title">
                <span><i class="fa-solid fa-angle-right text-primary"></i> ${crit.name}</span>
                <span class="matrix-criterion-weight">${t('weightLabel')}: ${crit.weight}</span>
            </div>
            <div class="sliders-list"></div>
        `;

        const slidersList = card.querySelector('.sliders-list');
        
        STATE.options.forEach(opt => {
            const currentScore = STATE.scores[crit.name][opt] || 5;
            const row = document.createElement('div');
            row.className = 'slider-row';
            row.innerHTML = `
                <div class="slider-label">
                    <span>${opt}</span>
                </div>
                <div class="slider-container">
                    <input type="range" min="1" max="10" value="${currentScore}">
                    <span class="slider-val">${currentScore}${t('scoreUnit')}</span>
                </div>
            `;

            const input = row.querySelector('input');
            const valSpan = row.querySelector('.slider-val');
            
            input.addEventListener('input', (e) => {
                const val = parseInt(e.target.value);
                valSpan.textContent = `${val}${t('scoreUnit')}`;
                STATE.scores[crit.name][opt] = val;
            });

            slidersList.appendChild(row);
        });

        el.scoringMatrixContainer.appendChild(card);
    });
}

// Wizard - Step 4: Conversational Chat Logic
let currentChatIdx = 0;

// Markdown formatter for elegant chat replies
function formatMarkdown(text) {
    if (!text) return '';
    let escaped = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    
    escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    escaped = escaped.replace(/^\s*[-*]\s+(.*)$/gm, '<li>$1</li>');
    escaped = escaped.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
    escaped = escaped.replace(/^### (.*)$/gm, '<h3>$1</h3>');
    escaped = escaped.replace(/^## (.*)$/gm, '<h2>$1</h2>');
    escaped = escaped.replace(/^# (.*)$/gm, '<h1>$1</h1>');
    escaped = escaped.replace(/\n/g, '<br>');
    return escaped;
}

// ----------------------------------------------------
// 1단계: AI 공동 창작실 (Co-creation Dialogue)
// ----------------------------------------------------
let setupChatHistory = [];

async function startSetupChat() {
    switchView('ai-chat-setup');
    el.aiSetupChatMessages.innerHTML = '';
    el.setupQuickReplies.innerHTML = '';
    el.aiSetupChatText.value = '';
    el.btnGoDashboard.classList.add('hidden');
    el.btnSkipSetup.classList.remove('hidden');
    setupChatHistory = [];
    
    // Reset Matrix State for Preview
    STATE.options = [];
    STATE.criteria = [];
    STATE.scores = {};
    renderSetupPreview();
    
    addSetupChatBubble('ai', STATE.lang === 'ko' 
        ? `안녕하세요! 입력하신 고민 **'${STATE.dilemma}'**에 대해 맞춤형 의사결정 매트릭스를 설계 중입니다. 잠시만 기다려 주세요...`
        : `Hello! I'm preparing a customized decision matrix for your dilemma: **'${STATE.dilemma}'**. Just a moment...`);
        
    await sendSetupChatMessage("");
}

function addSetupChatBubble(sender, text) {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${sender}`;
    bubble.innerHTML = formatMarkdown(text);
    el.aiSetupChatMessages.appendChild(bubble);
    el.aiSetupChatMessages.scrollTop = el.aiSetupChatMessages.scrollHeight;
}

async function sendSetupChatMessage(userText) {
    if (userText) {
        addSetupChatBubble('user', userText);
        setupChatHistory.push({ role: 'user', content: userText });
    }

    el.aiSetupChatText.value = '';
    el.setupQuickReplies.innerHTML = '';
    el.aiSetupChatLoading.classList.remove('hidden');

    try {
        let data;
        if (STATE.geminiApiKey) {
            data = await fetchGeminiSetupChat(false);
        } else {
            const response = await fetch('/api/chat-consult', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dilemma: STATE.dilemma,
                    context: STATE.context,
                    chatHistory: setupChatHistory,
                    forceFinish: false,
                    language: STATE.lang
                })
            });

            if (!response.ok) throw new Error('Co-creation chat request failed');
            data = await response.json();
        }

        el.aiSetupChatLoading.classList.add('hidden');
        
        // Add AI response
        addSetupChatBubble('ai', data.reply);
        setupChatHistory.push({ role: 'assistant', content: data.reply });

        // Update Matrix State and Preview
        if (data.currentMatrix) {
            STATE.options = data.currentMatrix.options || [];
            STATE.criteria = data.currentMatrix.criteria || [];
            STATE.scores = data.currentMatrix.scores || {};
            renderSetupPreview();
        }

        // Check if finished
        if (data.isFinished) {
            STATE.finalReport = data.finalReport;
            el.btnSkipSetup.classList.add('hidden');
            el.btnGoDashboard.classList.remove('hidden');
        } else {
            // Render quick replies
            if (data.suggestedOptions && data.suggestedOptions.length > 0) {
                data.suggestedOptions.forEach(opt => {
                    const btn = document.createElement('button');
                    btn.className = 'chat-option-btn';
                    btn.textContent = opt;
                    btn.addEventListener('click', () => sendSetupChatMessage(opt));
                    el.setupQuickReplies.appendChild(btn);
                });
            }
        }

    } catch (err) {
        console.error('Co-creation chat error:', err);
        el.aiSetupChatLoading.classList.add('hidden');
        addSetupChatBubble('ai', STATE.lang === 'ko'
            ? '죄송합니다. AI와의 공동 창작 대화 도중 오류가 발생했습니다. 아래 버튼을 눌러 바로 결과 보기로 건너뛸 수 있습니다.'
            : 'Sorry, an error occurred during the co-creation dialogue. You can click skip to view the results immediately.');
    }
}

async function finalizeSetupChat(forceFinish) {
    el.aiSetupChatLoading.classList.remove('hidden');
    
    try {
        let data;
        if (STATE.geminiApiKey) {
            data = await fetchGeminiSetupChat(forceFinish);
        } else {
            const response = await fetch('/api/chat-consult', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dilemma: STATE.dilemma,
                    context: STATE.context,
                    chatHistory: setupChatHistory,
                    forceFinish: forceFinish,
                    language: STATE.lang
                })
            });
            
            if (!response.ok) throw new Error('Failed to finalize co-creation chat');
            data = await response.json();
        }
        
        // Save to state
        STATE.options = data.currentMatrix.options;
        STATE.criteria = data.currentMatrix.criteria;
        STATE.scores = data.currentMatrix.scores;
        STATE.finalReport = data.finalReport;
        STATE.isAiDraft = true;
        
        // Switch to dashboard and render
        showFinalDashboard();

    } catch (err) {
        console.error('Failed to finalize setup chat:', err);
        throw err;
    } finally {
        el.aiSetupChatLoading.classList.add('hidden');
    }
}

function renderSetupPreview() {
    el.previewOptionsList.innerHTML = '';
    if (STATE.options && STATE.options.length > 0) {
        STATE.options.forEach(opt => {
            const li = document.createElement('li');
            li.innerHTML = `<i class="fa-solid fa-square-check text-primary"></i> <span>${opt}</span>`;
            el.previewOptionsList.appendChild(li);
        });
    } else {
        el.previewOptionsList.innerHTML = `<li style="color: var(--text-secondary); opacity: 0.6;">대화가 진행되면 옵션이 여기에 나타납니다.</li>`;
    }

    el.previewCriteriaList.innerHTML = '';
    if (STATE.criteria && STATE.criteria.length > 0) {
        STATE.criteria.forEach(crit => {
            const row = document.createElement('div');
            row.className = 'preview-crit-row';
            const weightVal = crit.weight || 3;
            const percentage = (weightVal / 5) * 100;
            
            row.innerHTML = `
                <div class="preview-crit-header">
                    <span style="font-weight: 500;">${crit.name}</span>
                    <span style="color: var(--primary); font-weight: 600;">W${weightVal}</span>
                </div>
                <div class="preview-crit-bar-track">
                    <div class="preview-crit-bar-fill" style="width: ${percentage}%"></div>
                </div>
            `;
            el.previewCriteriaList.appendChild(row);
        });
    } else {
        el.previewCriteriaList.innerHTML = `<div style="color: var(--text-secondary); opacity: 0.6; font-size: 0.88rem;">대화가 진행되면 평가 기준이 여기에 나타납니다.</div>`;
    }
}

function showFinalDashboard() {
    el.dashboardDilemmaTitle.textContent = `"${STATE.dilemma}"`;
    
    // Calculate Scores locally to draw charts
    const finalScores = {};
    let totalWeight = 0;
    STATE.criteria.forEach(c => { totalWeight += c.weight; });
    STATE.options.forEach(opt => {
        let weightedSum = 0;
        STATE.criteria.forEach(c => {
            const score = STATE.scores[c.name] && STATE.scores[c.name][opt] !== undefined ? STATE.scores[c.name][opt] : 5;
            weightedSum += score * c.weight;
        });
        finalScores[opt] = totalWeight > 0 ? (weightedSum / totalWeight).toFixed(2) : 0;
    });

    let winner = '';
    let highestScore = -1;
    STATE.options.forEach(opt => {
        const s = parseFloat(finalScores[opt]);
        if (s > highestScore) {
            highestScore = s;
            winner = opt;
        }
    });

    // Render Table and Chart on Dashboard
    renderChart(finalScores, winner);
    renderTable();

    // Populate AI report text from finalReport
    const report = STATE.finalReport || {};
    
    // Winner Box
    const isAi = STATE.geminiApiKey || STATE.serverKeyAvailable || STATE.localAiAvailable;
    const titleKey = isAi ? 'aiWinnerTitle' : 'winnerTitle';
    const iconClass = isAi ? 'fa-solid fa-robot' : 'fa-solid fa-award';
    el.winnerBox.innerHTML = `
        <i class="${iconClass} winner-icon"></i>
        <div class="winner-details">
            <h5>${t(titleKey)}</h5>
            <div class="winner-name">${winner}</div>
        </div>
    `;

    el.verdictSummary.textContent = report.summary || '';
    
    // Render Detailed Criteria Analysis Section
    el.criteriaAnalysisList.innerHTML = '';
    if (report.detailedAnalysis && report.detailedAnalysis.length > 0) {
        report.detailedAnalysis.forEach(item => {
            const div = document.createElement('div');
            div.className = 'criteria-analysis-item';
            div.innerHTML = `
                <div class="criteria-analysis-title">
                    <i class="fa-solid fa-check-double"></i> <span>${item.criterion}</span>
                </div>
                <div class="criteria-analysis-text">${item.analysis}</div>
            `;
            el.criteriaAnalysisList.appendChild(div);
        });
        el.criteriaAnalysisSection.style.display = 'block';
    } else {
        el.criteriaAnalysisSection.style.display = 'none';
    }

    el.frameworkName.textContent = report.frameworkName || "Strategic Framework";
    el.frameworkAnalysis.textContent = report.frameworkAnalysis || "";
    
    if (report.biasName) {
        el.biasAlert.innerHTML = `<strong>${report.biasName}</strong>: ${report.biasDesc}`;
    } else {
        el.biasAlert.textContent = "";
    }
    
    el.actionList.innerHTML = '';
    if (report.actions && report.actions.length > 0) {
        report.actions.forEach(action => {
            const li = document.createElement('li');
            li.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>${action}</span>`;
            el.actionList.appendChild(li);
        });
    }

    el.verdictApiStatus.textContent = STATE.geminiApiKey ? 'Custom Gemini Key' : 'Llama 3.3 (Groq)';
    el.verdictApiStatus.style.backgroundColor = 'rgba(16, 185, 129, 0.2)';
    el.verdictApiStatus.style.color = '#6ee7b7';

    switchView('dashboard');
}

// ----------------------------------------------------
// 2단계: 대시보드 1:1 무제한 심층 상담 (Post-Cockpit Continuous Chat)
// ----------------------------------------------------
let continuousChatHistory = [];

function openContinuousChat() {
    el.chatDrawer.classList.add('active');
    if (el.chatMessages.children.length === 0) {
        continuousChatHistory = [];
        addContinuousChatBubble('ai', STATE.lang === 'ko'
            ? `안녕하세요! 최종 의사결정 매트릭스와 전략적 제언 보고서가 도출되었습니다. 도출된 분석 결과에 대해 궁금한 점이 있으시다면 무엇이든 물어보세요. (예: "왜 Option A가 Option B보다 비용 점수가 낮은가요?")`
            : `Hello! Your decision matrix and strategic consultation report are ready. If you have any further questions about the findings or trade-offs, feel free to ask me anything here!`);
    }
}

function addContinuousChatBubble(sender, text) {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${sender}`;
    bubble.innerHTML = formatMarkdown(text);
    el.chatMessages.appendChild(bubble);
    el.chatMessages.scrollTop = el.chatMessages.scrollHeight;
}

async function sendContinuousChatMessage() {
    const text = el.chatTextInput.value.trim();
    if (!text) return;

    el.chatTextInput.value = '';
    addContinuousChatBubble('user', text);
    continuousChatHistory.push({ role: 'user', content: text });

    el.chatLoading.classList.remove('hidden');

    try {
        let reply = "";
        if (STATE.geminiApiKey) {
            reply = await fetchGeminiContinuousChat(text);
        } else {
            const response = await fetch('/api/chat-consulting-continuous', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dilemma: STATE.dilemma,
                    matrix: {
                        options: STATE.options,
                        criteria: STATE.criteria,
                        scores: STATE.scores
                    },
                    chatHistory: continuousChatHistory.slice(0, -1),
                    message: text,
                    language: STATE.lang
                })
            });

            if (!response.ok) throw new Error('Continuous consulting request failed');
            const data = await response.json();
            reply = data.reply;
        }

        el.chatLoading.classList.add('hidden');
        addContinuousChatBubble('ai', reply);
        continuousChatHistory.push({ role: 'assistant', content: reply });

    } catch (err) {
        console.error('Continuous consulting error:', err);
        el.chatLoading.classList.add('hidden');
        addContinuousChatBubble('ai', STATE.lang === 'ko'
            ? '죄송합니다. 답변을 생성하는 도중 오류가 발생했습니다.'
            : 'Sorry, an error occurred while generating the response.');
    }
}

// Heuristics: Dynamically adjust criteria weights based on questionnaire responses
function applyHeuristicTuning() {
    STATE.criteria.forEach(crit => {
        const name = crit.name.toLowerCase();
        
        // 1. Budget Question
        if (STATE.chatAnswers.budget === 'high') {
            if (name.includes('비용') || name.includes('돈') || name.includes('가격') || name.includes('예산') || name.includes('cost') || name.includes('price') || name.includes('budget')) {
                crit.weight = Math.min(5, crit.weight + 2);
            }
        } else if (STATE.chatAnswers.budget === 'low') {
            if (name.includes('비용') || name.includes('돈') || name.includes('가격') || name.includes('예산') || name.includes('cost') || name.includes('price') || name.includes('budget')) {
                crit.weight = Math.max(1, crit.weight - 2);
            }
        }
        
        // 2. Longevity Question
        if (STATE.chatAnswers.longevity === 'long') {
            if (name.includes('성장') || name.includes('미래') || name.includes('커리어') || name.includes('지속') || name.includes('성능') || name.includes('안정') || name.includes('growth') || name.includes('future') || name.includes('career') || name.includes('stability')) {
                crit.weight = Math.min(5, crit.weight + 1);
            }
        }
        
        // 3. Stress Question
        if (STATE.chatAnswers.stress === 'stable') {
            if (name.includes('스트레스') || name.includes('안정') || name.includes('노력') || name.includes('피로') || name.includes('난이도') || name.includes('위험') || name.includes('stress') || name.includes('stability') || name.includes('effort') || name.includes('risk')) {
                crit.weight = Math.min(5, crit.weight + 2);
            }
        }
    });
}

// Handle Navigation Steps
function handleNextStep() {
    if (STATE.currentStep === 1) {
        // Validation options
        STATE.options = STATE.options.map(o => o.trim()).filter(o => o !== '');
        if (STATE.options.length < 2) {
            alert(t('alertMinOptions'));
            return;
        }
        STATE.currentStep = 2;
    } else if (STATE.currentStep === 2) {
        // Validation criteria
        STATE.criteria = STATE.criteria.filter(c => c.name.trim() !== '');
        if (STATE.criteria.length < 1) {
            alert(t('alertMinCriteria'));
            return;
        }
        STATE.currentStep = 3;
    } else if (STATE.currentStep === 3) {
        STATE.currentStep = 4;
    } else if (STATE.currentStep === 4) {
        calculateAndShowResults();
        return;
    }
    renderStep();
}

function handlePrevStep() {
    if (STATE.currentStep > 1) {
        STATE.currentStep--;
        renderStep();
    }
}

// Core Calculations & Show Results Dashboard
async function calculateAndShowResults() {
    switchView('dashboard');
    el.dashboardDilemmaTitle.textContent = `"${STATE.dilemma}"`;
    el.verdictSummary.textContent = STATE.lang === 'ko' ? '결과를 계산하는 중...' : 'Calculating results...';
    
    // 1. Calculate Scores
    const finalScores = {};
    let totalWeight = 0;
    
    STATE.criteria.forEach(c => {
        totalWeight += c.weight;
    });

    STATE.options.forEach(opt => {
        let weightedSum = 0;
        STATE.criteria.forEach(c => {
            const score = STATE.scores[c.name][opt] || 5;
            weightedSum += score * c.weight;
        });
        finalScores[opt] = totalWeight > 0 ? (weightedSum / totalWeight).toFixed(2) : 0;
    });

    // 2. Identify Winner
    let winner = '';
    let highestScore = -1;
    STATE.options.forEach(opt => {
        const s = parseFloat(finalScores[opt]);
        if (s > highestScore) {
            highestScore = s;
            winner = opt;
        }
    });

    // 3. Render Chart
    renderChart(finalScores, winner);

    // 4. Render Table breakdown
    renderTable();

    // 5. Generate AI Verdict (Real or Simulated) based on priorities
    if (STATE.geminiApiKey) {
        // Option 1: Custom User Gemini Key
        el.verdictApiStatus.textContent = 'Custom Gemini Key';
        el.verdictApiStatus.style.backgroundColor = 'rgba(245, 158, 11, 0.2)';
        el.verdictApiStatus.style.color = '#fde047';
        await fetchGeminiVerdict(finalScores, winner);
    } else if (STATE.serverKeyAvailable) {
        // Option 2: Server API Proxy with Llama 3.3 (Groq)
        el.verdictApiStatus.textContent = 'Llama 3.3 (Groq)';
        el.verdictApiStatus.style.backgroundColor = 'rgba(16, 185, 129, 0.2)';
        el.verdictApiStatus.style.color = '#6ee7b7';
        await fetchServerVerdict(finalScores, winner);
    } else if (STATE.localAiAvailable) {
        // Option 3: Local Gemini Nano in Browser
        el.verdictApiStatus.textContent = 'On-Device AI (Nano)';
        el.verdictApiStatus.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
        el.verdictApiStatus.style.color = '#93c5fd';
        await fetchLocalAiVerdict(finalScores, winner);
    } else {
        // Option 4: Local Simulation Fallback
        el.verdictApiStatus.textContent = 'Simulated Engine';
        el.verdictApiStatus.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
        el.verdictApiStatus.style.color = 'var(--text-secondary)';
        generateSimulatedVerdict(finalScores, winner);
    }
}

function renderChart(finalScores, winner) {
    el.resultsChartContainer.innerHTML = '';
    
    STATE.options.forEach(opt => {
        const score = parseFloat(finalScores[opt]);
        // Percentage mapping (score is 1-10, so multiply by 10)
        const percent = score * 10;
        
        const row = document.createElement('div');
        row.className = `chart-bar-row ${opt === winner ? 'winner' : ''}`;
        row.innerHTML = `
            <div class="chart-bar-header">
                <span>${opt} ${opt === winner ? '<i class="fa-solid fa-trophy text-warning"></i>' : ''}</span>
                <span>${score}${t('outOfTen')}</span>
            </div>
            <div class="chart-bar-track">
                <div class="chart-bar-fill" style="width: 0%"></div>
            </div>
        `;
        
        el.resultsChartContainer.appendChild(row);
        
        // Trigger width animation via paint frame
        requestAnimationFrame(() => {
            setTimeout(() => {
                row.querySelector('.chart-bar-fill').style.width = `${percent}%`;
            }, 100);
        });
    });
}

function renderTable() {
    el.matrixTable.innerHTML = '';
    
    // Table Header
    let html = `
        <thead>
            <tr>
                <th>${t('matrixTableHeader1')}</th>
                <th>${t('matrixTableHeader2')}</th>
                ${STATE.options.map(o => `<th>${o}</th>`).join('')}
            </tr>
        </thead>
        <tbody>
    `;

    // Table Rows
    STATE.criteria.forEach(crit => {
        html += `
            <tr>
                <td style="font-weight: 500; color: var(--text-primary);">${crit.name}</td>
                <td>
                    <select class="weight-select" data-criterion="${crit.name}">
                        ${[1, 2, 3, 4, 5].map(w => `<option value="${w}" ${crit.weight == w ? 'selected' : ''}>${w}</option>`).join('')}
                    </select>
                </td>
                ${STATE.options.map(opt => {
                    const scoreVal = STATE.scores[crit.name] && STATE.scores[crit.name][opt] !== undefined ? STATE.scores[crit.name][opt] : 5;
                    return `
                        <td>
                            <select class="score-select" data-criterion="${crit.name}" data-option="${opt}">
                                ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(s => `<option value="${s}" ${scoreVal == s ? 'selected' : ''}>${s}${t('scoreUnit')}</option>`).join('')}
                            </select>
                        </td>
                    `;
                }).join('')}
            </tr>
        `;
    });

    html += '</tbody>';
    el.matrixTable.innerHTML = html;

    // Bind event listeners to weight-select and score-select elements
    const weightSelects = el.matrixTable.querySelectorAll('.weight-select');
    weightSelects.forEach(select => {
        select.addEventListener('change', (e) => {
            const criterionName = e.target.getAttribute('data-criterion');
            const newWeight = parseInt(e.target.value);
            
            // Find and update the weight in STATE.criteria
            const crit = STATE.criteria.find(c => c.name === criterionName);
            if (crit) {
                crit.weight = newWeight;
            }
            
            // Trigger live recalculation
            recalculateMatrixLive();
        });
    });

    const scoreSelects = el.matrixTable.querySelectorAll('.score-select');
    scoreSelects.forEach(select => {
        select.addEventListener('change', (e) => {
            const criterionName = e.target.getAttribute('data-criterion');
            const optionName = e.target.getAttribute('data-option');
            const newScore = parseInt(e.target.value);
            
            // Update score in STATE.scores
            if (!STATE.scores[criterionName]) {
                STATE.scores[criterionName] = {};
            }
            STATE.scores[criterionName][optionName] = newScore;
            
            // Trigger live recalculation
            recalculateMatrixLive();
        });
    });
}

function recalculateMatrixLive() {
    // 1. Calculate Scores
    const finalScores = {};
    let totalWeight = 0;
    
    STATE.criteria.forEach(c => {
        totalWeight += c.weight;
    });

    STATE.options.forEach(opt => {
        let weightedSum = 0;
        STATE.criteria.forEach(c => {
            const score = STATE.scores[c.name] && STATE.scores[c.name][opt] !== undefined ? STATE.scores[c.name][opt] : 5;
            weightedSum += score * c.weight;
        });
        finalScores[opt] = totalWeight > 0 ? (weightedSum / totalWeight).toFixed(2) : 0;
    });

    // 2. Identify Winner
    let winner = '';
    let highestScore = -1;
    STATE.options.forEach(opt => {
        const s = parseFloat(finalScores[opt]);
        if (s > highestScore) {
            highestScore = s;
            winner = opt;
        }
    });

    // 3. Redraw chart
    renderChart(finalScores, winner);

    // 4. Highlight update button to remind user to update the AI report
    if (el.btnUpdateReport) {
        el.btnUpdateReport.classList.add('pulse-highlight');
    }
}

// Local simulation engine based on decision rules
function generateSimulatedVerdict(finalScores, winner) {
    // Winner Banner
    el.winnerBox.innerHTML = `
        <i class="fa-solid fa-award winner-icon"></i>
        <div class="winner-details">
            <h5>${t('winnerTitle')}</h5>
            <div class="winner-name">${winner}</div>
        </div>
    `;

    // Core analysis builder
    let text = t('verdictPrefix').replace('{winner}', winner);
    
    // Add specific details
    const topC = [...STATE.criteria].sort((a,b) => b.weight - a.weight)[0];
    if (topC) {
        text += t('verdictTopCriterion').replace('{name}', topC.name);
    }

    // Runner up details
    const runners = STATE.options.filter(o => o !== winner);
    if (runners.length > 0) {
        text += t('verdictRunnerUp').replace('{name}', runners[0]);
    }

    el.verdictSummary.textContent = text;

    // Render Detailed Criteria Analysis Section for simulated verdict
    el.criteriaAnalysisList.innerHTML = '';
    STATE.criteria.forEach(c => {
        const div = document.createElement('div');
        div.className = 'criteria-analysis-item';
        
        let comparisonText = '';
        if (STATE.lang === 'ko') {
            comparisonText = `이 기준(가중치 ${c.weight})에서 각 선택지의 점수는 다음과 같습니다: ` + 
                STATE.options.map(opt => `"${opt}"은(는) ${STATE.scores[c.name]?.[opt] || 5}점`).join(', ') + 
                `. 이에 따라 종합 점수 산정에 반영되었습니다.`;
        } else {
            comparisonText = `For this criterion (weight ${c.weight}), the scores are: ` + 
                STATE.options.map(opt => `"${opt}": ${STATE.scores[c.name]?.[opt] || 5} pts`).join(', ') + 
                `. These values are incorporated into the overall weighted analysis.`;
        }

        div.innerHTML = `
            <div class="criteria-analysis-title">
                <i class="fa-solid fa-check-double"></i> <span>${c.name}</span>
            </div>
            <div class="criteria-analysis-text">${comparisonText}</div>
        `;
        el.criteriaAnalysisList.appendChild(div);
    });
    el.criteriaAnalysisSection.style.display = 'block';

    // Render simulated framework
    el.frameworkName.textContent = t('frameworkTitle') || "Strategic Framework Analysis";
    el.frameworkAnalysis.textContent = STATE.lang === 'ko' 
        ? `가중치 의사결정 매트릭스(Weighted Decision Matrix) 프레임워크를 기반으로 각 대안의 중요도 가중치를 곱해 정량적 합의점에 도달했습니다.`
        : `Based on the Weighted Decision Matrix framework, we multiplied scores by value weights to reach a quantitative decision consensus.`;

    // Cognitive bias warning logic
    let biasName = t('biasStatusQuoName');
    let biasDesc = t('biasStatusQuoDesc');

    const containsCost = STATE.criteria.some(c => c.name.toLowerCase().includes('cost') || c.name.toLowerCase().includes('price') || c.name.toLowerCase().includes('budget'));
    if (containsCost && STATE.chatAnswers.budget === 'high') {
        biasName = t('biasSunkCostName');
        biasDesc = t('biasSunkCostDesc');
    } else if (STATE.options.length >= 3) {
        biasName = t('biasChoiceParadoxName');
        biasDesc = t('biasChoiceParadoxDesc');
    }

    el.biasAlert.innerHTML = `<strong>${biasName}</strong>: ${biasDesc}`;

    // Action Checklist Generator
    const actionCName = topC ? topC.name : (STATE.lang === 'ko' ? '핵심 가치' : 'Core Value');
    el.actionList.innerHTML = `
        <li><i class="fa-solid fa-circle-check"></i> <span>${t('actionItem1').replace('{name}', actionCName)}</span></li>
        <li><i class="fa-solid fa-circle-check"></i> <span>${t('actionItem2').replace('{name}', winner)}</span></li>
        <li><i class="fa-solid fa-circle-check"></i> <span>${t('actionItem3')}</span></li>
    `;
}

// Live Gemini API client
async function fetchGeminiVerdict(finalScores, winner) {
    el.winnerBox.innerHTML = `
        <i class="fa-solid fa-robot winner-icon"></i>
        <div class="winner-details">
            <h5>${t('aiWinnerTitle')}</h5>
            <div class="winner-name">${winner}</div>
        </div>
    `;

    try {
        const payload = {
            dilemma: STATE.dilemma,
            options: STATE.options,
            criteria: STATE.criteria,
            scores: STATE.scores,
            finalScores: finalScores,
            winner: winner,
            chatAnswers: STATE.chatAnswers,
            language: STATE.lang === 'ko' ? 'Korean' : 'English'
        };

        const systemPrompt = `You are an expert AI consulting assistant specialized in human decision psychology.
Analyze the user's dilemma, options, criteria scores, weights, and provide an insightful final recommendation report.
Be analytical, precise, and decisive. Do not sit on the fence—deliver a clear recommendation.
CRITICAL: You must write the report in ${payload.language}.

Please output your analysis in the following strict JSON format, containing no other text:
{
  "summary": "Detailed final analysis text explaining why the winner is optimal based on the weights.",
  "detailedAnalysis": [
    {
      "criterion": "Criterion Name",
      "analysis": "A detailed comparative analysis explaining how and why options perform on this criterion. CRITICAL: The analysis for each criterion must be extremely detailed, concrete, and rich in realistic context. You must not merely repeat the scores or say one option is better. You must draw upon your vast knowledge base to provide specific factual or highly plausible details (e.g. if dilemma is travel: compare options using concrete local delicacies like Yeosu's marinated crab vs. Tongyeong's sea squirt bibimbap, specific transit methods like KTX travel times vs. driving routes, and estimated budget ranges or lodging costs; if dilemma is career: compare typical salary numbers, growth outlooks, commute paths, or work hours). Each criterion comparison must be a full, rich paragraph of 3-5 highly detailed sentences."
    }
  ],
  "frameworkName": "Strategic framework name used (e.g. Jeff Bezos' Regret Minimization Framework, Asymmetric Risk-Reward, SWOT Matrix, etc.)",
  "frameworkAnalysis": "Application of the framework specifically to the user's current situation.",
  "biasName": "Name of the cognitive bias warning relevant to this decision",
  "biasDesc": "Explanation of the cognitive bias and psychological guidance.",
  "actions": ["Action item 1", "Action item 2", "Action item 3"]
}
Ensure detailedAnalysis has a comparative analysis for every criterion in the matrix.`;

        const userPrompt = `Input Data: ${JSON.stringify(payload)}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${STATE.geminiApiKey}`, {
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
            throw new Error('Gemini API request failed');
        }

        const data = await response.json();
        const jsonText = data.candidates[0].content.parts[0].text;
        const cleanedText = cleanJsonString(jsonText);
        const res = JSON.parse(cleanedText);

        el.verdictSummary.textContent = res.summary;
        
        // Render Detailed Criteria Analysis Section
        el.criteriaAnalysisList.innerHTML = '';
        if (res.detailedAnalysis && res.detailedAnalysis.length > 0) {
            res.detailedAnalysis.forEach(item => {
                const div = document.createElement('div');
                div.className = 'criteria-analysis-item';
                div.innerHTML = `
                    <div class="criteria-analysis-title">
                        <i class="fa-solid fa-check-double"></i> <span>${item.criterion}</span>
                    </div>
                    <div class="criteria-analysis-text">${item.analysis}</div>
                `;
                el.criteriaAnalysisList.appendChild(div);
            });
            el.criteriaAnalysisSection.style.display = 'block';
        } else {
            el.criteriaAnalysisSection.style.display = 'none';
        }
        
        // Render decision framework box
        el.frameworkName.textContent = res.frameworkName || "Strategic Framework";
        el.frameworkAnalysis.textContent = res.frameworkAnalysis || "";
        
        el.biasAlert.innerHTML = `<strong>${res.biasName}</strong>: ${res.biasDesc}`;
        
        el.actionList.innerHTML = '';
        res.actions.forEach(action => {
            const li = document.createElement('li');
            li.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>${action}</span>`;
            el.actionList.appendChild(li);
        });

    } catch (err) {
        console.error('Gemini API Error, falling back to simulated engine:', err);
        el.verdictApiStatus.textContent = 'API Error (Fallback Activated)';
        el.verdictApiStatus.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
        el.verdictApiStatus.style.color = '#fca5a5';
        generateSimulatedVerdict(finalScores, winner);
    }
}

// Reset/Restart App state
function restartApp() {
    STATE.dilemma = '';
    STATE.options = [];
    STATE.criteria = [];
    STATE.scores = {};
    STATE.currentStep = 1;
    STATE.chatAnswers = {};
    STATE.isAiDraft = false;
    STATE.dynamicQuestions = null;
    
    el.inputDilemma.value = '';
    el.inputContext.value = '';
    el.wizardAiBadge.classList.add('hidden');
    
    // Reset defaults based on language
    if (STATE.lang === 'ko') {
        STATE.options = ['선택지 A', '선택지 B'];
        STATE.criteria = [
            { name: '비용', weight: 3 },
            { name: '행복/만족도', weight: 4 },
            { name: '난이도/노력', weight: 2 }
        ];
    } else {
        STATE.options = ['Option A', 'Option B'];
        STATE.criteria = [
            { name: 'Cost', weight: 3 },
            { name: 'Happiness', weight: 4 },
            { name: 'Effort/Difficulty', weight: 2 }
        ];
    }

    switchView('landing');
}

// ----------------------------------------------------
// ChoiceFlow AI Engine Extension Methods
// ----------------------------------------------------

// Check the available AI capabilities of the environment
async function checkAiCapabilities() {
    // 1. Check server key availability
    try {
        const res = await fetch('/api/config');
        if (res.ok) {
            const data = await res.json();
            STATE.serverKeyAvailable = !!data.serverKeyAvailable;
        }
    } catch (e) {
        console.warn('Backend server config check failed, assuming offline/client-only mode.');
        STATE.serverKeyAvailable = false;
    }

    // 2. Check local Gemini Nano support (Chrome Prompt API)
    try {
        if (window.ai && window.ai.languageModel) {
            const capabilities = await window.ai.languageModel.capabilities();
            if (capabilities.available === 'readily' || capabilities.available === 'after-download') {
                STATE.localAiAvailable = true;
            }
        }
    } catch (e) {
        console.warn('Chrome Built-in AI check failed or not supported in this browser.');
        STATE.localAiAvailable = false;
    }

    updateEngineStatusUI();
}

// Update the visual status badges inside the settings modal
function updateEngineStatusUI() {
    const serverBadge = document.getElementById('engine-badge-server');
    const localBadge = document.getElementById('engine-badge-local');
    const userBadge = document.getElementById('engine-badge-user');

    if (!serverBadge || !localBadge || !userBadge) return;

    // 1. Server Badge
    if (STATE.serverKeyAvailable) {
        serverBadge.className = 'engine-badge badge-green';
        serverBadge.querySelector('span').textContent = t('engineStatusServerActive');
    } else {
        serverBadge.className = 'engine-badge badge-gray';
        serverBadge.querySelector('span').textContent = t('engineStatusServerInactive');
    }

    // 2. Local Gemini Nano Badge
    if (STATE.localAiAvailable) {
        localBadge.className = 'engine-badge badge-blue';
        localBadge.querySelector('span').textContent = t('engineStatusLocalActive');
    } else {
        localBadge.className = 'engine-badge badge-gray';
        localBadge.querySelector('span').textContent = t('engineStatusLocalInactive');
    }

    // 3. User custom key Badge
    if (STATE.geminiApiKey) {
        userBadge.className = 'engine-badge badge-gold';
        userBadge.querySelector('span').textContent = t('engineStatusUserActive');
    } else {
        userBadge.className = 'engine-badge badge-gray';
        userBadge.querySelector('span').textContent = t('engineStatusUserInactive');
    }
}

// Fetch verdict from server-side AI proxy
async function fetchServerVerdict(finalScores, winner) {
    el.winnerBox.innerHTML = `
        <i class="fa-solid fa-server winner-icon"></i>
        <div class="winner-details">
            <h5>${t('aiWinnerTitle')}</h5>
            <div class="winner-name">${winner}</div>
        </div>
    `;

    try {
        const payload = {
            dilemma: STATE.dilemma,
            options: STATE.options,
            criteria: STATE.criteria,
            scores: STATE.scores,
            finalScores: finalScores,
            winner: winner,
            chatAnswers: STATE.chatAnswers,
            language: STATE.lang === 'ko' ? 'Korean' : 'English'
        };

        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            if (response.status === 429 && errData.error === 'quota_exceeded') {
                throw new Error('quota_exceeded');
            }
            throw new Error('Server proxy request failed');
        }

        const res = await response.json();

        el.verdictSummary.textContent = res.summary;

        // Render Detailed Criteria Analysis Section
        el.criteriaAnalysisList.innerHTML = '';
        if (res.detailedAnalysis && res.detailedAnalysis.length > 0) {
            res.detailedAnalysis.forEach(item => {
                const div = document.createElement('div');
                div.className = 'criteria-analysis-item';
                div.innerHTML = `
                    <div class="criteria-analysis-title">
                        <i class="fa-solid fa-check-double"></i> <span>${item.criterion}</span>
                    </div>
                    <div class="criteria-analysis-text">${item.analysis}</div>
                `;
                el.criteriaAnalysisList.appendChild(div);
            });
            el.criteriaAnalysisSection.style.display = 'block';
        } else {
            el.criteriaAnalysisSection.style.display = 'none';
        }
        
        // Render decision framework box
        el.frameworkName.textContent = res.frameworkName || "Strategic Framework";
        el.frameworkAnalysis.textContent = res.frameworkAnalysis || "";
        
        el.biasAlert.innerHTML = `<strong>${res.biasName}</strong>: ${res.biasDesc}`;
        
        el.actionList.innerHTML = '';
        res.actions.forEach(action => {
            const li = document.createElement('li');
            li.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>${action}</span>`;
            el.actionList.appendChild(li);
        });

    } catch (err) {
        console.error('Server Proxy Error, falling back to local systems:', err);
        
        if (err.message === 'quota_exceeded') {
            const msg = STATE.lang === 'ko'
                ? '서버 일일 AI 사용량 한도가 소진되었습니다. 계속해서 실시간 AI 조언을 듣고 싶으시면 설정(톱니바퀴)에서 개인 API 키를 등록하여 이용해 주세요. (미등록 시 로컬 시뮬레이션으로 작동합니다.)'
                : 'Server daily AI limit reached. Please configure your own Gemini API key in the settings (top-right gear) to continue using live AI analysis.';
            alert(msg);
        }

        // Fallback to local AI if available, otherwise simulation
        if (STATE.localAiAvailable) {
            el.verdictApiStatus.textContent = 'Server Limit (Fallback to Local AI)';
            el.verdictApiStatus.style.backgroundColor = 'rgba(245, 158, 11, 0.2)';
            el.verdictApiStatus.style.color = '#fde047';
            await fetchLocalAiVerdict(finalScores, winner);
        } else {
            el.verdictApiStatus.textContent = 'Server Limit (Simulated Fallback)';
            el.verdictApiStatus.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
            el.verdictApiStatus.style.color = '#fca5a5';
            generateSimulatedVerdict(finalScores, winner);
        }
    }
}

// Fetch verdict from client-side Chrome Built-in AI (Gemini Nano)
async function fetchLocalAiVerdict(finalScores, winner) {
    el.winnerBox.innerHTML = `
        <i class="fa-solid fa-microchip winner-icon"></i>
        <div class="winner-details">
            <h5>${t('aiWinnerTitle')}</h5>
            <div class="winner-name">${winner}</div>
        </div>
    `;

    try {
        const payload = {
            dilemma: STATE.dilemma,
            options: STATE.options,
            criteria: STATE.criteria,
            scores: STATE.scores,
            finalScores: finalScores,
            winner: winner,
            chatAnswers: STATE.chatAnswers,
            language: STATE.lang === 'ko' ? 'Korean' : 'English'
        };

        const systemPrompt = `You are an expert AI consulting assistant specialized in human decision psychology.
Analyze the user's dilemma, options, criteria scores, weights, and interview answers, and provide an insightful final recommendation report.
Be analytical, precise, and decisive. Do not sit on the fence—deliver a clear recommendation.
CRITICAL: You must write the report in ${payload.language}.

Please output your analysis in the following strict JSON format, containing no other text:
{
  "summary": "Detailed final analysis text explaining why the winner is optimal based on the weights.",
  "frameworkName": "Strategic framework name used (e.g. Jeff Bezos' Regret Minimization Framework, Asymmetric Risk-Reward, SWOT Matrix, etc.)",
  "frameworkAnalysis": "Application of the framework specifically to the user's current situation.",
  "biasName": "Name of the cognitive bias warning relevant to this decision",
  "biasDesc": "Explanation of the cognitive bias and psychological guidance.",
  "actions": ["Action item 1", "Action item 2", "Action item 3"]
}`;

        const userPrompt = `Input Data: ${JSON.stringify(payload)}`;

        // Create Gemini Nano session in browser
        const session = await window.ai.languageModel.create({
            systemPrompt: systemPrompt
        });

        const rawResponse = await session.prompt(userPrompt);
        
        // Clean JSON text (sometimes Gemini Nano adds markdown code blocks)
        const cleanText = cleanJsonString(rawResponse);
        const res = JSON.parse(cleanText);

        el.verdictSummary.textContent = res.summary;
        
        // Render decision framework box
        el.frameworkName.textContent = res.frameworkName || "Strategic Framework";
        el.frameworkAnalysis.textContent = res.frameworkAnalysis || "";
        
        el.biasAlert.innerHTML = `<strong>${res.biasName}</strong>: ${res.biasDesc}`;
        
        el.actionList.innerHTML = '';
        res.actions.forEach(action => {
            const li = document.createElement('li');
            li.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>${action}</span>`;
            el.actionList.appendChild(li);
        });

        // Destroy session to release memory
        session.destroy();

    } catch (err) {
        console.error('Chrome On-Device AI Error, falling back to simulated engine:', err);
        el.verdictApiStatus.textContent = 'Local AI Error (Fallback Activated)';
        el.verdictApiStatus.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
        el.verdictApiStatus.style.color = '#fca5a5';
        generateSimulatedVerdict(finalScores, winner);
    }
}

// Clean JSON code blocks wrapper from API response strings
function cleanJsonString(text) {
    let clean = text.trim();
    if (clean.startsWith("```json")) {
        clean = clean.substring(7);
    } else if (clean.startsWith("```")) {
        clean = clean.substring(3);
    }
    if (clean.endsWith("```")) {
        clean = clean.substring(0, clean.length - 3);
    }
    return clean.trim();
}

// ----------------------------------------------------
// LG Intranet Bypass Methods (Direct Gemini API calls)
// ----------------------------------------------------

async function fetchGeminiSetupChat(forceFinish) {
    const userMessages = setupChatHistory.filter(m => m.role === 'user');
    const isFinalTurn = forceFinish || (userMessages.length >= 3);

    const systemPrompt = `You are a world-class strategic decision consultant and senior psychologist.
You are helping the user co-create their decision matrix (Options, Criteria, Weights 1-5, Scores 1-10) for their dilemma.
Keep the conversation engaging, analytical, and supportive.

Your current mode: ${isFinalTurn ? 'FINAL_REPORT_MODE' : 'DIALOGUE_MODE'}.

Language to use: ${STATE.lang === 'ko' ? 'Korean' : 'English'}.

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

Output ONLY the JSON object. Do not wrap in markdown.`;

    const contents = [{
        parts: [{ text: `${systemPrompt}\n\nDilemma: ${STATE.dilemma}\nContext: ${STATE.context || 'None'}` }]
    }];

    setupChatHistory.forEach(msg => {
        contents.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        });
    });

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${STATE.geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: contents,
            generationConfig: {
                responseMimeType: "application/json"
            }
        })
    });

    if (!response.ok) throw new Error('Gemini API Setup Chat request failed');
    const resData = await response.json();
    const rawText = resData.candidates[0].content.parts[0].text;
    const cleanText = cleanJsonString(rawText);
    return JSON.parse(cleanText);
}

async function fetchGeminiContinuousChat(message) {
    const systemPrompt = `You are a world-class strategic decision consultant and senior psychologist.
The user has completed their decision cockpit matrix and is asking questions about the final report, matrix values, or trade-offs.

Dilemma: "${STATE.dilemma}"
Matrix Data: ${JSON.stringify({
        options: STATE.options,
        criteria: STATE.criteria,
        scores: STATE.scores
    })}

Your goal is to provide a deep, highly helpful, and analytical response in markdown format. 
Answer their specific query, explain underlying trade-offs, and suggest alternatives or modifications if requested.
Do not sit on the fence—give clear, professional guidance.

Write your response in ${STATE.lang === 'ko' ? 'Korean' : 'English'}.
You must output a JSON object in this format:
{
  "reply": "Markdown formatted reply..."
}
Output ONLY the JSON.`;

    const contents = [{
        parts: [{ text: systemPrompt }]
    }];

    continuousChatHistory.forEach(msg => {
        contents.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        });
    });

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${STATE.geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: contents,
            generationConfig: {
                responseMimeType: "application/json"
            }
        })
    });

    if (!response.ok) throw new Error('Gemini API Continuous Chat request failed');
    const resData = await response.json();
    const rawText = resData.candidates[0].content.parts[0].text;
    const cleanText = cleanJsonString(rawText);
    const parsed = JSON.parse(cleanText);
    return parsed.reply;
}
