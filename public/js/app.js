(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __decorateClass = (decorators, target, key, kind) => {
    var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
    for (var i = decorators.length - 1, decorator; i >= 0; i--)
      if (decorator = decorators[i])
        result = (kind ? decorator(target, key, result) : decorator(result)) || result;
    if (kind && result) __defProp(target, key, result);
    return result;
  };

  // src/client/core/injectable.decorator.ts
  var serviceRegistry = /* @__PURE__ */ new Map();
  function Injectable(options = { providedIn: "root" }) {
    return function(target) {
      return target;
    };
  }
  function inject(serviceClass) {
    if (!serviceRegistry.has(serviceClass)) {
      serviceRegistry.set(serviceClass, new serviceClass());
    }
    return serviceRegistry.get(serviceClass);
  }

  // src/client/core/component.decorator.ts
  var BaseComponent = class extends HTMLElement {
    isInitialized = false;
    connectedCallback() {
      this.render();
      if (!this.isInitialized) {
        this.isInitialized = true;
        this.ngOnInit();
      }
    }
    disconnectedCallback() {
      this.ngOnDestroy();
    }
    /**
     * Lifecycle hook invoked once the component is attached
     */
    ngOnInit() {
    }
    /**
     * Lifecycle hook invoked when the component is destroyed/detached
     */
    ngOnDestroy() {
    }
    /**
     * Renders or re-renders the component template
     */
    render() {
    }
    /**
     * Dispatch custom event (Angular @Output equivalent)
     */
    emit(eventName, detail) {
      this.dispatchEvent(
        new CustomEvent(eventName, {
          bubbles: true,
          composed: true,
          detail
        })
      );
    }
    /**
     * Scoped query selector helper
     */
    $(selector) {
      return this.querySelector(selector);
    }
    /**
     * Scoped query selector all helper
     */
    $$(selector) {
      return this.querySelectorAll(selector);
    }
  };
  function Component(metadata) {
    return function(target) {
      if (!customElements.get(metadata.selector)) {
        customElements.define(metadata.selector, target);
      }
      target.__metadata = metadata;
      return target;
    };
  }

  // src/client/services/survey.service.ts
  var QGEVAL_METRICS = [
    // Linguistic dimensions
    { id: "fluency", label: "Fluency", labelUk: "\u041F\u0440\u0438\u0440\u043E\u0434\u043D\u0456\u0441\u0442\u044C", group: "linguistic", description: "How well-formed, grammatically correct, logically coherent and comprehensible the question is." },
    { id: "clarity", label: "Clarity", labelUk: "\u0427\u0456\u0442\u043A\u0456\u0441\u0442\u044C", group: "linguistic", description: "Whether the question is stated clearly and unambiguously, avoiding over-generalisation or vagueness." },
    { id: "conciseness", label: "Conciseness", labelUk: "\u041B\u0430\u043A\u043E\u043D\u0456\u0447\u043D\u0456\u0441\u0442\u044C", group: "linguistic", description: "Whether the question is concise and does not contain redundancy or duplicate information." },
    // Task-oriented dimensions
    { id: "relevance", label: "Relevance", labelUk: "\u0420\u0435\u043B\u0435\u0432\u0430\u043D\u0442\u043D\u0456\u0441\u0442\u044C", group: "task", description: "How relevant the question is to the provided image (domain) and dataset topic." },
    { id: "consistency", label: "Consistency", labelUk: "\u041A\u043E\u043D\u0442\u0435\u043A\u0441\u0442\u043D\u0430 \u0443\u0437\u0433\u043E\u0434\u0436\u0435\u043D\u0456\u0441\u0442\u044C", group: "task", description: "Whether the information stated in the question itself is consistent with the provided image." },
    { id: "answerability", label: "Answerability", labelUk: "\u041C\u043E\u0436\u043B\u0438\u0432\u0456\u0441\u0442\u044C \u0432\u0456\u0434\u043F\u043E\u0432\u0456\u0441\u0442\u0438", group: "task", description: "Whether a clear and unambiguous answer can be found relying solely on the provided image." },
    { id: "answer_consistency", label: "Answer Consistency", labelUk: "\u0423\u0437\u0433\u043E\u0434\u0436\u0435\u043D\u0456\u0441\u0442\u044C \u0432\u0456\u0434\u043F\u043E\u0432\u0456\u0434\u0456", group: "task", description: "Whether the generated question can be successfully answered using the target answer provided to the model." }
  ];
  var SurveyService = class {
    questions = [];
    /** Map<questionId, QGEvalScores> */
    selectedScores = /* @__PURE__ */ new Map();
    currentView = "survey";
    cachedResults = null;
    // Reactive listeners
    viewListeners = /* @__PURE__ */ new Set();
    scoreListeners = /* @__PURE__ */ new Set();
    totalCount = 1;
    async getTotalQuestionsCount() {
      try {
        const res = await fetch("/api/survey/questions/count");
        if (res.ok) {
          const data = await res.json();
          if (typeof data.total === "number") {
            this.totalCount = data.total;
          }
        }
      } catch (e) {
        console.warn("Could not fetch question count:", e);
      }
      return this.totalCount;
    }
    async fetchQuestionByIndex(index) {
      const res = await fetch(`/api/survey/questions/${index}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Question #${index} not found in database`);
      }
      const q = await res.json();
      this.questions = [q];
      return q;
    }
    async getQuestionDetails(index) {
      try {
        const res = await fetch(`/api/survey/questions/${index}`);
        if (res.ok) {
          return await res.json();
        }
      } catch (e) {
        console.warn(`Could not fetch question details for #${index}:`, e);
      }
      return null;
    }
    async getQuestions() {
      if (this.questions.length > 0) {
        return this.questions;
      }
      const res = await fetch("/api/survey/questions");
      if (!res.ok) {
        throw new Error(`Failed to load questionnaire items: ${res.statusText}`);
      }
      this.questions = await res.json();
      return this.questions;
    }
    /** Set a single metric score for a question */
    setMetricScore(questionId, metricId, score) {
      const existing = this.selectedScores.get(questionId) ?? {};
      this.selectedScores.set(questionId, { ...existing, [metricId]: score });
      this.notifyScoreListeners();
    }
    /** Get all QGEval scores for a question */
    getScores(questionId) {
      return this.selectedScores.get(questionId) ?? {};
    }
    /** Get a single metric score for a question */
    getMetricScore(questionId, metricId) {
      return (this.selectedScores.get(questionId) ?? {})[metricId];
    }
    /** Returns true when all 7 metrics have been rated for the given question */
    isQuestionFullyAnswered(questionId) {
      const scores = this.selectedScores.get(questionId);
      if (!scores) return false;
      return QGEVAL_METRICS.every((m) => scores[m.id] !== void 0);
    }
    getSelectedScores() {
      return new Map(this.selectedScores);
    }
    /** Number of questions where all 7 metrics have been rated */
    getAnsweredCount() {
      return this.questions.filter((q) => this.isQuestionFullyAnswered(q.id)).length;
    }
    getLoadedQuestionsCount() {
      return this.questions.length;
    }
    resetScores() {
      this.selectedScores.clear();
      this.notifyScoreListeners();
    }
    async submitSurvey(payload) {
      const res = await fetch("/api/survey/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Submission failed");
      }
      const data = await res.json();
      this.cachedResults = null;
      return data;
    }
    async getResults() {
      const res = await fetch("/api/survey/results");
      if (!res.ok) {
        throw new Error(`Failed to fetch results: ${res.statusText}`);
      }
      this.cachedResults = await res.json();
      return this.cachedResults;
    }
    async getAnswersForQuestion(questionId) {
      const res = await fetch(`/api/survey/questions/${questionId}/answers`);
      if (!res.ok) {
        throw new Error(`Failed to fetch answers for question #${questionId}: ${res.statusText}`);
      }
      return res.json();
    }
    setView(view) {
      this.currentView = view;
      this.viewListeners.forEach((fn) => fn(view));
    }
    getView() {
      return this.currentView;
    }
    onViewChange(fn) {
      this.viewListeners.add(fn);
      return () => this.viewListeners.delete(fn);
    }
    onScoreChange(fn) {
      this.scoreListeners.add(fn);
      return () => this.scoreListeners.delete(fn);
    }
    notifyScoreListeners() {
      const copy = new Map(this.selectedScores);
      this.scoreListeners.forEach((fn) => fn(copy));
    }
  };
  SurveyService = __decorateClass([
    Injectable()
  ], SurveyService);

  // src/client/components/header/header.component.ts
  var HeaderComponent = class extends BaseComponent {
    surveyService = inject(SurveyService);
    unsubscribeView;
    ngOnInit() {
      this.unsubscribeView = this.surveyService.onViewChange(() => {
        this.updateActiveTabs();
      });
      this.bindEvents();
      this.updateActiveTabs();
    }
    ngOnDestroy() {
      if (this.unsubscribeView) {
        this.unsubscribeView();
      }
    }
    render() {
      this.innerHTML = `
      <header class="border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-30">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="h-9 w-9 rounded-xl bg-slate-950 flex items-center justify-center shadow-sm">
              <span class="text-lime-400 font-extrabold text-lg leading-none">10</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="font-bold text-slate-950 tracking-tight text-base">RatePulse</span>
              <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs">v1.4.8</span>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button id="nav-survey-btn" class="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all">
              Rate Survey
            </button>
            <button id="nav-results-btn" class="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all">
              Live Scores
            </button>
            <a href="/imageExample" class="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-950 hover:bg-slate-100 transition-all flex items-center gap-1">
              <span>\u{1F5BC}\uFE0F Image Example</span>
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:text-slate-950 hover:bg-slate-50 transition-colors ml-1">
              <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </header>
    `;
    }
    bindEvents() {
      const surveyBtn = this.$("#nav-survey-btn");
      const resultsBtn = this.$("#nav-results-btn");
      surveyBtn?.addEventListener("click", () => {
        this.surveyService.setView("survey");
      });
      resultsBtn?.addEventListener("click", () => {
        this.surveyService.setView("results");
      });
    }
    updateActiveTabs() {
      const currentView = this.surveyService.getView();
      const surveyBtn = this.$("#nav-survey-btn");
      const resultsBtn = this.$("#nav-results-btn");
      if (!surveyBtn || !resultsBtn) return;
      if (currentView === "survey") {
        surveyBtn.className = "px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-950 text-white transition-all shadow-sm";
        resultsBtn.className = "px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-950 hover:bg-slate-100 transition-all";
      } else {
        surveyBtn.className = "px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-950 hover:bg-slate-100 transition-all";
        resultsBtn.className = "px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-950 text-white transition-all shadow-sm";
      }
    }
  };
  HeaderComponent = __decorateClass([
    Component({
      selector: "app-header"
    })
  ], HeaderComponent);

  // src/client/components/rating-scale/rating-scale.component.ts
  var RatingScaleComponent = class extends BaseComponent {
    surveyService = inject(SurveyService);
    questionId = "";
    minLabel = "";
    maxLabel = "";
    selectedScore = null;
    unsubscribeScores;
    // Angular @Input equivalent setter
    setProperties(props) {
      this.questionId = props.questionId;
      this.minLabel = props.minLabel;
      this.maxLabel = props.maxLabel;
      this.selectedScore = props.selectedScore ?? null;
      this.render();
      this.bindEvents();
    }
    ngOnInit() {
      if (!this.questionId) {
        this.questionId = this.getAttribute("question-id") || "";
        this.minLabel = this.getAttribute("min-label") || "Low";
        this.maxLabel = this.getAttribute("max-label") || "High";
        const stored = this.surveyService.getScore(this.questionId);
        if (stored !== void 0) {
          this.selectedScore = stored;
        }
        this.render();
        this.bindEvents();
      }
      this.unsubscribeScores = this.surveyService.onScoreChange((scores) => {
        const score = scores.get(this.questionId) ?? null;
        if (score !== this.selectedScore) {
          this.selectedScore = score;
          this.updateButtonStates();
        }
      });
    }
    ngOnDestroy() {
      if (this.unsubscribeScores) {
        this.unsubscribeScores();
      }
    }
    render() {
      let buttonsHtml = "";
      for (let s = 1; s <= 10; s++) {
        const isActive = this.selectedScore === s;
        buttonsHtml += `
        <button 
          type="button" 
          data-score="${s}"
          aria-label="Score ${s} out of 10"
          aria-pressed="${isActive ? "true" : "false"}"
          class="score-btn ${isActive ? "active" : ""}"
        >
          <span class="text-base">${s}</span>
        </button>
      `;
      }
      this.innerHTML = `
      <div>
        <div class="grid grid-cols-5 sm:grid-cols-10 gap-2 sm:gap-2.5">
          ${buttonsHtml}
        </div>

        <div class="flex items-center justify-between text-xs text-slate-500 font-medium mt-3 px-1">
          <span class="flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            ${this.escape(this.minLabel)}
          </span>
          <span class="flex items-center gap-1">
            ${this.escape(this.maxLabel)}
            <span class="w-1.5 h-1.5 rounded-full bg-lime-500"></span>
          </span>
        </div>
      </div>
    `;
    }
    bindEvents() {
      const buttons = this.$$(".score-btn");
      buttons.forEach((btn) => {
        btn.addEventListener("click", () => {
          const score = parseInt(btn.getAttribute("data-score") || "0", 10);
          if (score >= 1 && score <= 10) {
            this.surveyService.setScore(this.questionId, score);
            this.emit("scoreSelected", { questionId: this.questionId, score });
          }
        });
      });
    }
    updateButtonStates() {
      const buttons = this.$$(".score-btn");
      buttons.forEach((btn) => {
        const score = parseInt(btn.getAttribute("data-score") || "0", 10);
        if (score === this.selectedScore) {
          btn.classList.add("active");
          btn.setAttribute("aria-pressed", "true");
        } else {
          btn.classList.remove("active");
          btn.setAttribute("aria-pressed", "false");
        }
      });
    }
    escape(str) {
      return str ? str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") : "";
    }
  };
  RatingScaleComponent = __decorateClass([
    Component({
      selector: "app-rating-scale"
    })
  ], RatingScaleComponent);

  // src/client/components/qgeval-metric-row/qgeval-metric-row.component.ts
  var QGEvalMetricRowComponent = class extends BaseComponent {
    surveyService = inject(SurveyService);
    questionId = "";
    metricId = "fluency";
    label = "";
    labelUk = "";
    description = "";
    selectedScore = null;
    unsubscribe;
    setProperties(props) {
      this.questionId = props.questionId;
      this.metricId = props.metricId;
      this.label = props.label;
      this.labelUk = props.labelUk;
      this.description = props.description;
      this.selectedScore = this.surveyService.getMetricScore(this.questionId, this.metricId) ?? null;
      this.render();
      this.bindEvents();
    }
    ngOnInit() {
      this.unsubscribe = this.surveyService.onScoreChange(() => {
        const score = this.surveyService.getMetricScore(this.questionId, this.metricId) ?? null;
        if (score !== this.selectedScore) {
          this.selectedScore = score;
          this.updateButtonStates();
        }
      });
    }
    ngOnDestroy() {
      this.unsubscribe?.();
    }
    render() {
      const buttons = [1, 2, 3].map((s) => {
        const isActive = this.selectedScore === s;
        const colorClass = this.scoreColorClass(s, isActive);
        return `
          <button
            type="button"
            data-score="${s}"
            aria-label="Score ${s} out of 3"
            aria-pressed="${isActive}"
            id="metric-btn-${this.questionId}-${this.metricId}-${s}"
            class="metric-score-btn ${colorClass} w-10 h-10 rounded-xl font-bold text-sm transition-all duration-150 border-2 focus:outline-none focus:ring-2 focus:ring-offset-1 cursor-pointer select-none"
          >${s}</button>
        `;
      }).join("");
      this.innerHTML = `
      <div class="flex items-center gap-3 py-2.5">
        <!-- Label column -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="text-sm font-semibold text-slate-800">${this.escape(this.label)}</span>
            <span class="text-sm text-slate-500 font-normal">(${this.escape(this.labelUk)})</span>
            <!-- Info tooltip -->
            <span class="relative group inline-flex items-center cursor-help" tabindex="0">
              <svg class="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span class="pointer-events-none absolute bottom-full left-0 mb-1.5 w-64 rounded-lg bg-slate-900 text-white text-[11px] leading-relaxed px-2.5 py-2 shadow-lg opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-150 z-50">
                ${this.escape(this.description)}
              </span>
            </span>
          </div>
        </div>

        <!-- Score buttons column -->
        <div class="flex items-center gap-1.5 shrink-0">
          ${buttons}
        </div>
      </div>
    `;
    }
    bindEvents() {
      const btns = this.$$(".metric-score-btn");
      btns.forEach((btn) => {
        btn.addEventListener("click", () => {
          const score = parseInt(btn.getAttribute("data-score") || "0", 10);
          if (score >= 1 && score <= 3) {
            this.surveyService.setMetricScore(this.questionId, this.metricId, score);
            this.emit("metricScored", { questionId: this.questionId, metricId: this.metricId, score });
          }
        });
      });
    }
    updateButtonStates() {
      const btns = this.$$(".metric-score-btn");
      btns.forEach((btn) => {
        const score = parseInt(btn.getAttribute("data-score") || "0", 10);
        const isActive = score === this.selectedScore;
        btn.className = `metric-score-btn ${this.scoreColorClass(score, isActive)} w-10 h-10 rounded-xl font-bold text-sm transition-all duration-150 border-2 focus:outline-none focus:ring-2 focus:ring-offset-1 cursor-pointer select-none`;
        btn.setAttribute("aria-pressed", String(isActive));
      });
    }
    /**
     * Returns Tailwind classes for each score button based on value and active state.
     * 1 = rose/red  2 = amber/yellow  3 = green/lime
     */
    scoreColorClass(score, active) {
      if (active) {
        switch (score) {
          case 1:
            return "bg-rose-500 border-rose-600 text-white shadow-sm shadow-rose-200 ring-rose-400";
          case 2:
            return "bg-amber-400 border-amber-500 text-white shadow-sm shadow-amber-200 ring-amber-400";
          case 3:
            return "bg-lime-500 border-lime-600 text-white shadow-sm shadow-lime-200 ring-lime-400";
        }
      }
      switch (score) {
        case 1:
          return "bg-white border-slate-200 text-slate-500 hover:border-rose-300 hover:text-rose-500 hover:bg-rose-50 ring-rose-400";
        case 2:
          return "bg-white border-slate-200 text-slate-500 hover:border-amber-300 hover:text-amber-500 hover:bg-amber-50 ring-amber-400";
        case 3:
          return "bg-white border-slate-200 text-slate-500 hover:border-lime-400 hover:text-lime-600 hover:bg-lime-50 ring-lime-400";
      }
    }
    escape(str) {
      return str ? str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") : "";
    }
  };
  QGEvalMetricRowComponent = __decorateClass([
    Component({
      selector: "app-qgeval-metric-row"
    })
  ], QGEvalMetricRowComponent);

  // src/client/components/question-card/question-card.component.ts
  var QuestionCardComponent = class extends BaseComponent {
    surveyService = inject(SurveyService);
    questionData = null;
    index = 0;
    total = 0;
    unsubscribeScores;
    setQuestion(question, index, total) {
      this.questionData = question;
      this.index = index;
      this.total = total;
      this.render();
      this.initMetricRows();
    }
    ngOnInit() {
      this.unsubscribeScores = this.surveyService.onScoreChange(() => {
        if (this.questionData) {
          this.updateProgressBadge();
        }
      });
    }
    ngOnDestroy() {
      this.unsubscribeScores?.();
    }
    render() {
      if (!this.questionData) return;
      const q = this.questionData;
      const ratedCount = this.getRatedCount();
      const rawId = q.numericId !== void 0 ? q.numericId : parseInt(q.id, 10);
      const imageId = !isNaN(rawId) ? rawId : 1;
      const primaryUrl = `https://huggingface.co/datasets/SergCholovskyi/pipe-vqa/resolve/main/${imageId}.jpg`;
      const fallbackUrl = `https://huggingface.co/datasets/SergCholovskyi/pipe-vqa/resolve/main/1.jpg`;
      this.className = "block";
      this.innerHTML = `
      <div id="card-${q.id}" class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden transition-all">

        <!-- Card Header -->
        <div class="px-6 pt-6 pb-4 border-b border-slate-100">
          <div class="flex items-start justify-between gap-3 mb-3">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider shrink-0">
              Q${this.index + 1} / ${this.total} &nbsp;\xB7&nbsp; ${this.escape(q.category)}
            </span>
            <span id="badge-${q.id}" class="text-xs font-semibold shrink-0">
              ${this.badgeHtml(ratedCount)}
            </span>
          </div>

          <!-- Image Context Block (Full Content Width) -->
          <div class="mb-5 w-full">
            <div class="flex items-center justify-between mb-1.5">
              <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-lime-500"></span>
                Image Context
              </span>
              <span class="text-[10px] text-slate-400 font-mono">Dataset: SergCholovskyi/pipe-vqa</span>
            </div>

            <div class="w-full flex flex-col bg-slate-50 border border-slate-200/80 rounded-2xl p-3 sm:p-4 shadow-2xs">
              <div class="relative overflow-hidden rounded-xl bg-white border border-slate-200/60 w-full min-h-[180px] max-h-72 flex items-center justify-center p-2">
                <img 
                  id="img-${q.id}"
                  src="${primaryUrl}" 
                  alt="Image context for question #${imageId}" 
                  class="max-h-64 w-auto max-w-full object-contain rounded-lg transition-transform duration-200 hover:scale-[1.01]"
                  loading="lazy"
                  onerror="if(this.dataset.fallback !== 'true'){ this.dataset.fallback = 'true'; this.src = '${fallbackUrl}'; const a = document.getElementById('img-link-${q.id}'); if(a){ a.href = '${fallbackUrl}'; a.innerHTML = '<span>pipe-vqa/1.jpg (fallback)</span>'; } }"
                />
              </div>
              <div class="mt-2 px-1 flex items-center justify-between">
                <a 
                  id="img-link-${q.id}"
                  href="${primaryUrl}" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  class="text-xs font-medium text-slate-500 hover:text-slate-900 underline decoration-slate-300 underline-offset-2 flex items-center gap-1 transition-colors"
                >
                  <span>pipe-vqa/${imageId}.jpg</span>
                  <svg class="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
                <span class="text-[10px] text-slate-400 font-medium">Hugging Face CDN</span>
              </div>
            </div>
          </div>

          <!-- Generated Question -->
          <p class="text-base sm:text-lg font-bold text-slate-950 leading-snug mb-3">
            "${this.escape(q.description)}"
          </p>

          <!-- Target Answer pill -->
          <div class="inline-flex items-center gap-2 rounded-xl bg-lime-50 border border-lime-200/80 px-3 py-1.5">
            <span class="text-[10px] font-bold uppercase tracking-wider text-lime-700">Target Answer:</span>
            <span class="text-xs font-bold text-slate-800">${this.escape(q.targetAnswer)}</span>
          </div>
        </div>

        <!-- Metrics Body -->
        <div class="px-6 py-4 space-y-1">

          <!-- Scale legend -->
          <div class="flex items-center gap-4 mb-3 flex-wrap">
            <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Score scale:</span>
            <span class="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-500">
              <span class="w-5 h-5 rounded-lg bg-rose-500 flex items-center justify-center text-white text-[10px] font-bold">1</span>
              Low
            </span>
            <span class="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-500">
              <span class="w-5 h-5 rounded-lg bg-amber-400 flex items-center justify-center text-white text-[10px] font-bold">2</span>
              Medium
            </span>
            <span class="inline-flex items-center gap-1 text-[11px] font-semibold text-lime-600">
              <span class="w-5 h-5 rounded-lg bg-lime-500 flex items-center justify-center text-white text-[10px] font-bold">3</span>
              High
            </span>
          </div>

          <!-- Linguistic dimensions group -->
          <div class="mb-1">
            <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1.5">
              <span class="w-1 h-3 bg-slate-400 rounded-full inline-block"></span>
              Linguistic Dimensions
            </p>
            <div id="linguistic-rows-${q.id}" class="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden bg-white"></div>
          </div>

          <!-- Task-oriented dimensions group -->
          <div class="mt-3">
            <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1.5">
              <span class="w-1 h-3 bg-lime-500 rounded-full inline-block"></span>
              Task-Oriented Dimensions
            </p>
            <div id="task-rows-${q.id}" class="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden bg-white"></div>
          </div>

        </div>
      </div>
    `;
    }
    initMetricRows() {
      if (!this.questionData) return;
      const q = this.questionData;
      const linguisticContainer = this.$(`#linguistic-rows-${q.id}`);
      const taskContainer = this.$(`#task-rows-${q.id}`);
      QGEVAL_METRICS.forEach((metric) => {
        const row = document.createElement("app-qgeval-metric-row");
        row.id = `row-${q.id}-${metric.id}`;
        row.className = "block px-4";
        const container = metric.group === "linguistic" ? linguisticContainer : taskContainer;
        container?.appendChild(row);
        row.setProperties({
          questionId: q.id,
          metricId: metric.id,
          label: metric.label,
          labelUk: metric.labelUk,
          description: metric.description
        });
      });
    }
    getRatedCount() {
      if (!this.questionData) return 0;
      const scores = this.surveyService.getScores(this.questionData.id);
      return QGEVAL_METRICS.filter((m) => scores[m.id] !== void 0).length;
    }
    updateProgressBadge() {
      if (!this.questionData) return;
      const badge = this.$(`#badge-${this.questionData.id}`);
      if (badge) {
        badge.innerHTML = this.badgeHtml(this.getRatedCount());
      }
    }
    badgeHtml(ratedCount) {
      const total = QGEVAL_METRICS.length;
      const allDone = ratedCount === total;
      if (allDone) {
        return `<span class="inline-flex items-center gap-1 text-lime-700 font-bold"><span class="w-2 h-2 rounded-full bg-lime-500"></span>All ${total} rated \u2713</span>`;
      }
      if (ratedCount > 0) {
        return `<span class="inline-flex items-center gap-1 text-amber-600 font-semibold"><span class="w-2 h-2 rounded-full bg-amber-400"></span>${ratedCount}/${total} rated</span>`;
      }
      return `<span class="text-slate-400">Not rated yet</span>`;
    }
    escape(str) {
      return str ? str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") : "";
    }
  };
  QuestionCardComponent = __decorateClass([
    Component({
      selector: "app-question-card"
    })
  ], QuestionCardComponent);

  // src/client/components/survey-form/survey-form.component.ts
  var SurveyFormComponent = class extends BaseComponent {
    surveyService = inject(SurveyService);
    questions = [];
    totalQuestionsInDb = 1;
    currentQuestionId = 1;
    isLoading = true;
    isFetchingQuestion = false;
    errorMessage = "";
    unsubscribeScores;
    async ngOnInit() {
      this.unsubscribeScores = this.surveyService.onScoreChange(() => {
        this.updateButtonStates();
      });
      try {
        this.totalQuestionsInDb = await this.surveyService.getTotalQuestionsCount();
        this.questions = await this.surveyService.getQuestions();
        if (this.questions.length > 0) {
          const first = this.questions[0];
          const rawId = first.numericId !== void 0 ? first.numericId : parseInt(first.id, 10);
          this.currentQuestionId = !isNaN(rawId) && rawId > 0 ? rawId : 1;
        }
        this.isLoading = false;
        this.render();
        this.mountCurrentCard();
        this.bindNavEvents();
        this.updateButtonStates();
      } catch (err) {
        this.isLoading = false;
        this.errorMessage = err.message || "Error loading questionnaire";
        this.renderError();
      }
    }
    ngOnDestroy() {
      this.unsubscribeScores?.();
    }
    // ─── Shell render ─────────────────────────────────────────────────────────
    render() {
      if (this.isLoading) {
        this.innerHTML = `
        <div class="p-10 text-center bg-white rounded-2xl border border-slate-200 shadow-sm animate-pulse">
          <div class="w-8 h-8 border-3 border-lime-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p class="text-slate-600 text-sm font-semibold">\u0417\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0435\u043D\u043D\u044F \u043E\u043F\u0438\u0442\u0443\u0432\u0430\u043B\u044C\u043D\u0438\u043A\u0430\u2026</p>
        </div>`;
        return;
      }
      this.innerHTML = `
      <div>
        <!-- Header -->
        <div class="mb-6">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime-100 border border-lime-300/80 text-lime-900 text-xs font-semibold uppercase tracking-wider mb-3">
            <span class="w-2 h-2 rounded-full bg-lime-500 animate-pulse"></span>
            QGEval Scale: 1 \xB7 2 \xB7 3
          </div>
          <h1 class="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
            VQA Question Quality Evaluation
          </h1>
          <p class="mt-2 text-slate-600 text-sm sm:text-base leading-relaxed">
            \u041E\u0446\u0456\u043D\u0456\u0442\u044C <span class="font-semibold text-slate-900">${QGEVAL_METRICS.length} \u043C\u0435\u0442\u0440\u0438\u043A QGEval</span>
            (\u0448\u043A\u0430\u043B\u0430 1\u20133) \u0434\u043B\u044F \u0437\u0433\u0435\u043D\u0435\u0440\u043E\u0432\u0430\u043D\u043E\u0433\u043E \u0437\u0430\u043F\u0438\u0442\u0430\u043D\u043D\u044F. \u0412\u0438\u0431\u0435\u0440\u0456\u0442\u044C \u043F\u043E\u0442\u0440\u0456\u0431\u043D\u0438\u0439 \u0456\u043D\u0434\u0435\u043A\u0441 \u0434\u043B\u044F \u043F\u0435\u0440\u0435\u0433\u043B\u044F\u0434\u0443 \u0431\u0443\u0434\u044C-\u044F\u043A\u043E\u0433\u043E \u0437\u0430\u043F\u0438\u0442\u0430\u043D\u043D\u044F \u0437 \u0431\u0430\u0437\u0438.
          </p>
        </div>

        <!-- Question Index Selection Bar (Replaces old Progress Bar) -->
        <div class="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 mb-6 shadow-sm">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div>
              <label for="question-index-input" class="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-lime-500"></span>
                \u041D\u043E\u043C\u0435\u0440 / \u0406\u043D\u0434\u0435\u043A\u0441 \u0437\u0430\u043F\u0438\u0442\u0430\u043D\u043D\u044F \u0432 \u0431\u0430\u0437\u0456 \u0434\u0430\u043D\u0438\u0445
              </label>
              <p class="text-xs text-slate-500 mt-0.5">
                \u0412\u0432\u0435\u0434\u0456\u0442\u044C \u0456\u043D\u0434\u0435\u043A\u0441 \u0432\u0456\u0434 <span class="font-bold text-slate-900">1</span> \u0434\u043E <span id="max-questions-count" class="font-bold text-slate-900">${this.totalQuestionsInDb}</span> \u0434\u043B\u044F \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0435\u043D\u043D\u044F \u0437 MongoDB
              </p>
            </div>
            
            <div class="flex items-center gap-2 self-start sm:self-auto">
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200/60">
                \u0412\u0441\u044C\u043E\u0433\u043E \u0432 \u0411\u0414: <strong id="db-total-badge" class="font-bold text-slate-950">${this.totalQuestionsInDb}</strong>
              </span>
            </div>
          </div>

          <!-- Input + Controls Bar -->
          <div class="flex flex-wrap items-center gap-2.5">
            <div class="relative flex-1 min-w-[140px] max-w-xs">
              <input
                type="number"
                id="question-index-input"
                min="1"
                max="${this.totalQuestionsInDb}"
                value="${this.currentQuestionId}"
                class="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-900 text-sm focus:bg-white focus:border-slate-400 transition-colors"
                placeholder="\u0412\u0432\u0435\u0434\u0456\u0442\u044C \u0456\u043D\u0434\u0435\u043A\u0441..."
              />
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold pointer-events-none">
                #
              </span>
            </div>

            <button
              type="button"
              id="load-question-btn"
              class="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>\u0417\u043D\u0430\u0439\u0442\u0438 \u0432 \u0411\u0414</span>
            </button>

            <!-- Quick Step Prev / Next Buttons -->
            <button
              type="button"
              id="step-prev-btn"
              title="\u041F\u043E\u043F\u0435\u0440\u0435\u0434\u043D\u0454 \u043F\u0438\u0442\u0430\u043D\u043D\u044F (ID - 1)"
              class="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all active:scale-95 cursor-pointer"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              id="step-next-btn"
              title="\u041D\u0430\u0441\u0442\u0443\u043F\u043D\u0435 \u043F\u0438\u0442\u0430\u043D\u043D\u044F (ID + 1)"
              class="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all active:scale-95 cursor-pointer"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              type="button"
              id="random-question-btn"
              class="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all active:scale-95 cursor-pointer ml-auto"
            >
              <span>\u{1F3B2}</span>
              <span class="hidden sm:inline">\u0412\u0438\u043F\u0430\u0434\u043A\u043E\u0432\u0435</span>
            </button>
          </div>

          <!-- Inline error message -->
          <div id="index-error-msg" class="hidden mt-2.5 text-xs font-semibold text-rose-600 flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span id="index-error-text"></span>
          </div>

          <!-- Loading indicator -->
          <div id="index-loading-msg" class="hidden mt-2.5 text-xs font-semibold text-slate-500 flex items-center gap-2">
            <div class="w-3 h-3 border-2 border-lime-500 border-t-transparent rounded-full animate-spin"></div>
            <span>\u0417\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0435\u043D\u043D\u044F \u0437\u0430\u043F\u0438\u0442\u0430\u043D\u043D\u044F \u0437 \u0431\u0430\u0437\u0438 \u0434\u0430\u043D\u0438\u0445...</span>
          </div>
        </div>

        <!-- Single question card slot -->
        <div id="card-slot" class="mb-6"></div>

        <!-- Error message for submission -->
        <p id="form-error" class="hidden text-rose-600 text-xs text-center font-medium mb-3"></p>

        <!-- Navigation buttons -->
        <div class="flex items-center gap-3">

          <!-- Prev button -->
          <button
            type="button"
            id="prev-btn"
            class="flex items-center gap-2 px-5 py-3.5 rounded-xl border-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
            Prev (#${this.currentQuestionId > 1 ? this.currentQuestionId - 1 : 1})
          </button>

          <!-- Finish / Submit button -->
          <button
            type="button"
            id="finish-btn"
            class="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-lime-400 hover:bg-lime-500 text-slate-950 font-bold text-sm transition-all duration-150 shadow-md shadow-lime-400/25 hover:shadow-lime-400/40 active:scale-[0.99] cursor-pointer focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-2"
          >
            <svg class="w-4 h-4 text-lime-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
            </svg>
            \u0417\u0431\u0435\u0440\u0435\u0433\u0442\u0438 \u043E\u0446\u0456\u043D\u043A\u0443
          </button>

          <!-- Next button -->
          <button
            type="button"
            id="next-btn"
            class="flex items-center gap-2 px-5 py-3.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-sm transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-lime-400/40 shadow-md"
          >
            Next (#${this.currentQuestionId + 1})
            <svg class="w-4 h-4 text-lime-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
            </svg>
          </button>

        </div>
      </div>
    `;
    }
    renderError() {
      this.innerHTML = `
      <div class="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center">
        <p class="text-rose-700 font-semibold text-sm">${this.escape(this.errorMessage)}</p>
        <button id="retry-btn" class="mt-3 px-4 py-2 bg-rose-600 text-white text-xs rounded-xl font-bold">\u0421\u043F\u0440\u043E\u0431\u0443\u0432\u0430\u0442\u0438 \u0437\u043D\u043E\u0432\u0443</button>
      </div>`;
      this.$("#retry-btn")?.addEventListener("click", () => location.reload());
    }
    // ─── Mount the card for the current question ──────────────────────────────
    mountCurrentCard() {
      const slot = this.$("#card-slot");
      if (!slot) return;
      slot.innerHTML = "";
      const q = this.questions[0];
      if (!q) {
        slot.innerHTML = `
        <div class="p-8 text-center bg-white border border-slate-200 rounded-2xl">
          <p class="text-slate-500 text-sm">\u0417\u0430\u043F\u0438\u0442\u0430\u043D\u043D\u044F \u043D\u0435 \u0437\u043D\u0430\u0439\u0434\u0435\u043D\u043E.</p>
        </div>`;
        return;
      }
      const card = document.createElement("app-question-card");
      card.id = `qcard-${q.id}`;
      slot.appendChild(card);
      card.setQuestion(q, this.currentQuestionId - 1, this.totalQuestionsInDb);
    }
    // ─── Event bindings ───────────────────────────────────────────────────────
    bindNavEvents() {
      const inputEl = this.$("#question-index-input");
      const loadBtn = this.$("#load-question-btn");
      const stepPrevBtn = this.$("#step-prev-btn");
      const stepNextBtn = this.$("#step-next-btn");
      const randomBtn = this.$("#random-question-btn");
      const prevBtn = this.$("#prev-btn");
      const nextBtn = this.$("#next-btn");
      const finishBtn = this.$("#finish-btn");
      const handleLoadFromInput = () => {
        if (!inputEl) return;
        const val = parseInt(inputEl.value, 10);
        if (isNaN(val)) {
          this.showIndexError("\u0411\u0443\u0434\u044C \u043B\u0430\u0441\u043A\u0430, \u0432\u0432\u0435\u0434\u0456\u0442\u044C \u043A\u043E\u0440\u0435\u043A\u0442\u043D\u0438\u0439 \u0447\u0438\u0441\u043B\u043E\u0432\u0438\u0439 \u0456\u043D\u0434\u0435\u043A\u0441");
          return;
        }
        this.loadQuestionById(val);
      };
      loadBtn?.addEventListener("click", handleLoadFromInput);
      inputEl?.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          handleLoadFromInput();
        }
      });
      stepPrevBtn?.addEventListener("click", () => {
        if (this.currentQuestionId > 1) {
          this.loadQuestionById(this.currentQuestionId - 1);
        }
      });
      stepNextBtn?.addEventListener("click", () => {
        this.loadQuestionById(this.currentQuestionId + 1);
      });
      randomBtn?.addEventListener("click", () => {
        const max = Math.max(1, this.totalQuestionsInDb);
        const randomId = Math.floor(Math.random() * max) + 1;
        this.loadQuestionById(randomId);
      });
      prevBtn?.addEventListener("click", () => {
        if (this.currentQuestionId > 1) {
          this.loadQuestionById(this.currentQuestionId - 1);
        }
      });
      nextBtn?.addEventListener("click", () => {
        this.loadQuestionById(this.currentQuestionId + 1);
      });
      finishBtn?.addEventListener("click", () => this.handleFinish());
    }
    /**
     * Loads a question by its index from MongoDB
     */
    async loadQuestionById(index) {
      if (this.isFetchingQuestion) return;
      if (index < 1) {
        this.showIndexError("\u0406\u043D\u0434\u0435\u043A\u0441 \u0437\u0430\u043F\u0438\u0442\u0430\u043D\u043D\u044F \u043C\u0430\u0454 \u0431\u0443\u0442\u0438 \u043D\u0435 \u043C\u0435\u043D\u0448\u0435 1");
        return;
      }
      if (this.totalQuestionsInDb > 0 && index > this.totalQuestionsInDb) {
        this.showIndexError(`\u0406\u043D\u0434\u0435\u043A\u0441 ${index} \u043F\u0435\u0440\u0435\u0432\u0438\u0449\u0443\u0454 \u0437\u0430\u0433\u0430\u043B\u044C\u043D\u0443 \u043A\u0456\u043B\u044C\u043A\u0456\u0441\u0442\u044C \u0437\u0430\u043F\u0438\u0442\u0430\u043D\u044C \u0443 \u0411\u0414 (${this.totalQuestionsInDb})`);
        return;
      }
      this.hideIndexError();
      this.showIndexLoading(true);
      this.isFetchingQuestion = true;
      try {
        const q = await this.surveyService.fetchQuestionByIndex(index);
        this.questions = [q];
        this.currentQuestionId = index;
        const inputEl = this.$("#question-index-input");
        if (inputEl) inputEl.value = index.toString();
        this.mountCurrentCard();
        this.updateButtonStates();
        this.$("#card-slot")?.scrollIntoView({ behavior: "smooth", block: "start" });
      } catch (err) {
        this.showIndexError(err.message || `\u041D\u0435 \u0432\u0434\u0430\u043B\u043E\u0441\u044F \u043E\u0442\u0440\u0438\u043C\u0430\u0442\u0438 \u043F\u0438\u0442\u0430\u043D\u043D\u044F #${index}`);
      } finally {
        this.showIndexLoading(false);
        this.isFetchingQuestion = false;
      }
    }
    showIndexError(message) {
      const errBox = this.$("#index-error-msg");
      const errText = this.$("#index-error-text");
      if (errBox && errText) {
        errText.textContent = message;
        errBox.classList.remove("hidden");
      }
    }
    hideIndexError() {
      const errBox = this.$("#index-error-msg");
      if (errBox) {
        errBox.classList.add("hidden");
      }
    }
    showIndexLoading(show) {
      const loader = this.$("#index-loading-msg");
      if (!loader) return;
      if (show) {
        loader.classList.remove("hidden");
      } else {
        loader.classList.add("hidden");
      }
    }
    updateButtonStates() {
      const prevBtn = this.$("#prev-btn");
      const nextBtn = this.$("#next-btn");
      const stepPrevBtn = this.$("#step-prev-btn");
      const stepNextBtn = this.$("#step-next-btn");
      const isFirst = this.currentQuestionId <= 1;
      const isLast = this.totalQuestionsInDb > 0 && this.currentQuestionId >= this.totalQuestionsInDb;
      if (prevBtn) {
        prevBtn.disabled = isFirst;
        prevBtn.innerHTML = `
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
        </svg>
        Prev (#${this.currentQuestionId > 1 ? this.currentQuestionId - 1 : 1})
      `;
      }
      if (stepPrevBtn) {
        stepPrevBtn.disabled = isFirst;
        if (isFirst) {
          stepPrevBtn.classList.add("opacity-40", "cursor-not-allowed");
        } else {
          stepPrevBtn.classList.remove("opacity-40", "cursor-not-allowed");
        }
      }
      if (nextBtn) {
        nextBtn.disabled = isLast;
        nextBtn.innerHTML = `
        Next (#${this.currentQuestionId + 1})
        <svg class="w-4 h-4 text-lime-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
        </svg>
      `;
        if (isLast) {
          nextBtn.classList.add("opacity-40", "cursor-not-allowed");
        } else {
          nextBtn.classList.remove("opacity-40", "cursor-not-allowed");
        }
      }
      if (stepNextBtn) {
        stepNextBtn.disabled = isLast;
        if (isLast) {
          stepNextBtn.classList.add("opacity-40", "cursor-not-allowed");
        } else {
          stepNextBtn.classList.remove("opacity-40", "cursor-not-allowed");
        }
      }
    }
    // ─── Finish / Submit ──────────────────────────────────────────────────────
    async handleFinish() {
      const errorEl = this.$("#form-error");
      const currentQ = this.questions[0];
      if (!currentQ) return;
      const scores = this.surveyService.getScores(currentQ.id);
      const missingMetrics = QGEVAL_METRICS.filter((m) => scores[m.id] === void 0);
      if (missingMetrics.length > 0) {
        const missingLabel = missingMetrics[0]?.labelUk || missingMetrics[0]?.label;
        if (errorEl) {
          errorEl.textContent = `\u0411\u0443\u0434\u044C \u043B\u0430\u0441\u043A\u0430, \u043E\u0446\u0456\u043D\u0456\u0442\u044C "${missingLabel}" \u043F\u0435\u0440\u0435\u0434 \u0437\u0431\u0435\u0440\u0435\u0436\u0435\u043D\u043D\u044F\u043C.`;
          errorEl.classList.remove("hidden");
        }
        return;
      }
      if (errorEl) errorEl.classList.add("hidden");
      const finishBtn = this.$("#finish-btn");
      if (finishBtn) {
        finishBtn.disabled = true;
        finishBtn.innerHTML = `
        <div class="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
        <span>\u0417\u0431\u0435\u0440\u0435\u0436\u0435\u043D\u043D\u044F\u2026</span>
      `;
      }
      try {
        await this.surveyService.submitSurvey({
          answers: [{ questionId: currentQ.id, scores }]
        });
        if (finishBtn) {
          finishBtn.innerHTML = `
          <svg class="w-4 h-4 text-lime-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
          </svg>
          \u0417\u0431\u0435\u0440\u0435\u0436\u0435\u043D\u043E \u0443\u0441\u043F\u0456\u0448\u043D\u043E! \u2713
        `;
        }
        setTimeout(() => {
          if (this.currentQuestionId < this.totalQuestionsInDb) {
            this.loadQuestionById(this.currentQuestionId + 1);
          } else {
            this.surveyService.setView("results");
          }
        }, 1e3);
      } catch (err) {
        if (errorEl) {
          errorEl.textContent = `\u041F\u043E\u043C\u0438\u043B\u043A\u0430 \u0437\u0431\u0435\u0440\u0435\u0436\u0435\u043D\u043D\u044F: ${err.message}`;
          errorEl.classList.remove("hidden");
        }
        if (finishBtn) {
          finishBtn.disabled = false;
          finishBtn.innerHTML = `
          <svg class="w-4 h-4 text-lime-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
          </svg>
          \u0417\u0431\u0435\u0440\u0435\u0433\u0442\u0438 \u043E\u0446\u0456\u043D\u043A\u0443
        `;
        }
      }
    }
    escape(str) {
      return str ? str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") : "";
    }
  };
  SurveyFormComponent = __decorateClass([
    Component({
      selector: "app-survey-form"
    })
  ], SurveyFormComponent);

  // src/client/components/results-view/results-view.component.ts
  var ResultsViewComponent = class extends BaseComponent {
    surveyService = inject(SurveyService);
    resultsData = null;
    isLoading = true;
    // Selected question number for summarized analytics (1 .. totalQuestionsCount)
    selectedQuestionNumber = 1;
    totalQuestionsCount = 1;
    // Detailed answers state for the selected question
    isAnswersExpanded = false;
    isLoadingAnswers = false;
    questionAnswers = [];
    answersCache = /* @__PURE__ */ new Map();
    questionInfoCache = /* @__PURE__ */ new Map();
    async ngOnInit() {
      await this.loadData();
    }
    async loadData() {
      this.isLoading = true;
      this.renderLoading();
      try {
        const [results, totalCount] = await Promise.all([
          this.surveyService.getResults(),
          this.surveyService.getTotalQuestionsCount()
        ]);
        this.resultsData = results;
        this.totalQuestionsCount = Math.max(totalCount || 1, 1);
        this.isLoading = false;
        if (this.resultsData.questionStats) {
          for (const stat of this.resultsData.questionStats) {
            const num = parseInt(stat.questionId, 10);
            if (!isNaN(num)) {
              this.questionInfoCache.set(num, {
                question: stat.questionText || "",
                answer: stat.targetAnswer || ""
              });
            }
          }
        }
        if (this.resultsData.questionStats && this.resultsData.questionStats.length > 0) {
          const firstWithStats = parseInt(this.resultsData.questionStats[0].questionId, 10);
          if (!isNaN(firstWithStats)) {
            this.selectedQuestionNumber = firstWithStats;
          }
        }
        if (this.selectedQuestionNumber < 1) this.selectedQuestionNumber = 1;
        if (this.selectedQuestionNumber > this.totalQuestionsCount) {
          this.selectedQuestionNumber = this.totalQuestionsCount;
        }
        this.render();
        this.bindEvents();
        this.fetchQuestionInfoIfNeeded(this.selectedQuestionNumber);
      } catch (err) {
        this.isLoading = false;
        this.innerHTML = `
        <div class="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-center">
          <p class="text-rose-700 font-bold text-base mb-1">\u041F\u043E\u043C\u0438\u043B\u043A\u0430 \u0437\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0435\u043D\u043D\u044F \u0441\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u0438</p>
          <p class="text-rose-600 text-xs mb-4">\u041D\u0435 \u0432\u0434\u0430\u043B\u043E\u0441\u044F \u043E\u0442\u0440\u0438\u043C\u0430\u0442\u0438 \u0434\u0430\u043D\u0456 \u0437 \u0441\u0435\u0440\u0432\u0435\u0440\u0430. \u041F\u0435\u0440\u0435\u0432\u0456\u0440\u0442\u0435 \u0437'\u0454\u0434\u043D\u0430\u043D\u043D\u044F \u0437 \u0431\u0430\u0437\u043E\u044E \u0434\u0430\u043D\u0438\u0445.</p>
          <button id="res-retry-btn" class="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs rounded-xl font-bold transition-all shadow-sm cursor-pointer">\u0421\u043F\u0440\u043E\u0431\u0443\u0432\u0430\u0442\u0438 \u0437\u043D\u043E\u0432\u0443</button>
        </div>
      `;
        this.$("#res-retry-btn")?.addEventListener("click", () => this.loadData());
      }
    }
    renderLoading() {
      this.innerHTML = `
      <div class="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm animate-pulse">
        <div class="w-10 h-10 border-3 border-lime-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p class="text-slate-800 font-bold text-sm">\u041E\u043D\u043E\u0432\u043B\u0435\u043D\u043D\u044F \u0430\u043D\u0430\u043B\u0456\u0442\u0438\u043A\u0438 Live Score\u2026</p>
        <p class="text-slate-400 text-xs mt-1">\u041E\u0442\u0440\u0438\u043C\u0430\u043D\u043D\u044F \u043E\u0441\u0442\u0430\u043D\u043D\u0456\u0445 \u0432\u0456\u0434\u043F\u043E\u0432\u0456\u0434\u0435\u0439 \u0442\u0430 \u043C\u0435\u0442\u0440\u0438\u043A \u0456\u0437 \u0431\u0430\u0437\u0438 \u0434\u0430\u043D\u0438\u0445</p>
      </div>
    `;
    }
    render() {
      if (!this.resultsData) return;
      const data = this.resultsData;
      const globalMetricsHtml = data.globalMetricAverages.map((m) => {
        const pct = Math.round((m.averageScore - 1) / 2 * 100);
        const colorClass = m.averageScore >= 2.5 ? "bg-lime-500" : m.averageScore >= 1.75 ? "bg-amber-400" : "bg-rose-500";
        return `
          <div class="flex items-center gap-3 py-2">
            <div class="w-44 shrink-0">
              <p class="text-xs font-semibold text-slate-800 truncate">${this.escape(m.label)}</p>
              <p class="text-[10px] text-slate-400">${this.escape(m.labelUk)}</p>
            </div>
            <div class="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
              <div class="${colorClass} h-2 rounded-full transition-all duration-500" style="width: ${pct}%;"></div>
            </div>
            <span class="text-sm font-bold text-slate-900 w-9 text-right">${m.averageScore.toFixed(2)}</span>
            <span class="text-xs text-slate-400 font-medium">/3</span>
          </div>
        `;
      }).join('<div class="border-t border-slate-100"></div>');
      const recentAnswers = data.recentAnswers || [];
      let recentFeedHtml = "";
      if (recentAnswers.length === 0) {
        recentFeedHtml = `
        <div class="p-8 text-center bg-slate-50 border border-slate-200/80 rounded-2xl">
          <p class="text-slate-500 text-sm font-medium">\u0423 \u0431\u0430\u0437\u0456 \u0434\u0430\u043D\u0438\u0445 \u0449\u0435 \u043D\u0435\u043C\u0430\u0454 \u0437\u0431\u0435\u0440\u0435\u0436\u0435\u043D\u0438\u0445 \u0432\u0456\u0434\u043F\u043E\u0432\u0456\u0434\u0435\u0439.</p>
          <p class="text-slate-400 text-xs mt-1">\u041F\u0440\u043E\u0439\u0434\u0456\u0442\u044C \u043E\u043F\u0438\u0442\u0443\u0432\u0430\u043D\u043D\u044F, \u0449\u043E\u0431 \u043F\u043E\u0431\u0430\u0447\u0438\u0442\u0438 \u043F\u0435\u0440\u0448\u0456 \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442\u0438.</p>
        </div>
      `;
      } else {
        recentFeedHtml = `
        <div class="space-y-3.5">
          ${recentAnswers.map((ans) => {
          const scores = ans.score || {};
          const metricKeys = Object.keys(scores);
          const scoreValues = metricKeys.map((k) => scores[k]).filter((v) => typeof v === "number");
          const avgScore = scoreValues.length > 0 ? (scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length).toFixed(2) : "\u2014";
          const avgColor = Number(avgScore) >= 2.5 ? "text-lime-600 bg-lime-50 border-lime-200" : Number(avgScore) >= 1.75 ? "text-amber-600 bg-amber-50 border-amber-200" : "text-rose-600 bg-rose-50 border-rose-200";
          const metricPills = QGEVAL_METRICS.map((metric) => {
            const score = scores[metric.id];
            if (score === void 0) return "";
            const pillColor = score === 3 ? "bg-lime-100 text-lime-800 border-lime-300" : score === 2 ? "bg-amber-100 text-amber-800 border-amber-300" : "bg-rose-100 text-rose-800 border-rose-300";
            return `
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${pillColor}" title="${this.escape(metric.labelUk)}">
                    <span class="text-slate-600">${this.escape(metric.label)}:</span>
                    <span class="font-bold">${score}</span>
                  </span>
                `;
          }).join("");
          return `
                <div class="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-2xs hover:shadow-xs transition-all">
                  <div class="flex flex-wrap items-start justify-between gap-2 mb-2">
                    <div class="flex items-center gap-2">
                      <span class="px-2.5 py-0.5 rounded-lg text-xs font-extrabold bg-slate-900 text-white">
                        #${this.escape(String(ans.questionId))}
                      </span>
                      <span class="text-xs font-semibold text-slate-800">
                        ${this.escape(ans.respondentName || "Anonymous")}
                      </span>
                      <span class="text-[11px] text-slate-400">
                        \u2022 ${this.formatDate(ans.createdAt || "")}
                      </span>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="text-[11px] font-bold px-2 py-0.5 rounded-lg border ${avgColor}">
                        \u0421\u0435\u0440\u0435\u0434\u043D\u0456\u0439 \u0431\u0430\u043B: ${avgScore} / 3
                      </span>
                      <button 
                        type="button" 
                        class="recent-select-btn px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                        data-qid="${this.escape(String(ans.questionId))}"
                      >
                        \u0410\u043D\u0430\u043B\u0456\u0437\u0443\u0432\u0430\u0442\u0438 \u043F\u0438\u0442\u0430\u043D\u043D\u044F \u2192
                      </button>
                    </div>
                  </div>

                  <p class="text-xs text-slate-700 font-medium line-clamp-2 mb-2.5">
                    <span class="text-slate-400 font-normal">\u041F\u0438\u0442\u0430\u043D\u043D\u044F:</span> "${this.escape(ans.question || "")}"
                  </p>

                  <div class="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
                    ${metricPills}
                  </div>

                  ${ans.feedback ? `
                    <div class="mt-2.5 pt-2 border-t border-slate-100 text-xs text-slate-600 italic bg-slate-50/70 p-2.5 rounded-xl border border-slate-200/50">
                      <span class="font-semibold not-italic text-slate-500">\u041A\u043E\u043C\u0435\u043D\u0442\u0430\u0440:</span> "${this.escape(ans.feedback)}"
                    </div>
                  ` : ""}
                </div>
              `;
        }).join("")}
        </div>
      `;
      }
      const questionStats = data.questionStats || [];
      const currentQNumber = this.selectedQuestionNumber;
      const selectedStat = questionStats.find(
        (q) => Number(q.questionId) === currentQNumber
      );
      const cachedInfo = this.questionInfoCache.get(currentQNumber);
      let questionDetailsHtml = "";
      if (!selectedStat || selectedStat.count === 0) {
        questionDetailsHtml = `
        <div class="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 transition-all">
          <!-- Question Header Preview -->
          <div class="flex items-center gap-2 mb-2">
            <span class="px-2.5 py-0.5 rounded-lg text-xs font-extrabold bg-slate-900 text-white">
              Question #${currentQNumber}
            </span>
            <span class="text-xs text-slate-400 font-semibold">\u2022 LORA VQA</span>
          </div>

          ${cachedInfo?.question ? `
            <h4 class="font-bold text-slate-900 text-sm sm:text-base mt-1">
              "${this.escape(cachedInfo.question)}"
            </h4>
          ` : `
            <h4 class="font-bold text-slate-400 text-sm italic mt-1">
              \u041F\u0438\u0442\u0430\u043D\u043D\u044F #${currentQNumber}
            </h4>
          `}

          ${cachedInfo?.answer ? `
            <p class="text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80 inline-block mt-2">
              <span class="font-semibold text-slate-500">\u{1F3AF} \u0426\u0456\u043B\u044C\u043E\u0432\u0430 \u0432\u0456\u0434\u043F\u043E\u0432\u0456\u0434\u044C:</span> ${this.escape(cachedInfo.answer)}
            </p>
          ` : ""}

          <!-- Empty score placeholder -->
          <div class="mt-6 p-8 text-center bg-slate-50/80 border-2 border-dashed border-slate-200 rounded-2xl">
            <div class="w-12 h-12 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-center mx-auto mb-3 text-amber-600 shadow-2xs">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
            <h4 class="text-base font-extrabold text-slate-900 mb-1">No Score for this question</h4>
            <p class="text-xs text-slate-500 max-w-sm mx-auto">
              \u0414\u043B\u044F \u043F\u0438\u0442\u0430\u043D\u043D\u044F #${currentQNumber} \u0449\u0435 \u043D\u0435\u043C\u0430\u0454 \u0432\u0438\u0441\u0442\u0430\u0432\u043B\u0435\u043D\u0438\u0445 \u043E\u0446\u0456\u043D\u043E\u043A \u0430\u0431\u043E \u0437\u0431\u0435\u0440\u0435\u0436\u0435\u043D\u0438\u0445 \u0432\u0456\u0434\u043F\u043E\u0432\u0456\u0434\u0435\u0439 \u0443 \u0431\u0430\u0437\u0456 \u0434\u0430\u043D\u0438\u0445.
            </p>
            <div class="mt-4">
              <button id="res-rate-this-btn" class="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer">
                \u041E\u0446\u0456\u043D\u0438\u0442\u0438 \u0446\u0435 \u043F\u0438\u0442\u0430\u043D\u043D\u044F \u0437\u0430\u0440\u0430\u0437 \u2192
              </button>
            </div>
          </div>
        </div>
      `;
      } else {
        const overallColor = selectedStat.overallAverage >= 2.5 ? "text-lime-600" : selectedStat.overallAverage >= 1.75 ? "text-amber-600" : "text-rose-500";
        const metricsMapHtml = selectedStat.metrics.map((m) => {
          const dist = [1, 2, 3].map((s) => {
            const item = m.distribution.find((d) => d.score === s);
            return { score: s, count: item?.count ?? 0, pct: item?.percentage ?? 0 };
          });
          const barColors = ["bg-rose-400", "bg-amber-400", "bg-lime-500"];
          const barsHtml = dist.map((d, i) => {
            const h = Math.max(d.pct, 4);
            return `
              <div class="flex-1 flex flex-col items-center gap-0.5 group relative">
                <div class="w-full bg-slate-100 rounded h-11 flex items-end p-0.5">
                  <div class="w-full ${barColors[i]} rounded transition-all duration-500" style="height:${h}%;"></div>
                </div>
                <span class="text-[9px] font-bold text-slate-500">${d.score}</span>
                <div class="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-900 text-white text-[10px] px-1.5 py-0.5 rounded shadow whitespace-nowrap z-10">
                  ${d.count} (${d.pct}%)
                </div>
              </div>
            `;
          }).join("");
          const avgColor = m.averageScore >= 2.5 ? "text-lime-600" : m.averageScore >= 1.75 ? "text-amber-600" : "text-rose-500";
          return `
          <div class="py-2.5 px-4 flex items-center gap-3">
            <div class="w-40 shrink-0">
              <p class="text-xs font-semibold text-slate-800">${this.escape(m.label)}</p>
              <p class="text-[10px] text-slate-400">${this.escape(m.labelUk)}</p>
            </div>
            <div class="flex gap-1 w-24 shrink-0">
              ${barsHtml}
            </div>
            <div class="ml-auto text-right">
              <span class="text-base font-extrabold ${avgColor}">${m.averageScore.toFixed(2)}</span>
              <span class="text-xs text-slate-400 font-medium">/3</span>
            </div>
          </div>
        `;
        });
        const linguisticMetrics = QGEVAL_METRICS.filter((m) => m.group === "linguistic").map((m) => m.id);
        const linguisticHtml = selectedStat.metrics.filter((m) => linguisticMetrics.includes(m.metricId)).map(
          (m, i, arr) => metricsMapHtml[selectedStat.metrics.indexOf(m)] + (i < arr.length - 1 ? '<div class="border-t border-slate-100 mx-4"></div>' : "")
        ).join("");
        const taskHtml = selectedStat.metrics.filter((m) => !linguisticMetrics.includes(m.metricId)).map(
          (m, i, arr) => metricsMapHtml[selectedStat.metrics.indexOf(m)] + (i < arr.length - 1 ? '<div class="border-t border-slate-100 mx-4"></div>' : "")
        ).join("");
        let answersListContent = "";
        if (this.isAnswersExpanded) {
          if (this.isLoadingAnswers) {
            answersListContent = `
            <div class="p-8 text-center bg-slate-50 border-t border-slate-100">
              <div class="w-6 h-6 border-2 border-lime-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p class="text-xs text-slate-500 font-medium">\u0417\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0435\u043D\u043D\u044F \u0432\u0441\u0456\u0445 \u0432\u0456\u0434\u043F\u043E\u0432\u0456\u0434\u0435\u0439 \u0434\u043B\u044F \u043F\u0438\u0442\u0430\u043D\u043D\u044F #${this.escape(selectedStat.questionId)}\u2026</p>
            </div>
          `;
          } else if (this.questionAnswers.length === 0) {
            answersListContent = `
            <div class="p-6 text-center bg-slate-50 border-t border-slate-100 text-xs text-slate-500">
              \u041D\u0435 \u0437\u043D\u0430\u0439\u0434\u0435\u043D\u043E \u0437\u0431\u0435\u0440\u0435\u0436\u0435\u043D\u0438\u0445 \u0456\u043D\u0434\u0438\u0432\u0456\u0434\u0443\u0430\u043B\u044C\u043D\u0438\u0445 \u0437\u0430\u043F\u0438\u0441\u0456\u0432 \u0432\u0456\u0434\u043F\u043E\u0432\u0456\u0434\u0435\u0439 \u0434\u043B\u044F \u0446\u044C\u043E\u0433\u043E \u043F\u0438\u0442\u0430\u043D\u043D\u044F.
            </div>
          `;
          } else {
            answersListContent = `
            <div class="border-t border-slate-200 bg-slate-50/50 p-4 sm:p-6 space-y-4">
              <div class="flex items-center justify-between pb-2 border-b border-slate-200/80">
                <h5 class="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <svg class="w-4 h-4 text-lime-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                  \u0412\u0441\u0456 \u043D\u0430\u0434\u0430\u043D\u0456 \u0432\u0456\u0434\u043F\u043E\u0432\u0456\u0434\u0456 (${this.questionAnswers.length})
                </h5>
                <span class="text-[11px] text-slate-400">\u0421\u043E\u0440\u0442\u0443\u0432\u0430\u043D\u043D\u044F: \u0432\u0456\u0434 \u043D\u0430\u0439\u043D\u043E\u0432\u0456\u0448\u0438\u0445</span>
              </div>

              <div class="space-y-3">
                ${this.questionAnswers.map((item, idx) => {
              const scores = item.score || {};
              const scoreValues = Object.keys(scores).map((k) => scores[k]).filter((v) => typeof v === "number");
              const singleAvg = scoreValues.length > 0 ? (scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length).toFixed(2) : "\u2014";
              const itemPills = QGEVAL_METRICS.map((metric) => {
                const score = scores[metric.id];
                if (score === void 0) return "";
                const badgeBg = score === 3 ? "bg-lime-100 text-lime-800 border-lime-300" : score === 2 ? "bg-amber-100 text-amber-800 border-amber-300" : "bg-rose-100 text-rose-800 border-rose-300";
                return `
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${badgeBg}">
                          <span class="text-slate-600">${this.escape(metric.label)}:</span>
                          <span class="font-bold">${score}</span>
                        </span>
                      `;
              }).join("");
              return `
                      <div class="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
                        <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <div class="flex items-center gap-2">
                            <span class="w-6 h-6 rounded-full bg-slate-900 text-white text-[10px] font-extrabold flex items-center justify-center">
                              ${idx + 1}
                            </span>
                            <span class="font-bold text-xs text-slate-850">
                              ${this.escape(item.respondentName || "Anonymous")}
                            </span>
                            <span class="text-[11px] text-slate-400">
                              \u2022 ${this.formatDate(item.createdAt || "")}
                            </span>
                          </div>
                          <div class="px-2 py-0.5 rounded-md text-xs font-extrabold bg-slate-100 text-slate-800 border border-slate-200">
                            \u0421\u0435\u0440. \u0431\u0430\u043B: ${singleAvg} / 3
                          </div>
                        </div>

                        <div class="flex flex-wrap gap-1.5 pt-1.5 pb-1">
                          ${itemPills}
                        </div>

                        ${item.feedback ? `
                          <div class="mt-2 pt-2 border-t border-slate-100 text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                            <span class="font-semibold not-italic text-slate-500">\u041A\u043E\u043C\u0435\u043D\u0442\u0430\u0440:</span> "${this.escape(item.feedback)}"
                          </div>
                        ` : ""}
                      </div>
                    `;
            }).join("")}
              </div>
            </div>
          `;
          }
        }
        questionDetailsHtml = `
        <div class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden transition-all">
          <!-- Card header -->
          <div class="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <span class="px-2.5 py-0.5 rounded-lg text-xs font-extrabold bg-lime-400 text-slate-950">
                  Question #${this.escape(selectedStat.questionId)}
                </span>
                <span class="text-xs text-slate-400 font-semibold">\u2022 ${selectedStat.count} ${this.formatCountUa(selectedStat.count)}</span>
              </div>
              <h4 class="font-bold text-slate-950 text-sm sm:text-base mt-1">
                "${this.escape(selectedStat.questionText || cachedInfo?.question || selectedStat.title)}"
              </h4>
              ${selectedStat.targetAnswer || cachedInfo?.answer ? `
                <p class="text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80 inline-block mt-1">
                  <span class="font-semibold text-slate-500">\u{1F3AF} \u0426\u0456\u043B\u044C\u043E\u0432\u0430 \u0432\u0456\u0434\u043F\u043E\u0432\u0456\u0434\u044C:</span> ${this.escape(selectedStat.targetAnswer || cachedInfo?.answer || "")}
                </p>
              ` : ""}
            </div>
            <div class="text-right shrink-0 bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-0 border-slate-200 flex sm:flex-col items-center sm:items-end justify-between sm:justify-start">
              <span class="text-[11px] text-slate-400 font-medium">\u0417\u0430\u0433\u0430\u043B\u044C\u043D\u0438\u0439 \u0441\u0435\u0440. \u0431\u0430\u043B</span>
              <div class="flex items-baseline gap-1 justify-end">
                <span class="text-2xl sm:text-3xl font-extrabold ${overallColor}">${selectedStat.overallAverage.toFixed(2)}</span>
                <span class="text-xs text-slate-400 font-medium">/3</span>
              </div>
            </div>
          </div>

          <!-- Linguistic Dimensions -->
          <div>
            <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-5 pt-3 pb-1 flex items-center gap-1.5">
              <span class="w-1 h-2.5 bg-slate-400 rounded-full inline-block"></span>
              Linguistic Dimensions (\u041C\u043E\u0432\u043D\u0456 \u0432\u0438\u043C\u0456\u0440\u0438)
            </p>
            <div class="divide-y-0">${linguisticHtml}</div>
          </div>

          <!-- Task-oriented Dimensions -->
          <div class="border-t border-slate-100">
            <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-5 pt-3 pb-1 flex items-center gap-1.5">
              <span class="w-1 h-2.5 bg-lime-500 rounded-full inline-block"></span>
              Task-Oriented Dimensions (\u0417\u0430\u0434\u0430\u0447\u043D\u043E-\u043E\u0440\u0456\u0454\u043D\u0442\u043E\u0432\u0430\u043D\u0456 \u0432\u0438\u043C\u0456\u0440\u0438)
            </p>
            <div class="divide-y-0 pb-2">${taskHtml}</div>
          </div>

          <!-- Action Button: Open/Close all submitted answers -->
          <div class="px-5 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between flex-wrap gap-3">
            <button 
              id="res-toggle-answers-btn"
              type="button"
              class="px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm flex items-center gap-2 cursor-pointer ${this.isAnswersExpanded ? "bg-slate-900 text-white hover:bg-slate-800" : "bg-lime-400 hover:bg-lime-500 text-slate-950 shadow-lime-400/20"}"
            >
              ${this.isAnswersExpanded ? `
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/></svg>
                \u041F\u0440\u0438\u0445\u043E\u0432\u0430\u0442\u0438 \u0432\u0456\u0434\u043F\u043E\u0432\u0456\u0434\u0456
              ` : `
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                \u0412\u0456\u0434\u043A\u0440\u0438\u0442\u0438 \u0432\u0441\u0456 \u043D\u0430\u0434\u0430\u043D\u0456 \u0432\u0456\u0434\u043F\u043E\u0432\u0456\u0434\u0456 \u0434\u043B\u044F \u0446\u044C\u043E\u0433\u043E \u043F\u0438\u0442\u0430\u043D\u043D\u044F (${selectedStat.count})
              `}
            </button>
            <span class="text-[11px] text-slate-400">
              ${this.isAnswersExpanded ? "\u041F\u043E\u043A\u0430\u0437\u0430\u043D\u043E \u0456\u043D\u0434\u0438\u0432\u0456\u0434\u0443\u0430\u043B\u044C\u043D\u0456 \u0430\u043D\u043A\u0435\u0442\u0438" : "\u041D\u0430\u0442\u0438\u0441\u043D\u0456\u0442\u044C \u0434\u043B\u044F \u043F\u0435\u0440\u0435\u0433\u043B\u044F\u0434\u0443 \u043E\u043A\u0440\u0435\u043C\u0438\u0445 \u0432\u0456\u0434\u043F\u043E\u0432\u0456\u0434\u0435\u0439"}
            </span>
          </div>

          <!-- Expanded Answers List -->
          ${answersListContent}
        </div>
      `;
      }
      let feedbackHtml = '<p class="text-slate-400 text-xs italic">\u041A\u043E\u043C\u0435\u043D\u0442\u0430\u0440\u0456\u0432 \u0449\u0435 \u043D\u0435 \u0437\u0430\u043B\u0438\u0448\u0435\u043D\u043E.</p>';
      if (data.recentFeedback && data.recentFeedback.length > 0) {
        feedbackHtml = data.recentFeedback.map(
          (item) => `
          <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
            <p class="text-slate-800 font-medium italic">"${this.escape(item.feedback)}"</p>
            <div class="mt-2 flex items-center justify-between text-slate-400">
              <span class="font-semibold text-slate-700">${this.escape(item.respondent || "Anonymous")}</span>
              <span>${this.formatDate(item.timestamp)}</span>
            </div>
          </div>
        `
        ).join("");
      }
      this.innerHTML = `
      <div class="space-y-8">
        <!-- Top Status Banner -->
        <div class="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 text-center shadow-sm relative overflow-hidden">
          <div class="absolute -top-10 -right-10 w-32 h-32 bg-lime-100 rounded-full blur-2xl opacity-70 pointer-events-none"></div>
          <div class="w-16 h-16 bg-lime-100 border-2 border-lime-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <svg class="w-8 h-8 text-lime-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-950">QGEval Live Score Dashboard</h2>
          <p class="text-slate-600 text-sm mt-1.5 max-w-md mx-auto">
            \u041E\u043D\u043E\u0432\u043B\u044E\u0432\u0430\u043D\u0430 \u0430\u043D\u0430\u043B\u0456\u0442\u0438\u043A\u0430 \u0442\u0430 \u043E\u0441\u0442\u0430\u043D\u043D\u0456 \u0432\u0456\u0434\u043F\u043E\u0432\u0456\u0434\u0456 \u0440\u0435\u0441\u043F\u043E\u043D\u0434\u0435\u043D\u0442\u0456\u0432 \u0437 \u0431\u0430\u0437\u0438 \u0434\u0430\u043D\u0438\u0445.
          </p>

          <div class="mt-6 flex flex-wrap justify-center gap-3">
            <button id="res-retake-btn" class="px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer">
              <svg class="w-4 h-4 text-lime-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              \u041E\u0446\u0456\u043D\u0438\u0442\u0438 \u043D\u043E\u0432\u0435 \u043F\u0438\u0442\u0430\u043D\u043D\u044F
            </button>
            <button id="res-refresh-btn" class="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-2">
              <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              \u041E\u043D\u043E\u0432\u0438\u0442\u0438 \u0434\u0430\u043D\u0456
            </button>
          </div>
        </div>

        <!-- Summary Stats Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">\u0417\u0430\u0433\u0430\u043B\u044C\u043D\u0438\u0439 \u0441\u0435\u0440. \u0431\u0430\u043B</span>
            <div class="flex items-baseline gap-2 mt-2">
              <span class="text-4xl font-extrabold text-slate-950">${data.overallAverage.toFixed(2)}</span>
              <span class="text-sm font-bold text-slate-400">/ 3</span>
              <span class="ml-auto px-2 py-0.5 rounded-md bg-lime-100 text-lime-800 text-xs font-semibold">Live</span>
            </div>
          </div>
          <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">\u0412\u0441\u044C\u043E\u0433\u043E \u0432\u0456\u0434\u043F\u043E\u0432\u0456\u0434\u0435\u0439</span>
            <div class="flex items-baseline gap-2 mt-2">
              <span class="text-4xl font-extrabold text-slate-950">${data.totalResponses}</span>
              <span class="text-xs text-slate-500 font-medium">\u0437\u0430\u043F\u0438\u0441\u0456\u0432</span>
            </div>
          </div>
          <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">\u041C\u0435\u0442\u0440\u0438\u043A QGEval</span>
            <div class="flex items-baseline gap-2 mt-2">
              <span class="text-4xl font-extrabold text-slate-950">${QGEVAL_METRICS.length}</span>
              <span class="text-xs text-slate-500 font-medium">\u0432\u0438\u043C\u0456\u0440\u0456\u0432 \u043E\u0446\u0456\u043D\u043A\u0438</span>
            </div>
          </div>
        </div>

        <!-- Global Metric Averages Overview -->
        <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 class="text-base font-bold text-slate-950 mb-1">\u0413\u043B\u043E\u0431\u0430\u043B\u044C\u043D\u0456 \u0441\u0435\u0440\u0435\u0434\u043D\u0456 \u043F\u043E\u043A\u0430\u0437\u043D\u0438\u043A\u0438 \u043C\u0435\u0442\u0440\u0438\u043A</h3>
          <p class="text-xs text-slate-400 mb-4">\u0410\u0433\u0440\u0435\u0433\u043E\u0432\u0430\u043D\u0430 \u0441\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u0430 \u0437\u0430 \u0432\u0441\u0456\u043C\u0430 \u043F\u0438\u0442\u0430\u043D\u043D\u044F\u043C\u0438 \u0442\u0430 \u0430\u043D\u043E\u0442\u0430\u0442\u043E\u0440\u0430\u043C\u0438</p>

          <div class="flex items-center gap-4 mb-4 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            <span class="flex items-center gap-1"><span class="w-3 h-1.5 rounded bg-rose-400 inline-block"></span>\u041D\u0438\u0437\u044C\u043A\u0430 (\u22641.75)</span>
            <span class="flex items-center gap-1"><span class="w-3 h-1.5 rounded bg-amber-400 inline-block"></span>\u0421\u0435\u0440\u0435\u0434\u043D\u044F (\u22642.5)</span>
            <span class="flex items-center gap-1"><span class="w-3 h-1.5 rounded bg-lime-500 inline-block"></span>\u0412\u0438\u0441\u043E\u043A\u0430 (>2.5)</span>
          </div>

          <div class="divide-y divide-slate-100">
            ${globalMetricsHtml}
          </div>
        </div>

        <!-- SECTION: \u041E\u0441\u0442\u0430\u043D\u043D\u0456 \u0432\u0456\u0434\u043F\u043E\u0432\u0456\u0434\u0456 \u0437 \u0411\u0414 (Recent Responses Feed) -->
        <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 class="text-base font-bold text-slate-950 flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-lime-500 inline-block"></span>
                \u041E\u0441\u0442\u0430\u043D\u043D\u0456 \u0432\u0456\u0434\u043F\u043E\u0432\u0456\u0434\u0456 \u0437 \u0411\u0414
              </h3>
              <p class="text-xs text-slate-400 mt-0.5">\u041E\u0441\u0442\u0430\u043D\u043D\u0456 \u0437\u0431\u0435\u0440\u0435\u0436\u0435\u043D\u0456 \u043E\u0446\u0456\u043D\u043A\u0438 \u0442\u0430 \u043A\u043E\u043C\u0435\u043D\u0442\u0430\u0440\u0456 \u0440\u0435\u0441\u043F\u043E\u043D\u0434\u0435\u043D\u0442\u0456\u0432</p>
            </div>
            <span class="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 self-start sm:self-auto">
              \u041F\u043E\u043A\u0430\u0437\u0430\u043D\u043E: \u043E\u0441\u0442\u0430\u043D\u043D\u0456 ${recentAnswers.length}
            </span>
          </div>

          ${recentFeedHtml}
        </div>

        <!-- SECTION: \u0414\u0435\u0442\u0430\u043B\u044C\u043D\u0430 \u0441\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u0430 \u0437\u0430 \u043A\u043E\u043D\u043A\u0440\u0435\u0442\u043D\u0438\u043C \u043F\u0438\u0442\u0430\u043D\u043D\u044F\u043C (Question-Specific Analytics) -->
        <div id="question-analytics-section" class="space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
            <div>
              <h3 class="text-base font-bold text-slate-950 flex items-center gap-2">
                <svg class="w-5 h-5 text-lime-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
                \u0421\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u0430 \u0437\u0430 \u043D\u043E\u043C\u0435\u0440\u043E\u043C \u043F\u0438\u0442\u0430\u043D\u043D\u044F
              </h3>
              <p class="text-xs text-slate-400 mt-0.5">\u0412\u0432\u0435\u0434\u0456\u0442\u044C \u043D\u043E\u043C\u0435\u0440 \u043F\u0438\u0442\u0430\u043D\u043D\u044F \u0432\u0456\u0434 1 \u0434\u043E ${this.totalQuestionsCount} \u0434\u043B\u044F \u043F\u0435\u0440\u0435\u0433\u043B\u044F\u0434\u0443 \u0430\u043D\u0430\u043B\u0456\u0442\u0438\u043A\u0438</p>
            </div>

            <!-- Question Number Input Stepper -->
            <div class="flex items-center gap-2">
              <button 
                id="res-prev-q-btn" 
                type="button" 
                class="h-10 px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                ${this.selectedQuestionNumber <= 1 ? "disabled" : ""}
                title="\u041F\u043E\u043F\u0435\u0440\u0435\u0434\u043D\u0454 \u043F\u0438\u0442\u0430\u043D\u043D\u044F"
              >
                \u25C0
              </button>

              <div class="relative w-28 sm:w-32">
                <input 
                  type="number" 
                  id="res-question-input" 
                  min="1" 
                  max="${this.totalQuestionsCount}" 
                  value="${this.selectedQuestionNumber}" 
                  class="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white text-sm font-extrabold text-slate-900 shadow-2xs focus:ring-2 focus:ring-lime-500 focus:border-lime-500 text-center"
                  aria-label="\u041D\u043E\u043C\u0435\u0440 \u043F\u0438\u0442\u0430\u043D\u043D\u044F"
                />
              </div>

              <button 
                id="res-next-q-btn" 
                type="button" 
                class="h-10 px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                ${this.selectedQuestionNumber >= this.totalQuestionsCount ? "disabled" : ""}
                title="\u041D\u0430\u0441\u0442\u0443\u043F\u043D\u0435 \u043F\u0438\u0442\u0430\u043D\u043D\u044F"
              >
                \u25B6
              </button>

              <span class="text-xs font-bold text-slate-400 px-1">
                / ${this.totalQuestionsCount}
              </span>
            </div>
          </div>

          <!-- Question Details Card (Or "No Score for this question" placeholder) -->
          ${questionDetailsHtml}
        </div>

        <!-- Annotator Comments -->
        <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 class="text-sm font-bold uppercase tracking-wider text-slate-700 mb-4">
            \u041E\u0441\u0442\u0430\u043D\u043D\u0456 \u043A\u043E\u043C\u0435\u043D\u0442\u0430\u0440\u0456 \u0430\u043D\u043E\u0442\u0430\u0442\u043E\u0440\u0456\u0432
          </h3>
          <div class="space-y-3">
            ${feedbackHtml}
          </div>
        </div>
      </div>
    `;
    }
    bindEvents() {
      this.$("#res-retake-btn")?.addEventListener("click", () => {
        this.surveyService.resetScores();
        this.surveyService.setView("survey");
      });
      this.$("#res-refresh-btn")?.addEventListener("click", () => {
        this.answersCache.clear();
        this.loadData();
      });
      const inputEl = this.$("#res-question-input");
      const handleNumberChange = (rawVal) => {
        let num = parseInt(rawVal, 10);
        if (isNaN(num)) return;
        if (num < 1) num = 1;
        if (num > this.totalQuestionsCount) num = this.totalQuestionsCount;
        if (num !== this.selectedQuestionNumber) {
          this.selectedQuestionNumber = num;
          this.isAnswersExpanded = false;
          this.questionAnswers = [];
          this.render();
          this.bindEvents();
          this.fetchQuestionInfoIfNeeded(num);
        }
      };
      inputEl?.addEventListener("change", (e) => {
        handleNumberChange(e.target.value);
      });
      inputEl?.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          handleNumberChange(e.target.value);
        }
      });
      this.$("#res-prev-q-btn")?.addEventListener("click", () => {
        if (this.selectedQuestionNumber > 1) {
          this.selectedQuestionNumber--;
          this.isAnswersExpanded = false;
          this.questionAnswers = [];
          this.render();
          this.bindEvents();
          this.fetchQuestionInfoIfNeeded(this.selectedQuestionNumber);
        }
      });
      this.$("#res-next-q-btn")?.addEventListener("click", () => {
        if (this.selectedQuestionNumber < this.totalQuestionsCount) {
          this.selectedQuestionNumber++;
          this.isAnswersExpanded = false;
          this.questionAnswers = [];
          this.render();
          this.bindEvents();
          this.fetchQuestionInfoIfNeeded(this.selectedQuestionNumber);
        }
      });
      this.$("#res-rate-this-btn")?.addEventListener("click", async () => {
        try {
          await this.surveyService.fetchQuestionByIndex(this.selectedQuestionNumber);
          this.surveyService.resetScores();
          this.surveyService.setView("survey");
        } catch (err) {
          console.error("Failed to navigate to question for rating:", err);
        }
      });
      this.$("#res-toggle-answers-btn")?.addEventListener("click", async () => {
        this.isAnswersExpanded = !this.isAnswersExpanded;
        if (this.isAnswersExpanded) {
          await this.loadAnswersForSelectedQuestion();
        }
        this.render();
        this.bindEvents();
      });
      const recentButtons = this.$$(".recent-select-btn");
      recentButtons.forEach((btn) => {
        btn.addEventListener("click", async () => {
          const qId = btn.getAttribute("data-qid");
          const num = qId ? parseInt(qId, 10) : NaN;
          if (!isNaN(num)) {
            this.selectedQuestionNumber = num;
            this.isAnswersExpanded = false;
            this.questionAnswers = [];
            this.render();
            this.bindEvents();
            this.fetchQuestionInfoIfNeeded(num);
            const targetSection = this.$("#question-analytics-section");
            targetSection?.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        });
      });
    }
    async fetchQuestionInfoIfNeeded(num) {
      if (this.questionInfoCache.has(num)) return;
      try {
        const q = await this.surveyService.getQuestionDetails(num);
        if (q) {
          this.questionInfoCache.set(num, {
            question: q.description,
            answer: q.targetAnswer
          });
          if (this.selectedQuestionNumber === num) {
            this.render();
            this.bindEvents();
          }
        }
      } catch (err) {
        console.warn(`Could not load question text for #${num}:`, err);
      }
    }
    async loadAnswersForSelectedQuestion() {
      const qIdStr = String(this.selectedQuestionNumber);
      if (this.answersCache.has(qIdStr)) {
        this.questionAnswers = this.answersCache.get(qIdStr) || [];
        return;
      }
      this.isLoadingAnswers = true;
      this.render();
      this.bindEvents();
      try {
        const items = await this.surveyService.getAnswersForQuestion(this.selectedQuestionNumber);
        this.answersCache.set(qIdStr, items);
        this.questionAnswers = items;
      } catch (err) {
        console.error("Failed to load answers for question:", err);
        this.questionAnswers = [];
      } finally {
        this.isLoadingAnswers = false;
      }
    }
    formatCountUa(count) {
      const mod10 = count % 10;
      const mod100 = count % 100;
      if (mod100 >= 11 && mod100 <= 14) return "\u0432\u0456\u0434\u043F\u043E\u0432\u0456\u0434\u0435\u0439";
      if (mod10 === 1) return "\u0432\u0456\u0434\u043F\u043E\u0432\u0456\u0434\u044C";
      if (mod10 >= 2 && mod10 <= 4) return "\u0432\u0456\u0434\u043F\u043E\u0432\u0456\u0434\u0456";
      return "\u0432\u0456\u0434\u043F\u043E\u0432\u0456\u0434\u0435\u0439";
    }
    escape(str) {
      return str ? str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") : "";
    }
    formatDate(isoStr) {
      if (!isoStr) return "";
      try {
        return new Date(isoStr).toLocaleDateString("uk-UA", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        });
      } catch {
        return "";
      }
    }
  };
  ResultsViewComponent = __decorateClass([
    Component({
      selector: "app-results-view"
    })
  ], ResultsViewComponent);

  // src/client/components/app.component.ts
  var AppComponent = class extends BaseComponent {
    surveyService = inject(SurveyService);
    currentView = "survey";
    unsubscribeView;
    ngOnInit() {
      this.currentView = this.surveyService.getView();
      this.unsubscribeView = this.surveyService.onViewChange((view) => {
        this.currentView = view;
        this.renderView();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
      this.renderView();
    }
    ngOnDestroy() {
      if (this.unsubscribeView) {
        this.unsubscribeView();
      }
    }
    render() {
      this.className = "min-h-screen flex flex-col font-sans bg-[#fafafa] text-slate-900 selection:bg-lime-300 selection:text-black";
      this.innerHTML = `
      <!-- Angular-style Header Component -->
      <app-header></app-header>

      <!-- Main Shell -->
      <main class="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div id="view-outlet"></div>
      </main>

      <!-- Clean Footer -->
      <footer class="border-t border-slate-200 bg-white py-6 mt-12 text-center text-xs text-slate-500">
        <div class="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-lime-500"></span>
            <span class="font-semibold text-slate-800">Questionnaire NestJS Service</span>
            <span>\u2022</span>
          </div>
          <div class="text-slate-400">
            Tailwind CSS \u2022 Light Theme \u2022 Black / Grey / Lime
          </div>
        </div>
      </footer>
    `;
    }
    renderView() {
      const outlet = this.$("#view-outlet");
      if (!outlet) return;
      if (this.currentView === "survey") {
        outlet.innerHTML = `<app-survey-form></app-survey-form>`;
      } else {
        outlet.innerHTML = `<app-results-view></app-results-view>`;
      }
    }
  };
  AppComponent = __decorateClass([
    Component({
      selector: "app-root"
    })
  ], AppComponent);

  // src/client/main.ts
  console.log("[RatePulse] Angular-style components initialized successfully.");
})();
//# sourceMappingURL=app.js.map
