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
    geminiApiKey: localStorage.getItem('gemini_api_key') || ''
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
        actionItem3: "주변 동료 혹은 조력자에게 이 분석 결과를 공유하며 타당성 검증받기"
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
        actionItem3: "Share this visual report with a colleague or mentor to validate your logic."
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

// Document Elements
const el = {
    viewLanding: document.getElementById('view-landing'),
    viewWizard: document.getElementById('view-wizard'),
    viewDashboard: document.getElementById('view-dashboard'),
    
    inputDilemma: document.getElementById('input-dilemma'),
    btnStart: document.getElementById('btn-start'),
    
    wizardDilemmaTitle: document.getElementById('wizard-dilemma-title'),
    optionsList: document.getElementById('options-list'),
    btnAddOption: document.getElementById('btn-add-option'),
    
    criteriaList: document.getElementById('criteria-list'),
    btnAddCriteria: document.getElementById('btn-add-criteria'),
    suggestionsTags: document.getElementById('suggestions-tags'),
    
    scoringMatrixContainer: document.getElementById('scoring-matrix-container'),
    
    chatMessages: document.getElementById('chat-messages'),
    chatLoading: document.getElementById('chat-loading'),
    chatInputArea: document.getElementById('chat-input-area'),
    
    btnPrev: document.getElementById('btn-prev'),
    btnNext: document.getElementById('btn-next'),
    
    dashboardDilemmaTitle: document.getElementById('dashboard-dilemma-title'),
    resultsChartContainer: document.getElementById('results-chart-container'),
    matrixTable: document.getElementById('matrix-table'),
    winnerBox: document.getElementById('winner-box'),
    verdictSummary: document.getElementById('verdict-summary'),
    biasAlert: document.getElementById('bias-alert'),
    actionList: document.getElementById('action-list'),
    verdictApiStatus: document.getElementById('verdict-api-status'),
    
    btnRestart: document.getElementById('btn-restart'),
    btnExport: document.getElementById('btn-export'),
    
    modalApi: document.getElementById('modal-api'),
    btnApiSettings: document.getElementById('btn-api-settings'),
    btnCloseModal: document.getElementById('btn-close-modal'),
    btnSaveApi: document.getElementById('btn-save-api'),
    inputApiKey: document.getElementById('input-api-key'),
    presetsContainer: document.getElementById('presets-container')
};

// Initialize Application
window.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    setLanguage(STATE.lang); // Triggers initial render
    if (STATE.geminiApiKey) {
        el.inputApiKey.value = STATE.geminiApiKey;
    }
});

// Setup Event Listeners
function setupEventListeners() {
    // Language Switcher Events
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            setLanguage(e.target.dataset.lang);
        });
    });

    // Landing: Start custom dilemma
    el.btnStart.addEventListener('click', () => {
        const text = el.inputDilemma.value.trim();
        if (!text) {
            alert(t('alertStartDilemma'));
            return;
        }
        startWizard(text);
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

    // API Modal Controls
    el.btnApiSettings.addEventListener('click', () => {
        el.modalApi.classList.add('active');
    });
    el.btnCloseModal.addEventListener('click', () => {
        el.modalApi.classList.remove('active');
    });
    el.btnSaveApi.addEventListener('click', () => {
        const key = el.inputApiKey.value.trim();
        STATE.geminiApiKey = key;
        localStorage.setItem('gemini_api_key', key);
        el.modalApi.classList.remove('active');
        alert(STATE.lang === 'ko' ? 'API 키가 저장되었습니다.' : 'API Key saved successfully.');
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

function startTuningChat() {
    el.chatMessages.innerHTML = '';
    el.chatInputArea.innerHTML = '';
    currentChatIdx = 0;
    STATE.chatAnswers = {};
    
    const currentQuestions = TUNING_QUESTIONS[STATE.lang];
    addChatBubble('ai', t('chatAiIntro') + currentQuestions[0].text);
    renderChatOptions(currentQuestions[0]);
}

function addChatBubble(sender, text) {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${sender}`;
    bubble.textContent = text;
    el.chatMessages.appendChild(bubble);
    el.chatMessages.scrollTop = el.chatMessages.scrollHeight;
}

function renderChatOptions(question) {
    el.chatInputArea.innerHTML = '';
    question.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'chat-option-btn';
        btn.textContent = opt.text;
        btn.addEventListener('click', () => handleChatResponse(question, opt));
        el.chatInputArea.appendChild(btn);
    });
}

function handleChatResponse(question, option) {
    // Record Answer
    STATE.chatAnswers[question.id] = option.value;
    
    // User message bubble
    addChatBubble('user', option.text);
    
    // Disable inputs momentarily
    el.chatInputArea.innerHTML = '';
    el.chatLoading.classList.remove('hidden');

    setTimeout(() => {
        el.chatLoading.classList.add('hidden');
        currentChatIdx++;
        
        const currentQuestions = TUNING_QUESTIONS[STATE.lang];
        if (currentChatIdx < currentQuestions.length) {
            const nextQ = currentQuestions[currentChatIdx];
            addChatBubble('ai', nextQ.text);
            renderChatOptions(nextQ);
        } else {
            addChatBubble('ai', t('chatAiComplete'));
            // Adjust weights heuristically based on answers
            applyHeuristicTuning();
        }
    }, 700);
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

    // 5. Generate AI Verdict (Real or Simulated)
    if (STATE.geminiApiKey) {
        el.verdictApiStatus.textContent = 'Gemini API Connected';
        el.verdictApiStatus.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
        el.verdictApiStatus.style.color = '#93c5fd';
        await fetchGeminiVerdict(finalScores, winner);
    } else {
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
                <td>${crit.weight}</td>
                ${STATE.options.map(opt => `<td>${STATE.scores[crit.name][opt] || 5}${t('scoreUnit')}</td>`).join('')}
            </tr>
        `;
    });

    html += '</tbody>';
    el.matrixTable.innerHTML = html;
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

    // Cognitive bias warning logic
    let biasName = t('biasStatusQuoName');
    let biasDesc = t('biasStatusQuoDesc');

    // Specific heuristics trigger for bias
    const containsCost = STATE.criteria.some(c => c.name.includes('비용') || c.name.includes('예산') || c.name.toLowerCase().includes('cost') || c.name.toLowerCase().includes('price') || c.name.toLowerCase().includes('budget'));
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
        const res = JSON.parse(jsonText);

        el.verdictSummary.textContent = res.summary;
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
    
    el.inputDilemma.value = '';
    
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
