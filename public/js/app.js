(()=>{var H=Object.defineProperty;var j=Object.getOwnPropertyDescriptor;var d=(n,e,t,s)=>{for(var r=s>1?void 0:s?j(e,t):e,i=n.length-1,l;i>=0;i--)(l=n[i])&&(r=(s?l(e,t,r):l(r))||r);return s&&r&&H(e,t,r),r};var T=new Map;function A(n={providedIn:"root"}){return function(e){return e}}function u(n){return T.has(n)||T.set(n,new n),T.get(n)}var c=class extends HTMLElement{isInitialized=!1;connectedCallback(){this.render(),this.isInitialized||(this.isInitialized=!0,this.ngOnInit())}disconnectedCallback(){this.ngOnDestroy()}ngOnInit(){}ngOnDestroy(){}render(){}emit(e,t){this.dispatchEvent(new CustomEvent(e,{bubbles:!0,composed:!0,detail:t}))}$(e){return this.querySelector(e)}$$(e){return this.querySelectorAll(e)}};function p(n){return function(e){return customElements.get(n.selector)||customElements.define(n.selector,e),e.__metadata=n,e}}var b=[{id:"fluency",label:"Fluency",labelUk:"\u041F\u0440\u0438\u0440\u043E\u0434\u043D\u0456\u0441\u0442\u044C",group:"linguistic",description:"How well-formed, grammatically correct, logically coherent and comprehensible the question is."},{id:"clarity",label:"Clarity",labelUk:"\u0427\u0456\u0442\u043A\u0456\u0441\u0442\u044C",group:"linguistic",description:"Whether the question is stated clearly and unambiguously, avoiding over-generalisation or vagueness."},{id:"conciseness",label:"Conciseness",labelUk:"\u041B\u0430\u043A\u043E\u043D\u0456\u0447\u043D\u0456\u0441\u0442\u044C",group:"linguistic",description:"Whether the question is concise and does not contain redundancy or duplicate information."},{id:"relevance",label:"Relevance",labelUk:"\u0420\u0435\u043B\u0435\u0432\u0430\u043D\u0442\u043D\u0456\u0441\u0442\u044C",group:"task",description:"How relevant the question is to the provided image (domain) and dataset topic."},{id:"consistency",label:"Consistency",labelUk:"\u041A\u043E\u043D\u0442\u0435\u043A\u0441\u0442\u043D\u0430 \u0443\u0437\u0433\u043E\u0434\u0436\u0435\u043D\u0456\u0441\u0442\u044C",group:"task",description:"Whether the information stated in the question itself is consistent with the provided image."},{id:"answerability",label:"Answerability",labelUk:"\u041C\u043E\u0436\u043B\u0438\u0432\u0456\u0441\u0442\u044C \u0432\u0456\u0434\u043F\u043E\u0432\u0456\u0441\u0442\u0438",group:"task",description:"Whether a clear and unambiguous answer can be found relying solely on the provided image."},{id:"answer_consistency",label:"Answer Consistency",labelUk:"\u0423\u0437\u0433\u043E\u0434\u0436\u0435\u043D\u0456\u0441\u0442\u044C \u0432\u0456\u0434\u043F\u043E\u0432\u0456\u0434\u0456",group:"task",description:"Whether the generated question can be successfully answered using the target answer provided to the model."}];var o=class{questions=[];selectedScores=new Map;currentView="survey";cachedResults=null;viewListeners=new Set;scoreListeners=new Set;async getQuestions(){if(this.questions.length>0)return this.questions;let e=await fetch("/api/survey/questions");if(!e.ok)throw new Error(`Failed to load questionnaire items: ${e.statusText}`);return this.questions=await e.json(),this.questions}setMetricScore(e,t,s){let r=this.selectedScores.get(e)??{};this.selectedScores.set(e,{...r,[t]:s}),this.notifyScoreListeners()}getScores(e){return this.selectedScores.get(e)??{}}getMetricScore(e,t){return(this.selectedScores.get(e)??{})[t]}isQuestionFullyAnswered(e){let t=this.selectedScores.get(e);return t?b.every(s=>t[s.id]!==void 0):!1}getSelectedScores(){return new Map(this.selectedScores)}getAnsweredCount(){return this.questions.filter(e=>this.isQuestionFullyAnswered(e.id)).length}getTotalQuestionsCount(){return this.questions.length}resetScores(){this.selectedScores.clear(),this.notifyScoreListeners()}async submitSurvey(e){let t=await fetch("/api/survey/submit",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)});if(!t.ok){let r=await t.json();throw new Error(r.message||"Submission failed")}let s=await t.json();return this.cachedResults=null,s}async getResults(){let e=await fetch("/api/survey/results");if(!e.ok)throw new Error(`Failed to fetch results: ${e.statusText}`);return this.cachedResults=await e.json(),this.cachedResults}setView(e){this.currentView=e,this.viewListeners.forEach(t=>t(e))}getView(){return this.currentView}onViewChange(e){return this.viewListeners.add(e),()=>this.viewListeners.delete(e)}onScoreChange(e){return this.scoreListeners.add(e),()=>this.scoreListeners.delete(e)}notifyScoreListeners(){let e=new Map(this.selectedScores);this.scoreListeners.forEach(t=>t(e))}};o=d([A()],o);var S=class extends c{surveyService=u(o);unsubscribeView;ngOnInit(){this.unsubscribeView=this.surveyService.onViewChange(()=>{this.updateActiveTabs()}),this.bindEvents(),this.updateActiveTabs()}ngOnDestroy(){this.unsubscribeView&&this.unsubscribeView()}render(){this.innerHTML=`
      <header class="border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-30">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="h-9 w-9 rounded-xl bg-slate-950 flex items-center justify-center shadow-sm">
              <span class="text-lime-400 font-extrabold text-lg leading-none">10</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="font-bold text-slate-950 tracking-tight text-base">RatePulse</span>
              <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs">v1.0.0</span>
              <span class="hidden sm:inline text-xs text-slate-400 font-medium border-l border-slate-200 pl-2">
                Angular-Style Components
              </span>
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
    `}bindEvents(){let e=this.$("#nav-survey-btn"),t=this.$("#nav-results-btn");e?.addEventListener("click",()=>{this.surveyService.setView("survey")}),t?.addEventListener("click",()=>{this.surveyService.setView("results")})}updateActiveTabs(){let e=this.surveyService.getView(),t=this.$("#nav-survey-btn"),s=this.$("#nav-results-btn");!t||!s||(e==="survey"?(t.className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-950 text-white transition-all shadow-sm",s.className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-950 hover:bg-slate-100 transition-all"):(t.className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-950 hover:bg-slate-100 transition-all",s.className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-950 text-white transition-all shadow-sm"))}};S=d([p({selector:"app-header"})],S);var k=class extends c{surveyService=u(o);questionId="";minLabel="";maxLabel="";selectedScore=null;unsubscribeScores;setProperties(e){this.questionId=e.questionId,this.minLabel=e.minLabel,this.maxLabel=e.maxLabel,this.selectedScore=e.selectedScore??null,this.render(),this.bindEvents()}ngOnInit(){if(!this.questionId){this.questionId=this.getAttribute("question-id")||"",this.minLabel=this.getAttribute("min-label")||"Low",this.maxLabel=this.getAttribute("max-label")||"High";let e=this.surveyService.getScore(this.questionId);e!==void 0&&(this.selectedScore=e),this.render(),this.bindEvents()}this.unsubscribeScores=this.surveyService.onScoreChange(e=>{let t=e.get(this.questionId)??null;t!==this.selectedScore&&(this.selectedScore=t,this.updateButtonStates())})}ngOnDestroy(){this.unsubscribeScores&&this.unsubscribeScores()}render(){let e="";for(let t=1;t<=10;t++){let s=this.selectedScore===t;e+=`
        <button 
          type="button" 
          data-score="${t}"
          aria-label="Score ${t} out of 10"
          aria-pressed="${s?"true":"false"}"
          class="score-btn ${s?"active":""}"
        >
          <span class="text-base">${t}</span>
        </button>
      `}this.innerHTML=`
      <div>
        <div class="grid grid-cols-5 sm:grid-cols-10 gap-2 sm:gap-2.5">
          ${e}
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
    `}bindEvents(){this.$$(".score-btn").forEach(t=>{t.addEventListener("click",()=>{let s=parseInt(t.getAttribute("data-score")||"0",10);s>=1&&s<=10&&(this.surveyService.setScore(this.questionId,s),this.emit("scoreSelected",{questionId:this.questionId,score:s}))})})}updateButtonStates(){this.$$(".score-btn").forEach(t=>{parseInt(t.getAttribute("data-score")||"0",10)===this.selectedScore?(t.classList.add("active"),t.setAttribute("aria-pressed","true")):(t.classList.remove("active"),t.setAttribute("aria-pressed","false"))})}escape(e){return e?e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"):""}};k=d([p({selector:"app-rating-scale"})],k);var $=class extends c{surveyService=u(o);questionId="";metricId="fluency";label="";labelUk="";description="";selectedScore=null;unsubscribe;setProperties(e){this.questionId=e.questionId,this.metricId=e.metricId,this.label=e.label,this.labelUk=e.labelUk,this.description=e.description,this.selectedScore=this.surveyService.getMetricScore(this.questionId,this.metricId)??null,this.render(),this.bindEvents()}ngOnInit(){this.unsubscribe=this.surveyService.onScoreChange(()=>{let e=this.surveyService.getMetricScore(this.questionId,this.metricId)??null;e!==this.selectedScore&&(this.selectedScore=e,this.updateButtonStates())})}ngOnDestroy(){this.unsubscribe?.()}render(){let e=[1,2,3].map(t=>{let s=this.selectedScore===t,r=this.scoreColorClass(t,s);return`
          <button
            type="button"
            data-score="${t}"
            aria-label="Score ${t} out of 3"
            aria-pressed="${s}"
            id="metric-btn-${this.questionId}-${this.metricId}-${t}"
            class="metric-score-btn ${r} w-10 h-10 rounded-xl font-bold text-sm transition-all duration-150 border-2 focus:outline-none focus:ring-2 focus:ring-offset-1 cursor-pointer select-none"
          >${t}</button>
        `}).join("");this.innerHTML=`
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
          ${e}
        </div>
      </div>
    `}bindEvents(){this.$$(".metric-score-btn").forEach(t=>{t.addEventListener("click",()=>{let s=parseInt(t.getAttribute("data-score")||"0",10);s>=1&&s<=3&&(this.surveyService.setMetricScore(this.questionId,this.metricId,s),this.emit("metricScored",{questionId:this.questionId,metricId:this.metricId,score:s}))})})}updateButtonStates(){this.$$(".metric-score-btn").forEach(t=>{let s=parseInt(t.getAttribute("data-score")||"0",10),r=s===this.selectedScore;t.className=`metric-score-btn ${this.scoreColorClass(s,r)} w-10 h-10 rounded-xl font-bold text-sm transition-all duration-150 border-2 focus:outline-none focus:ring-2 focus:ring-offset-1 cursor-pointer select-none`,t.setAttribute("aria-pressed",String(r))})}scoreColorClass(e,t){if(t)switch(e){case 1:return"bg-rose-500 border-rose-600 text-white shadow-sm shadow-rose-200 ring-rose-400";case 2:return"bg-amber-400 border-amber-500 text-white shadow-sm shadow-amber-200 ring-amber-400";case 3:return"bg-lime-500 border-lime-600 text-white shadow-sm shadow-lime-200 ring-lime-400"}switch(e){case 1:return"bg-white border-slate-200 text-slate-500 hover:border-rose-300 hover:text-rose-500 hover:bg-rose-50 ring-rose-400";case 2:return"bg-white border-slate-200 text-slate-500 hover:border-amber-300 hover:text-amber-500 hover:bg-amber-50 ring-amber-400";case 3:return"bg-white border-slate-200 text-slate-500 hover:border-lime-400 hover:text-lime-600 hover:bg-lime-50 ring-lime-400"}}escape(e){return e?e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"):""}};$=d([p({selector:"app-qgeval-metric-row"})],$);var L=class extends c{surveyService=u(o);questionData=null;index=0;total=0;unsubscribeScores;setQuestion(e,t,s){this.questionData=e,this.index=t,this.total=s,this.render(),this.initMetricRows()}ngOnInit(){this.unsubscribeScores=this.surveyService.onScoreChange(()=>{this.questionData&&this.updateProgressBadge()})}ngOnDestroy(){this.unsubscribeScores?.()}render(){if(!this.questionData)return;let e=this.questionData,t=this.getRatedCount(),s=e.numericId!==void 0?e.numericId:parseInt(e.id,10),r=isNaN(s)?1:s,i=`https://huggingface.co/datasets/SergCholovskyi/pipe-vqa/resolve/main/${r}.jpg`,l="https://huggingface.co/datasets/SergCholovskyi/pipe-vqa/resolve/main/1.jpg";this.className="block",this.innerHTML=`
      <div id="card-${e.id}" class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden transition-all">

        <!-- Card Header -->
        <div class="px-6 pt-6 pb-4 border-b border-slate-100">
          <div class="flex items-start justify-between gap-3 mb-3">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider shrink-0">
              Q${this.index+1} / ${this.total} &nbsp;\xB7&nbsp; ${this.escape(e.category)}
            </span>
            <span id="badge-${e.id}" class="text-xs font-semibold shrink-0">
              ${this.badgeHtml(t)}
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
                  id="img-${e.id}"
                  src="${i}" 
                  alt="Image context for question #${r}" 
                  class="max-h-64 w-auto max-w-full object-contain rounded-lg transition-transform duration-200 hover:scale-[1.01]"
                  loading="lazy"
                  onerror="if(this.dataset.fallback !== 'true'){ this.dataset.fallback = 'true'; this.src = '${l}'; const a = document.getElementById('img-link-${e.id}'); if(a){ a.href = '${l}'; a.innerHTML = '<span>pipe-vqa/1.jpg (fallback)</span>'; } }"
                />
              </div>
              <div class="mt-2 px-1 flex items-center justify-between">
                <a 
                  id="img-link-${e.id}"
                  href="${i}" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  class="text-xs font-medium text-slate-500 hover:text-slate-900 underline decoration-slate-300 underline-offset-2 flex items-center gap-1 transition-colors"
                >
                  <span>pipe-vqa/${r}.jpg</span>
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
            "${this.escape(e.description)}"
          </p>

          <!-- Target Answer pill -->
          <div class="inline-flex items-center gap-2 rounded-xl bg-lime-50 border border-lime-200/80 px-3 py-1.5">
            <span class="text-[10px] font-bold uppercase tracking-wider text-lime-700">Target Answer:</span>
            <span class="text-xs font-bold text-slate-800">${this.escape(e.targetAnswer)}</span>
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
            <div id="linguistic-rows-${e.id}" class="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden bg-white"></div>
          </div>

          <!-- Task-oriented dimensions group -->
          <div class="mt-3">
            <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1.5">
              <span class="w-1 h-3 bg-lime-500 rounded-full inline-block"></span>
              Task-Oriented Dimensions
            </p>
            <div id="task-rows-${e.id}" class="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden bg-white"></div>
          </div>

        </div>
      </div>
    `}initMetricRows(){if(!this.questionData)return;let e=this.questionData,t=this.$(`#linguistic-rows-${e.id}`),s=this.$(`#task-rows-${e.id}`);b.forEach(r=>{let i=document.createElement("app-qgeval-metric-row");i.id=`row-${e.id}-${r.id}`,i.className="block px-4",(r.group==="linguistic"?t:s)?.appendChild(i),i.setProperties({questionId:e.id,metricId:r.id,label:r.label,labelUk:r.labelUk,description:r.description})})}getRatedCount(){if(!this.questionData)return 0;let e=this.surveyService.getScores(this.questionData.id);return b.filter(t=>e[t.id]!==void 0).length}updateProgressBadge(){if(!this.questionData)return;let e=this.$(`#badge-${this.questionData.id}`);e&&(e.innerHTML=this.badgeHtml(this.getRatedCount()))}badgeHtml(e){let t=b.length;return e===t?`<span class="inline-flex items-center gap-1 text-lime-700 font-bold"><span class="w-2 h-2 rounded-full bg-lime-500"></span>All ${t} rated \u2713</span>`:e>0?`<span class="inline-flex items-center gap-1 text-amber-600 font-semibold"><span class="w-2 h-2 rounded-full bg-amber-400"></span>${e}/${t} rated</span>`:'<span class="text-slate-400">Not rated yet</span>'}escape(e){return e?e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"):""}};L=d([p({selector:"app-question-card"})],L);var M=class extends c{surveyService=u(o);questions=[];currentIndex=0;isLoading=!0;isSubmitting=!1;errorMessage="";unsubscribeScores;async ngOnInit(){this.unsubscribeScores=this.surveyService.onScoreChange(()=>{this.updateProgressBar(),this.updateButtonStates(),this.updateCardBadge()});try{this.questions=await this.surveyService.getQuestions(),this.isLoading=!1,this.currentIndex=0,this.render(),this.mountCurrentCard(),this.bindNavEvents(),this.updateProgressBar(),this.updateButtonStates()}catch(e){this.isLoading=!1,this.errorMessage=e.message||"Error loading questionnaire",this.renderError()}}ngOnDestroy(){this.unsubscribeScores?.()}render(){if(this.isLoading){this.innerHTML=`
        <div class="p-10 text-center bg-white rounded-2xl border border-slate-200 shadow-sm animate-pulse">
          <p class="text-slate-500 text-sm font-medium">Loading questionnaire items\u2026</p>
        </div>`;return}let e=this.questions.length;this.innerHTML=`
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
            Rate all <span class="font-semibold text-slate-900">${b.length} QGEval metrics</span>
            (scale 1\u20133) for each generated question. Use <strong>Next</strong> to proceed or <strong>Finish</strong> to submit at any time.
          </p>
        </div>

        <!-- Step progress row -->
        <div class="bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-sm">
          <div class="flex items-center justify-between text-xs font-medium text-slate-500 mb-3">
            <span>Question Progress</span>
            <span id="progress-text" class="font-semibold text-slate-900">
              Question 1 of ${e}
            </span>
          </div>

          <!-- Step dots -->
          <div class="flex items-center gap-1.5 mb-3 flex-wrap">
            ${this.questions.map((t,s)=>`
                <button
                  type="button"
                  data-step="${s}"
                  id="step-dot-${s}"
                  aria-label="Go to question ${s+1}"
                  class="step-dot w-7 h-7 rounded-lg text-[10px] font-bold border-2 transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-lime-400"
                >${s+1}</button>
              `).join("")}
          </div>

          <!-- Progress bar -->
          <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div id="progress-fill" class="bg-lime-500 h-1.5 rounded-full transition-all duration-300" style="width:0%;"></div>
          </div>
          <p class="text-[10px] text-slate-400 mt-1.5">
            <span id="progress-sub">0 of ${e} questions fully rated (all ${b.length} metrics each)</span>
          </p>
        </div>

        <!-- Single question card slot -->
        <div id="card-slot" class="mb-6"></div>

        <!-- Optional: annotator name & comment (shown only on last question) -->
        <div id="extra-fields" class="hidden bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 mb-6">
          <h2 class="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <span class="w-1.5 h-4 bg-slate-900 rounded-full"></span>
            Additional Context (Optional)
          </h2>
          <div class="grid grid-cols-1 gap-4">
            <div>
              <label for="respondent-name" class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Annotator Name / Team
              </label>
              <input
                type="text"
                id="respondent-name"
                name="respondentName"
                placeholder="e.g. Anna Kovalenko or NLP Lab Team"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm placeholder-slate-400 focus:bg-white focus:border-slate-400 transition-colors"
              >
            </div>
            <div>
              <label for="feedback-text" class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Comments or Observations
              </label>
              <textarea
                id="feedback-text"
                name="feedback"
                rows="3"
                placeholder="Any general observations about question quality, systematic issues, etc."
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm placeholder-slate-400 focus:bg-white focus:border-slate-400 transition-colors resize-y"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Error message -->
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
            Prev
          </button>

          <!-- Finish button -->
          <button
            type="button"
            id="finish-btn"
            class="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border-2 border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            <svg class="w-4 h-4 text-lime-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
            </svg>
            Finish
          </button>

          <!-- Next button -->
          <button
            type="button"
            id="next-btn"
            class="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-sm transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-lime-400/40 shadow-md"
          >
            Next
            <svg class="w-4 h-4 text-lime-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
            </svg>
          </button>

        </div>
      </div>
    `}renderError(){this.innerHTML=`
      <div class="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center">
        <p class="text-rose-700 font-semibold text-sm">${this.escape(this.errorMessage)}</p>
        <button id="retry-btn" class="mt-3 px-4 py-2 bg-rose-600 text-white text-xs rounded-xl font-bold">Retry</button>
      </div>`,this.$("#retry-btn")?.addEventListener("click",()=>location.reload())}mountCurrentCard(){let e=this.$("#card-slot");if(!e)return;e.innerHTML="";let t=this.questions[this.currentIndex];if(!t)return;let s=document.createElement("app-question-card");s.id=`qcard-${t.id}`,e.appendChild(s),s.setQuestion(t,this.currentIndex,this.questions.length)}bindNavEvents(){this.$$(".step-dot").forEach(e=>{e.addEventListener("click",()=>{let t=parseInt(e.getAttribute("data-step")||"0",10);this.navigateTo(t)})}),this.$("#prev-btn")?.addEventListener("click",()=>{this.currentIndex>0&&this.navigateTo(this.currentIndex-1)}),this.$("#next-btn")?.addEventListener("click",()=>{this.currentIndex<this.questions.length-1&&this.navigateTo(this.currentIndex+1)}),this.$("#finish-btn")?.addEventListener("click",()=>this.handleFinish())}navigateTo(e){e<0||e>=this.questions.length||(this.currentIndex=e,this.mountCurrentCard(),this.updateProgressBar(),this.updateButtonStates(),this.updateStepDots(),this.toggleExtraFields(),this.$("#card-slot")?.scrollIntoView({behavior:"smooth",block:"start"}))}updateProgressBar(){let e=this.surveyService.getAnsweredCount(),t=this.questions.length,s=t>0?Math.round(e/t*100):0,r=this.$("#progress-text"),i=this.$("#progress-fill"),l=this.$("#progress-sub");r&&(r.textContent=`Question ${this.currentIndex+1} of ${t}`),i&&(i.style.width=`${s}%`),l&&(l.textContent=`${e} of ${t} questions fully rated (all ${b.length} metrics each)`)}updateButtonStates(){let e=this.$("#prev-btn"),t=this.$("#next-btn"),s=this.currentIndex===this.questions.length-1,r=this.currentIndex===0;e&&(e.disabled=r),t&&(s?(t.classList.add("opacity-40","cursor-not-allowed"),t.disabled=!0):(t.classList.remove("opacity-40","cursor-not-allowed"),t.disabled=!1))}updateStepDots(){this.$$(".step-dot").forEach((e,t)=>{let s=this.surveyService.isQuestionFullyAnswered(this.questions[t]?.id),r=t===this.currentIndex;e.className=["step-dot w-7 h-7 rounded-lg text-[10px] font-bold border-2 transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-lime-400",r?"bg-slate-950 border-slate-950 text-white scale-110 shadow":s?"bg-lime-500 border-lime-600 text-white":"bg-white border-slate-300 text-slate-500 hover:border-slate-400"].join(" ")})}updateCardBadge(){}toggleExtraFields(){let e=this.$("#extra-fields");if(!e)return;this.currentIndex===this.questions.length-1?e.classList.remove("hidden"):e.classList.add("hidden")}async handleFinish(){let e=this.$("#form-error"),t=this.questions.filter(h=>!this.surveyService.isQuestionFullyAnswered(h.id));if(t.length>0){let h=t[0],w=this.surveyService.getScores(h.id),x=b.filter(q=>w[q.id]===void 0)[0]?.label??"a metric",m=this.questions.indexOf(h);m!==this.currentIndex&&this.navigateTo(m),e&&(e.textContent=`Please rate "${x}" for Question ${m+1} before finishing.`,e.classList.remove("hidden"));return}e&&e.classList.add("hidden");let s=this.surveyService.getSelectedScores(),r=Array.from(s.entries()).map(([h,w])=>({questionId:h,scores:w})),i=this.$("#respondent-name")?.value.trim(),l=this.$("#feedback-text")?.value.trim(),v=this.$("#finish-btn"),f=this.$("#next-btn");v&&(v.disabled=!0,v.innerHTML=`
        <svg class="animate-spin h-4 w-4 text-lime-600" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
        <span>Submitting\u2026</span>
      `),f&&(f.disabled=!0);try{await this.surveyService.submitSurvey({answers:r,respondentName:i||void 0,feedback:l||void 0}),this.surveyService.setView("results")}catch(h){e&&(e.textContent=`Submission Error: ${h.message}`,e.classList.remove("hidden")),v&&(v.disabled=!1,v.innerHTML=`
          <svg class="w-4 h-4 text-lime-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
          </svg>
          Finish
        `),f&&(f.disabled=this.currentIndex===this.questions.length-1)}}escape(e){return e?e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"):""}};M=d([p({selector:"app-survey-form"})],M);var I=class extends c{surveyService=u(o);resultsData=null;isLoading=!0;async ngOnInit(){await this.loadData()}async loadData(){this.isLoading=!0,this.renderLoading();try{this.resultsData=await this.surveyService.getResults(),this.isLoading=!1,this.render(),this.bindEvents()}catch{this.isLoading=!1,this.innerHTML=`
        <div class="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center">
          <p class="text-rose-700 font-semibold text-sm">Error loading results</p>
          <button id="res-retry-btn" class="mt-3 px-4 py-2 bg-rose-600 text-white text-xs rounded-xl font-bold">Retry</button>
        </div>
      `,this.$("#res-retry-btn")?.addEventListener("click",()=>this.loadData())}}renderLoading(){this.innerHTML=`
      <div class="p-10 text-center bg-white rounded-2xl border border-slate-200 shadow-sm animate-pulse">
        <p class="text-slate-500 text-sm font-medium">Aggregating QGEval score analytics\u2026</p>
      </div>
    `}render(){if(!this.resultsData)return;let e=this.resultsData,t=e.globalMetricAverages.map(i=>{let l=Math.round((i.averageScore-1)/2*100),v=i.averageScore>=2.5?"bg-lime-500":i.averageScore>=1.75?"bg-amber-400":"bg-rose-500";return`
          <div class="flex items-center gap-3 py-2">
            <div class="w-36 shrink-0">
              <p class="text-xs font-semibold text-slate-800 truncate">${this.escape(i.label)}</p>
              <p class="text-[10px] text-slate-400">${this.escape(i.labelUk)}</p>
            </div>
            <div class="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
              <div class="${v} h-2 rounded-full transition-all duration-500" style="width: ${l}%;"></div>
            </div>
            <span class="text-sm font-bold text-slate-900 w-8 text-right">${i.averageScore.toFixed(2)}</span>
            <span class="text-xs text-slate-400 font-medium">/3</span>
          </div>
        `}).join('<div class="border-t border-slate-100"></div>'),s=e.questionStats.map(i=>{let l=i.metrics.map(a=>{let x=[1,2,3].map(g=>{let y=a.distribution.find(C=>C.score===g);return{score:g,count:y?.count??0,pct:y?.percentage??0}}),m=["bg-rose-400","bg-amber-400","bg-lime-500"],q=x.map((g,y)=>{let C=Math.max(g.pct,4);return`
                  <div class="flex-1 flex flex-col items-center gap-0.5 group relative">
                    <div class="w-full bg-slate-100 rounded h-12 flex items-end p-0.5">
                      <div class="w-full ${m[y]} rounded transition-all duration-500" style="height:${C}%;"></div>
                    </div>
                    <span class="text-[9px] font-bold text-slate-500">${g.score}</span>
                    <div class="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-900 text-white text-[10px] px-1.5 py-0.5 rounded shadow whitespace-nowrap z-10">
                      ${g.count} (${g.pct}%)
                    </div>
                  </div>
                `}).join(""),B=a.averageScore>=2.5?"text-lime-600":a.averageScore>=1.75?"text-amber-600":"text-rose-500";return`
              <div class="py-2.5 px-4 flex items-center gap-3">
                <div class="w-40 shrink-0">
                  <p class="text-xs font-semibold text-slate-800">${this.escape(a.label)}</p>
                  <p class="text-[10px] text-slate-400">${this.escape(a.labelUk)}</p>
                </div>
                <div class="flex gap-1 w-24 shrink-0">
                  ${q}
                </div>
                <div class="ml-auto text-right">
                  <span class="text-base font-extrabold ${B}">${a.averageScore.toFixed(2)}</span>
                  <span class="text-xs text-slate-400 font-medium">/3</span>
                </div>
              </div>
            `}),v=b.filter(a=>a.group==="linguistic").map(a=>a.id),f=i.metrics.filter(a=>v.includes(a.metricId)).map((a,x,m)=>l[i.metrics.indexOf(a)]+(x<m.length-1?'<div class="border-t border-slate-100 mx-4"></div>':"")).join(""),h=i.metrics.filter(a=>!v.includes(a.metricId)).map((a,x,m)=>l[i.metrics.indexOf(a)]+(x<m.length-1?'<div class="border-t border-slate-100 mx-4"></div>':"")).join(""),w=i.overallAverage>=2.5?"text-lime-600":i.overallAverage>=1.75?"text-amber-600":"text-rose-500";return`
          <div class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <!-- Card header -->
            <div class="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3">
              <div>
                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">${this.escape(i.category)}</span>
                <h4 class="font-bold text-slate-900 text-sm mt-0.5">${this.escape(i.title)}</h4>
                <p class="text-xs text-slate-500 mt-0.5">${i.count} annotation${i.count!==1?"s":""}</p>
              </div>
              <div class="text-right shrink-0">
                <span class="text-[10px] text-slate-400 font-medium">Overall avg</span>
                <div class="flex items-baseline gap-1 justify-end">
                  <span class="text-2xl font-extrabold ${w}">${i.overallAverage.toFixed(2)}</span>
                  <span class="text-xs text-slate-400 font-medium">/3</span>
                </div>
              </div>
            </div>

            <!-- Linguistic -->
            <div>
              <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-5 pt-3 pb-1 flex items-center gap-1.5">
                <span class="w-1 h-2.5 bg-slate-400 rounded-full inline-block"></span>
                Linguistic Dimensions
              </p>
              <div class="divide-y-0">${f}</div>
            </div>

            <!-- Task-oriented -->
            <div class="border-t border-slate-100">
              <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-5 pt-3 pb-1 flex items-center gap-1.5">
                <span class="w-1 h-2.5 bg-lime-500 rounded-full inline-block"></span>
                Task-Oriented Dimensions
              </p>
              <div class="divide-y-0 pb-2">${h}</div>
            </div>
          </div>
        `}).join(""),r='<p class="text-slate-400 text-xs italic">No comments submitted yet.</p>';e.recentFeedback&&e.recentFeedback.length>0&&(r=e.recentFeedback.map(i=>`
          <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
            <p class="text-slate-800 font-medium italic">"${this.escape(i.feedback)}"</p>
            <div class="mt-2 flex items-center justify-between text-slate-400">
              <span class="font-semibold text-slate-700">${this.escape(i.respondent||"Anonymous")}</span>
              <span>${this.formatDate(i.timestamp)}</span>
            </div>
          </div>
        `).join("")),this.innerHTML=`
      <div>
        <!-- Thank You Banner -->
        <div class="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 text-center shadow-sm mb-8 relative overflow-hidden">
          <div class="absolute -top-10 -right-10 w-32 h-32 bg-lime-100 rounded-full blur-2xl opacity-70 pointer-events-none"></div>
          <div class="w-16 h-16 bg-lime-100 border-2 border-lime-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <svg class="w-8 h-8 text-lime-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-950">QGEval Ratings Submitted!</h2>
          <p class="text-slate-600 text-sm mt-1.5 max-w-md mx-auto">
            Your annotations have been recorded. Below are the current aggregate scores across all annotators.
          </p>

          <div class="mt-6 flex flex-wrap justify-center gap-3">
            <button id="res-retake-btn" class="px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer">
              <svg class="w-4 h-4 text-lime-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              Rate Again
            </button>
            <button id="res-refresh-btn" class="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer">
              Refresh Live Data
            </button>
          </div>
        </div>

        <!-- Summary Stats -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overall QGEval Avg</span>
            <div class="flex items-baseline gap-2 mt-2">
              <span class="text-4xl font-extrabold text-slate-950">${e.overallAverage.toFixed(2)}</span>
              <span class="text-sm font-bold text-slate-400">/ 3</span>
              <span class="ml-auto px-2 py-0.5 rounded-md bg-lime-100 text-lime-800 text-xs font-semibold">Live</span>
            </div>
          </div>
          <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Submissions</span>
            <div class="flex items-baseline gap-2 mt-2">
              <span class="text-4xl font-extrabold text-slate-950">${e.totalResponses}</span>
              <span class="text-xs text-slate-500 font-medium">annotations</span>
            </div>
          </div>
          <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Metrics Evaluated</span>
            <div class="flex items-baseline gap-2 mt-2">
              <span class="text-4xl font-extrabold text-slate-950">${b.length}</span>
              <span class="text-xs text-slate-500 font-medium">QGEval dimensions</span>
            </div>
          </div>
        </div>

        <!-- Global Metric Averages -->
        <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-8">
          <h3 class="text-base font-bold text-slate-950 mb-1">Global Metric Averages</h3>
          <p class="text-xs text-slate-400 mb-4">Aggregated across all questions and all annotators</p>

          <!-- Legend -->
          <div class="flex items-center gap-4 mb-4 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            <span class="flex items-center gap-1"><span class="w-3 h-1.5 rounded bg-rose-400 inline-block"></span>Low (\u22641.75)</span>
            <span class="flex items-center gap-1"><span class="w-3 h-1.5 rounded bg-amber-400 inline-block"></span>Medium (\u22642.5)</span>
            <span class="flex items-center gap-1"><span class="w-3 h-1.5 rounded bg-lime-500 inline-block"></span>High (>2.5)</span>
          </div>

          <div class="divide-y divide-slate-100">
            ${t}
          </div>
        </div>

        <!-- Per Question Breakdown -->
        <div class="mb-8">
          <h3 class="text-base font-bold text-slate-950 mb-1 flex items-center justify-between">
            <span>Per-Question Breakdown</span>
            <span class="text-xs text-slate-400 font-normal">Scale 1\u20133</span>
          </h3>
          <p class="text-xs text-slate-400 mb-4">Distribution bars show annotator score distributions (1=rose, 2=amber, 3=lime)</p>
          <div class="space-y-4">
            ${s}
          </div>
        </div>

        <!-- Annotator Comments -->
        <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 class="text-sm font-bold uppercase tracking-wider text-slate-700 mb-4">
            Annotator Comments
          </h3>
          <div class="space-y-3">
            ${r}
          </div>
        </div>
      </div>
    `}bindEvents(){this.$("#res-retake-btn")?.addEventListener("click",()=>{this.surveyService.resetScores(),this.surveyService.setView("survey")}),this.$("#res-refresh-btn")?.addEventListener("click",()=>this.loadData())}escape(e){return e?e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"):""}formatDate(e){if(!e)return"";try{return new Date(e).toLocaleDateString(void 0,{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}catch{return""}}};I=d([p({selector:"app-results-view"})],I);var E=class extends c{surveyService=u(o);currentView="survey";unsubscribeView;ngOnInit(){this.currentView=this.surveyService.getView(),this.unsubscribeView=this.surveyService.onViewChange(e=>{this.currentView=e,this.renderView(),window.scrollTo({top:0,behavior:"smooth"})}),this.renderView()}ngOnDestroy(){this.unsubscribeView&&this.unsubscribeView()}render(){this.className="min-h-screen flex flex-col font-sans bg-[#fafafa] text-slate-900 selection:bg-lime-300 selection:text-black",this.innerHTML=`
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
            <span>Angular-Style Components</span>
          </div>
          <div class="text-slate-400">
            Tailwind CSS \u2022 Light Theme \u2022 Black / Grey / Lime
          </div>
        </div>
      </footer>
    `}renderView(){let e=this.$("#view-outlet");e&&(this.currentView==="survey"?e.innerHTML="<app-survey-form></app-survey-form>":e.innerHTML="<app-results-view></app-results-view>")}};E=d([p({selector:"app-root"})],E);console.log("[RatePulse] Angular-style components initialized successfully.");})();
//# sourceMappingURL=app.js.map
