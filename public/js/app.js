(()=>{var k=Object.defineProperty;var $=Object.getOwnPropertyDescriptor;var a=(r,e,t,s)=>{for(var i=s>1?void 0:s?$(e,t):e,u=r.length-1,c;u>=0;u--)(c=r[u])&&(i=(s?c(e,t,i):c(i))||i);return s&&i&&k(e,t,i),i};var y=new Map;function S(r={providedIn:"root"}){return function(e){return e}}function l(r){return y.has(r)||y.set(r,new r),y.get(r)}var o=class extends HTMLElement{isInitialized=!1;connectedCallback(){this.render(),this.isInitialized||(this.isInitialized=!0,this.ngOnInit())}disconnectedCallback(){this.ngOnDestroy()}ngOnInit(){}ngOnDestroy(){}render(){}emit(e,t){this.dispatchEvent(new CustomEvent(e,{bubbles:!0,composed:!0,detail:t}))}$(e){return this.querySelector(e)}$$(e){return this.querySelectorAll(e)}};function d(r){return function(e){return customElements.get(r.selector)||customElements.define(r.selector,e),e.__metadata=r,e}}var n=class{questions=[];selectedScores=new Map;currentView="survey";cachedResults=null;viewListeners=new Set;scoreListeners=new Set;async getQuestions(){if(this.questions.length>0)return this.questions;let e=await fetch("/api/survey/questions");if(!e.ok)throw new Error(`Failed to load questionnaire items: ${e.statusText}`);return this.questions=await e.json(),this.questions}setScore(e,t){this.selectedScores.set(e,t),this.notifyScoreListeners()}getScore(e){return this.selectedScores.get(e)}getSelectedScores(){return new Map(this.selectedScores)}getAnsweredCount(){return this.selectedScores.size}getTotalQuestionsCount(){return this.questions.length}resetScores(){this.selectedScores.clear(),this.notifyScoreListeners()}async submitSurvey(e){let t=await fetch("/api/survey/submit",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)});if(!t.ok){let i=await t.json();throw new Error(i.message||"Submission failed")}let s=await t.json();return this.cachedResults=null,s}async getResults(){let e=await fetch("/api/survey/results");if(!e.ok)throw new Error(`Failed to fetch results: ${e.statusText}`);return this.cachedResults=await e.json(),this.cachedResults}setView(e){this.currentView=e,this.viewListeners.forEach(t=>t(e))}getView(){return this.currentView}onViewChange(e){return this.viewListeners.add(e),()=>this.viewListeners.delete(e)}onScoreChange(e){return this.scoreListeners.add(e),()=>this.scoreListeners.delete(e)}notifyScoreListeners(){let e=new Map(this.selectedScores);this.scoreListeners.forEach(t=>t(e))}};n=a([S()],n);var v=class extends o{surveyService=l(n);unsubscribeView;ngOnInit(){this.unsubscribeView=this.surveyService.onViewChange(()=>{this.updateActiveTabs()}),this.bindEvents(),this.updateActiveTabs()}ngOnDestroy(){this.unsubscribeView&&this.unsubscribeView()}render(){this.innerHTML=`
      <header class="border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-30">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="h-9 w-9 rounded-xl bg-slate-950 flex items-center justify-center shadow-sm">
              <span class="text-lime-400 font-extrabold text-lg leading-none">10</span>
            </div>
            <div>
              <span class="font-bold text-slate-950 tracking-tight text-base">RatePulse</span>
              <span class="hidden sm:inline text-xs text-slate-400 font-medium ml-1.5 border-l border-slate-200 pl-2">
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
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors ml-1">
              <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </header>
    `}bindEvents(){let e=this.$("#nav-survey-btn"),t=this.$("#nav-results-btn");e?.addEventListener("click",()=>{this.surveyService.setView("survey")}),t?.addEventListener("click",()=>{this.surveyService.setView("results")})}updateActiveTabs(){let e=this.surveyService.getView(),t=this.$("#nav-survey-btn"),s=this.$("#nav-results-btn");!t||!s||(e==="survey"?(t.className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-950 text-white transition-all shadow-sm",s.className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-950 hover:bg-slate-100 transition-all"):(t.className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-950 hover:bg-slate-100 transition-all",s.className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-950 text-white transition-all shadow-sm"))}};v=a([d({selector:"app-header"})],v);var b=class extends o{surveyService=l(n);questionId="";minLabel="";maxLabel="";selectedScore=null;unsubscribeScores;setProperties(e){this.questionId=e.questionId,this.minLabel=e.minLabel,this.maxLabel=e.maxLabel,this.selectedScore=e.selectedScore??null,this.render(),this.bindEvents()}ngOnInit(){if(!this.questionId){this.questionId=this.getAttribute("question-id")||"",this.minLabel=this.getAttribute("min-label")||"Low",this.maxLabel=this.getAttribute("max-label")||"High";let e=this.surveyService.getScore(this.questionId);e!==void 0&&(this.selectedScore=e),this.render(),this.bindEvents()}this.unsubscribeScores=this.surveyService.onScoreChange(e=>{let t=e.get(this.questionId)??null;t!==this.selectedScore&&(this.selectedScore=t,this.updateButtonStates())})}ngOnDestroy(){this.unsubscribeScores&&this.unsubscribeScores()}render(){let e="";for(let t=1;t<=10;t++){let s=this.selectedScore===t;e+=`
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
    `}bindEvents(){this.$$(".score-btn").forEach(t=>{t.addEventListener("click",()=>{let s=parseInt(t.getAttribute("data-score")||"0",10);s>=1&&s<=10&&(this.surveyService.setScore(this.questionId,s),this.emit("scoreSelected",{questionId:this.questionId,score:s}))})})}updateButtonStates(){this.$$(".score-btn").forEach(t=>{parseInt(t.getAttribute("data-score")||"0",10)===this.selectedScore?(t.classList.add("active"),t.setAttribute("aria-pressed","true")):(t.classList.remove("active"),t.setAttribute("aria-pressed","false"))})}escape(e){return e?e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"):""}};b=a([d({selector:"app-rating-scale"})],b);var h=class extends o{surveyService=l(n);questionData=null;index=0;total=0;unsubscribeScores;setQuestion(e,t,s){this.questionData=e,this.index=t,this.total=s,this.render(),this.initRatingComponent()}ngOnInit(){this.unsubscribeScores=this.surveyService.onScoreChange(e=>{if(this.questionData){let t=e.get(this.questionData.id);this.updateBadge(t)}})}ngOnDestroy(){this.unsubscribeScores&&this.unsubscribeScores()}render(){if(!this.questionData)return;let e=this.questionData,t=this.surveyService.getScore(e.id);this.className="block",this.innerHTML=`
      <div id="card-${e.id}" class="clean-card p-6 sm:p-7 relative transition-all">
        <div class="flex items-center justify-between gap-2 mb-3">
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider">
            Question ${this.index+1} of ${this.total} \u2022 ${this.escape(e.category)}
          </span>
          <span id="badge-${e.id}" class="text-xs font-semibold text-slate-400">
            ${t!==void 0?`<span class="inline-flex items-center gap-1 text-slate-900 font-bold"><span class="w-2 h-2 rounded-full bg-lime-500"></span>Selected: ${t}/10</span>`:"Not rated"}
          </span>
        </div>

        <h3 class="text-lg sm:text-xl font-bold text-slate-950 tracking-tight mb-2">
          ${this.escape(e.title)}
        </h3>
        
        <p class="text-slate-600 text-sm leading-relaxed mb-6">
          ${this.escape(e.description)}
        </p>

        <!-- Rating Scale Sub-component -->
        <app-rating-scale id="rating-${e.id}"></app-rating-scale>
      </div>
    `}initRatingComponent(){if(!this.questionData)return;let e=this.$(`#rating-${this.questionData.id}`);e&&e.setProperties({questionId:this.questionData.id,minLabel:this.questionData.minLabel,maxLabel:this.questionData.maxLabel,selectedScore:this.surveyService.getScore(this.questionData.id)})}updateBadge(e){if(!this.questionData)return;let t=this.$(`#badge-${this.questionData.id}`);t&&(e!==void 0?t.innerHTML=`<span class="inline-flex items-center gap-1 text-slate-900 font-bold"><span class="w-2 h-2 rounded-full bg-lime-500"></span>Selected: ${e}/10</span>`:t.textContent="Not rated")}escape(e){return e?e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"):""}};h=a([d({selector:"app-question-card"})],h);var x=class extends o{surveyService=l(n);questions=[];isLoading=!0;isSubmitting=!1;errorMessage="";unsubscribeScores;async ngOnInit(){this.unsubscribeScores=this.surveyService.onScoreChange(()=>{this.updateProgress()});try{this.questions=await this.surveyService.getQuestions(),this.isLoading=!1,this.render(),this.initQuestionCards(),this.bindFormEvents(),this.updateProgress()}catch(e){this.isLoading=!1,this.errorMessage=e.message||"Error loading questionnaire",this.render()}}ngOnDestroy(){this.unsubscribeScores&&this.unsubscribeScores()}render(){if(this.isLoading){this.innerHTML=`
        <div class="p-10 text-center bg-white rounded-2xl border border-slate-200 shadow-sm animate-pulse">
          <p class="text-slate-500 text-sm font-medium">Loading questionnaire items...</p>
        </div>
      `;return}if(this.errorMessage&&this.questions.length===0){this.innerHTML=`
        <div class="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center">
          <p class="text-rose-700 font-semibold text-sm">${this.escape(this.errorMessage)}</p>
          <button id="retry-btn" class="mt-3 px-4 py-2 bg-rose-600 text-white text-xs rounded-xl font-bold">Retry</button>
        </div>
      `,this.$("#retry-btn")?.addEventListener("click",()=>location.reload());return}this.innerHTML=`
      <div>
        <!-- Title & Context -->
        <div class="mb-8">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime-100 border border-lime-300/80 text-lime-900 text-xs font-semibold uppercase tracking-wider mb-3">
            <span class="w-2 h-2 rounded-full bg-lime-500 animate-pulse"></span>
            Score Scale: 1 to 10
          </div>
          <h1 class="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
            Performance & Experience Survey
          </h1>
          <p class="mt-2 text-slate-600 text-sm sm:text-base leading-relaxed">
            Please rate each dimension on a scale from <span class="font-semibold text-slate-900">1 (lowest)</span> to <span class="font-semibold text-slate-900">10 (highest)</span>. Your input directly shapes our future improvements.
          </p>
        </div>

        <!-- Progress Bar Card -->
        <div class="bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-sm">
          <div class="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
            <span>Question Progress</span>
            <span id="progress-text" class="font-semibold text-slate-900">0 of ${this.questions.length} Completed</span>
          </div>
          <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div id="progress-fill" class="bg-lime-500 h-2 rounded-full transition-all duration-300" style="width: 0%;"></div>
          </div>
        </div>

        <!-- Survey Form -->
        <form id="survey-form-el" class="space-y-6" novalidate>
          
          <!-- Questions List -->
          <div id="questions-list-container" class="space-y-6"></div>

          <!-- Optional Respondent & Comment Card -->
          <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 class="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-slate-900 rounded-full"></span>
              Additional Context (Optional)
            </h2>
            
            <div class="grid grid-cols-1 gap-4">
              <div>
                <label for="respondent-name" class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Your Name / Team
                </label>
                <input 
                  type="text" 
                  id="respondent-name" 
                  name="respondentName" 
                  placeholder="e.g. Sarah Connor or Team DevOps" 
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm placeholder-slate-400 focus:bg-white focus:border-slate-400 transition-colors"
                >
              </div>
              
              <div>
                <label for="feedback-text" class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Feedback or Suggestions
                </label>
                <textarea 
                  id="feedback-text" 
                  name="feedback" 
                  rows="3" 
                  placeholder="What could we do to turn your 8 or 9 into a perfect 10?" 
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm placeholder-slate-400 focus:bg-white focus:border-slate-400 transition-colors resize-y"
                ></textarea>
              </div>
            </div>
          </div>

          <!-- Submit Button Bar -->
          <div class="pt-2">
            <button 
              type="submit" 
              id="submit-btn" 
              class="w-full py-4 px-6 rounded-xl bg-slate-950 hover:bg-slate-800 active:bg-slate-900 text-white font-bold text-base transition-all duration-150 flex items-center justify-center gap-3 shadow-md hover:shadow-lg focus:ring-4 focus:ring-lime-400/40 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Submit Rating Scores</span>
              <svg class="w-5 h-5 text-lime-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
              </svg>
            </button>
            <p id="form-error" class="hidden text-rose-600 text-xs text-center font-medium mt-2"></p>
          </div>
        </form>
      </div>
    `}initQuestionCards(){let e=this.$("#questions-list-container");e&&(e.innerHTML="",this.questions.forEach((t,s)=>{let i=document.createElement("app-question-card");i.id=`qcard-${t.id}`,e.appendChild(i),i.setQuestion(t,s,this.questions.length)}))}bindFormEvents(){this.$("#survey-form-el")?.addEventListener("submit",t=>this.handleSubmit(t))}updateProgress(){let e=this.surveyService.getAnsweredCount(),t=this.questions.length,s=t>0?Math.round(e/t*100):0,i=this.$("#progress-text"),u=this.$("#progress-fill");i&&(i.textContent=`${e} of ${t} Completed (${s}%)`),u&&(u.style.width=`${s}%`)}async handleSubmit(e){e.preventDefault();let t=this.$("#form-error"),s=this.surveyService.getSelectedScores(),i=this.questions.filter(m=>!s.has(m.id));if(i.length>0){t&&(t.textContent=`Please select a score (1 to 10) for: "${i[0].title}".`,t.classList.remove("hidden")),this.$(`#qcard-${i[0].id}`)?.scrollIntoView({behavior:"smooth",block:"center"});return}let u=Array.from(s.entries()).map(([m,L])=>({questionId:m,score:L})),c=this.$("#respondent-name")?.value.trim(),w=this.$("#feedback-text")?.value.trim(),p=this.$("#submit-btn");p&&(p.disabled=!0,p.innerHTML=`
        <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
        <span>Submitting Rating...</span>
      `);try{await this.surveyService.submitSurvey({answers:u,respondentName:c||void 0,feedback:w||void 0}),this.surveyService.setView("results")}catch(m){t&&(t.textContent=`Submission Error: ${m.message}`,t.classList.remove("hidden"))}finally{p&&(p.disabled=!1,p.innerHTML=`
          <span>Submit Rating Scores</span>
          <svg class="w-5 h-5 text-lime-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
          </svg>
        `)}}escape(e){return e?e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"):""}};x=a([d({selector:"app-survey-form"})],x);var g=class extends o{surveyService=l(n);resultsData=null;isLoading=!0;async ngOnInit(){await this.loadData()}async loadData(){this.isLoading=!0,this.renderLoading();try{this.resultsData=await this.surveyService.getResults(),this.isLoading=!1,this.render(),this.bindEvents()}catch{this.isLoading=!1,this.innerHTML=`
        <div class="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center">
          <p class="text-rose-700 font-semibold text-sm">Error loading results</p>
          <button id="res-retry-btn" class="mt-3 px-4 py-2 bg-rose-600 text-white text-xs rounded-xl font-bold">Retry</button>
        </div>
      `,this.$("#res-retry-btn")?.addEventListener("click",()=>this.loadData())}}renderLoading(){this.innerHTML=`
      <div class="p-10 text-center bg-white rounded-2xl border border-slate-200 shadow-sm animate-pulse">
        <p class="text-slate-500 text-sm font-medium">Aggregating score analytics...</p>
      </div>
    `}render(){if(!this.resultsData)return;let e=this.resultsData,t=e.questionStats.map(i=>{let u=i.distribution.map(c=>{let w=Math.max(c.percentage,4);return`
              <div class="flex-1 flex flex-col items-center gap-1 group relative">
                <div class="w-full bg-slate-100 rounded-t h-20 flex items-end justify-center p-0.5">
                  <div 
                    class="w-full ${c.score>=9?"bg-lime-500":"bg-slate-800"} rounded-t transition-all duration-500 hover:opacity-80" 
                    style="height: ${w}%;"
                  ></div>
                </div>
                <span class="text-[10px] font-semibold text-slate-500">${c.score}</span>
                <div class="absolute -top-7 hidden group-hover:block bg-slate-950 text-white text-[10px] font-medium px-1.5 py-0.5 rounded shadow whitespace-nowrap z-10">
                  ${c.count} responses (${c.percentage}%)
                </div>
              </div>
            `}).join("");return`
          <div class="border-b border-slate-100 last:border-0 pb-6 last:pb-0">
            <div class="flex items-center justify-between mb-2">
              <h4 class="font-bold text-slate-900 text-sm sm:text-base">${this.escape(i.title)}</h4>
              <div class="flex items-baseline gap-1.5">
                <span class="text-xs text-slate-400 font-medium">Avg:</span>
                <span class="text-lg font-extrabold text-slate-950">${i.averageScore.toFixed(1)}</span>
                <span class="text-xs text-slate-400 font-medium">/ 10</span>
              </div>
            </div>
            
            <div class="mt-3">
              <div class="flex items-end gap-1.5 sm:gap-2">
                ${u}
              </div>
              <div class="flex justify-between text-[10px] text-slate-400 font-medium mt-1">
                <span>Score 1 (Low)</span>
                <span>Score 10 (High)</span>
              </div>
            </div>
          </div>
        `}).join(""),s='<p class="text-slate-400 text-xs italic">No comments submitted yet.</p>';e.recentFeedback&&e.recentFeedback.length>0&&(s=e.recentFeedback.map(i=>`
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
          <div class="w-16 h-16 bg-lime-100 border-2 border-lime-400 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-950 shadow-sm">
            <svg class="w-8 h-8 text-lime-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-950">Thank You For Your Rating!</h2>
          <p class="text-slate-600 text-sm mt-1.5 max-w-md mx-auto">
            Your score has been registered in the system. Below are the current aggregate scores across all respondents.
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

        <!-- Global Summary Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overall Average Score</span>
            <div class="flex items-baseline gap-2 mt-2">
              <span class="text-4xl font-extrabold text-slate-950">${e.overallAverage.toFixed(1)}</span>
              <span class="text-sm font-bold text-slate-400">/ 10</span>
              <span class="ml-auto px-2 py-0.5 rounded-md bg-lime-100 text-lime-800 text-xs font-semibold">Live</span>
            </div>
          </div>

          <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Submissions</span>
            <div class="flex items-baseline gap-2 mt-2">
              <span class="text-4xl font-extrabold text-slate-950">${e.totalResponses}</span>
              <span class="text-xs text-slate-500 font-medium">responses recorded</span>
            </div>
          </div>
        </div>

        <!-- Per Question Breakdown -->
        <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-8">
          <h3 class="text-base font-bold text-slate-950 mb-4 flex items-center justify-between">
            <span>Question Score Breakdown</span>
            <span class="text-xs text-slate-400 font-normal">Scale 1\u201310</span>
          </h3>
          <div class="space-y-6">
            ${t}
          </div>
        </div>

        <!-- Comments -->
        <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 class="text-sm font-bold uppercase tracking-wider text-slate-700 mb-4">
            Recent Respondent Comments
          </h3>
          <div class="space-y-3">
            ${s}
          </div>
        </div>
      </div>
    `}bindEvents(){let e=this.$("#res-retake-btn"),t=this.$("#res-refresh-btn");e?.addEventListener("click",()=>{this.surveyService.resetScores(),this.surveyService.setView("survey")}),t?.addEventListener("click",()=>{this.loadData()})}escape(e){return e?e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"):""}formatDate(e){if(!e)return"";try{return new Date(e).toLocaleDateString(void 0,{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}catch{return""}}};g=a([d({selector:"app-results-view"})],g);var f=class extends o{surveyService=l(n);currentView="survey";unsubscribeView;ngOnInit(){this.currentView=this.surveyService.getView(),this.unsubscribeView=this.surveyService.onViewChange(e=>{this.currentView=e,this.renderView(),window.scrollTo({top:0,behavior:"smooth"})}),this.renderView()}ngOnDestroy(){this.unsubscribeView&&this.unsubscribeView()}render(){this.className="min-h-screen flex flex-col font-sans bg-[#fafafa] text-slate-900 selection:bg-lime-300 selection:text-black",this.innerHTML=`
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
    `}renderView(){let e=this.$("#view-outlet");e&&(this.currentView==="survey"?e.innerHTML="<app-survey-form></app-survey-form>":e.innerHTML="<app-results-view></app-results-view>")}};f=a([d({selector:"app-root"})],f);console.log("[RatePulse] Angular-style components initialized successfully.");})();
//# sourceMappingURL=app.js.map
