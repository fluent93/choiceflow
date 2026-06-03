# 🚀 ChoiceFlow: AI-Powered Decision Matrix

ChoiceFlow는 복잡한 인생의 고민과 의사결정을 데이터와 AI 분석을 통해 구조화하여 최적의 선택을 하도록 도와주는 프리미엄 **의사결정 매트릭스(MCDA)** 도구입니다.

현재 배포된 라이브 사이트: **[https://choiceflow.vercel.app](https://choiceflow.vercel.app)**

---

## ✨ 핵심 기능

1. **의사결정 매트릭스 (Multi-Criteria Decision Analysis)**
   * 고민 주제를 입력하고, 비교할 선택지들과 평가 기준을 자유롭게 구성합니다.
   * 각 기준별 점수를 직관적인 슬라이더 UI를 통해 매겨 데이터화합니다.
2. **AI 대화형 가중치 튜닝**
   * AI가 사용자가 매긴 점수를 기반으로 심리학적 질문을 던집니다.
   * 사용자의 답변을 통해 어떤 가치를 가장 중요하게 생각하는지 파악하고 가중치를 최종 튜닝합니다.
3. **AI 종합 의사결정 처방 보고서**
   * Llama 3.3 70B 모델이 매트릭스 계산 결과와 대화 내용을 분석하여 최종 제언을 도출합니다.
   * 해당 의사결정에서 빠지기 쉬운 **인지적 편향 경고(Cognitive Bias Alert)** 및 결정 후 즉시 실행할 **액션 아이템(Action Items)**을 제시합니다.
4. **결과 저장 및 PDF 내보내기**
   * 프리미엄 테마가 적용된 보고서를 PDF로 저장하거나 인쇄할 수 있습니다.

---

## 🛠️ 기술 스택 및 아키텍처

ChoiceFlow는 서버리스 아키텍처와 최첨단 오픈소스 LLM을 결합하여 빠르고 안정적으로 동작하도록 설계되었습니다.

### 1. 프론트엔드 (Client)
* **HTML5 / Vanilla JS**: 프레임워크 없는 순수 바닐라 스크립트로 동작하여 로딩 속도가 매우 빠릅니다.
* **Vanilla CSS**: Neon Glow Spot 배경 및 유리 모프 효과(Glassmorphism)를 적용한 프리미엄 현대적 디자인 시스템을 갖추고 있습니다.
* **다국어 지원 (i18n)**: 한국어(KO) 및 영어(EN) 번역 시스템이 내장되어 있습니다.

### 2. 백엔드 (Server & Serverless)
* **Node.js / Express.js**: API 요청 프록시 역할을 수행하는 경량 백엔드입니다.
* **Vercel Serverless Function**: Vercel에 배포될 때 Express 백엔드가 개별 Serverless API로 변환되어 비용 효율적으로 동작합니다.

### 3. AI 추론 엔진 (LLM Engine)
* **Groq Cloud API & Llama 3.3 70B (`llama-3.3-70b-versatile`)**:
  * 구글의 Gemini API를 사용하던 구조에서, 초고속 추론 성능을 가진 Groq 인프라 상의 Llama 3.3 70B 오픈소스 모델로 마이그레이션했습니다.
  * API Key 보안을 위해 클라이언트에서 직접 호출하지 않고, 백엔드 프록시(`server.js`)를 거쳐 안전하게 호출합니다.
  * OpenAI 호환 스펙 API 및 Strict JSON Mode(`response_format: { type: 'json_object' }`)를 사용하여 클라이언트에 완벽한 구조화 데이터를 반환합니다.
* **지능형 폴백 시스템 (Fallback)**:
  * 서버 API를 사용할 수 없거나 일일 쿼터 초과 시, 브라우저 내장 AI(Chrome Gemini Nano Prompt API)를 체크하여 작동하며, 최후 보루로 심리학 알고리즘 기반의 로컬 시뮬레이션 엔진이 작동합니다.

---

## ⚙️ Vercel 라우팅 분리 설계 (`vercel.json`)

Vercel 서버리스 실행 환경 내에서 `style.css`나 `app.js`와 같은 정적 파일들이 404 없이 안정적으로 구동될 수 있도록 **정적 파일 서빙과 API 라우팅을 명확히 이원화**했습니다.

```json
{
  "version": 2,
  "builds": [
    { "src": "server.js", "use": "@vercel/node" },
    { "src": "!(server.js|package.json|package-lock.json|node_modules/**)", "use": "@vercel/static" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "server.js" },
    { "src": "/(.*)", "dest": "$1" }
  ]
}
```
* `/api/*` 경로의 모든 AI 연산 및 환경설정 체크 요청은 `@vercel/node`를 거쳐 `server.js`로 전달됩니다.
* 그 외의 모든 자산은 Vercel Edge Network에서 직접 제공하는 초고속 정적 자산 서빙(`@vercel/static`)을 통해 서빙됩니다.

---

## 🚀 로컬 개발 및 시작하기

### 1. 환경 변수 세팅 (`.env`)
프로젝트 루트 디렉토리에 `.env` 파일을 생성하고 아래 변수들을 기입합니다.
```env
GROQ_API_KEY=your_groq_api_key_here
PORT=3000
MAX_DAILY_REQUESTS=100
```

### 2. 패키지 설치 및 로컬 서버 구동
```bash
# 의존성 패키지 설치
npm install

# 로컬 개발 서버 실행
npm start
```
서버가 시작되면 브라우저에서 `http://localhost:3000`으로 접속하여 테스트할 수 있습니다.

---

## ☁️ 배포 가이드 (Vercel Deploy)

1. **Vercel CLI 로그인 및 프로젝트 연동**
   ```bash
   npx vercel login
   npx vercel link
   ```
2. **Groq API 키 환경 변수 등록**
   ```bash
   npx vercel env add GROQ_API_KEY production --value [YOUR_API_KEY] --yes
   ```
3. **프로덕션 릴리즈 배포**
   ```bash
   npx vercel --prod --yes
   ```
