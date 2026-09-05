document.addEventListener('DOMContentLoaded', () => {
  // State
  let questions = [];
  const selectedScores = {}; // questionId -> score (1..10)

  // DOM Elements
  const surveySection = document.getElementById('survey-section');
  const resultsSection = document.getElementById('results-section');
  const questionsContainer = document.getElementById('questions-container');
  const surveyForm = document.getElementById('survey-form');
  const submitBtn = document.getElementById('submit-btn');
  const formError = document.getElementById('form-error');
  const progressText = document.getElementById('progress-text');
  const progressFill = document.getElementById('progress-fill');

  const tabSurveyBtn = document.getElementById('tab-survey-btn');
  const tabResultsBtn = document.getElementById('tab-results-btn');
  const retakeSurveyBtn = document.getElementById('retake-survey-btn');
  const refreshStatsBtn = document.getElementById('refresh-stats-btn');

  // Stats DOM Elements
  const statAvgScore = document.getElementById('stat-avg-score');
  const statTotalCount = document.getElementById('stat-total-count');
  const resultsQuestionsList = document.getElementById('results-questions-list');
  const recentFeedbackList = document.getElementById('recent-feedback-list');

  // Initialize
  initApp();

  async function initApp() {
    setupEventListeners();
    await loadQuestions();
  }

  function setupEventListeners() {
    // Tab Navigation
    tabSurveyBtn.addEventListener('click', () => showTab('survey'));
    tabResultsBtn.addEventListener('click', () => {
      showTab('results');
      loadResults();
    });

    retakeSurveyBtn.addEventListener('click', () => {
      resetForm();
      showTab('survey');
    });

    refreshStatsBtn.addEventListener('click', () => {
      loadResults();
    });

    // Form Submission
    surveyForm.addEventListener('submit', handleFormSubmit);
  }

  function showTab(tab) {
    if (tab === 'survey') {
      surveySection.classList.remove('hidden');
      resultsSection.classList.add('hidden');
      tabSurveyBtn.className = 'px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-950 text-white transition-all';
      tabResultsBtn.className = 'px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-950 hover:bg-slate-100 transition-all';
    } else {
      surveySection.classList.add('hidden');
      resultsSection.classList.remove('hidden');
      tabSurveyBtn.className = 'px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-950 hover:bg-slate-100 transition-all';
      tabResultsBtn.className = 'px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-950 text-white transition-all';
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function loadQuestions() {
    try {
      const response = await fetch('/api/survey/questions');
      if (!response.ok) throw new Error('Failed to load questionnaire items');
      questions = await response.json();
      renderQuestions();
      updateProgress();
    } catch (err) {
      questionsContainer.innerHTML = `
        <div class="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center">
          <p class="text-rose-700 font-semibold text-sm">Error connecting to NestJS API: ${err.message}</p>
          <button onclick="location.reload()" class="mt-3 px-4 py-2 bg-rose-600 text-white text-xs rounded-xl font-bold">Retry</button>
        </div>
      `;
    }
  }

  function renderQuestions() {
    questionsContainer.innerHTML = '';

    questions.forEach((q, index) => {
      const card = document.createElement('div');
      card.className = 'clean-card p-6 sm:p-7 relative';
      card.id = `card-${q.id}`;

      // Scale 1 to 10 buttons HTML
      let buttonsHtml = '';
      for (let s = 1; s <= 10; s++) {
        buttonsHtml += `
          <button 
            type="button" 
            data-question-id="${q.id}" 
            data-score="${s}"
            aria-label="Score ${s} out of 10"
            class="score-btn"
          >
            <span class="text-base">${s}</span>
          </button>
        `;
      }

      card.innerHTML = `
        <div class="flex items-center justify-between gap-2 mb-3">
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider">
            Question ${index + 1} of ${questions.length} • ${q.category}
          </span>
          <span id="badge-${q.id}" class="text-xs font-semibold text-slate-400">Not rated</span>
        </div>

        <h3 class="text-lg sm:text-xl font-bold text-slate-950 tracking-tight mb-2">
          ${escapeHtml(q.title)}
        </h3>
        
        <p class="text-slate-600 text-sm leading-relaxed mb-6">
          ${escapeHtml(q.description)}
        </p>

        <!-- 1 to 10 Rating Controls -->
        <div>
          <div class="grid grid-cols-5 sm:grid-cols-10 gap-2 sm:gap-2.5">
            ${buttonsHtml}
          </div>

          <!-- Rating Scale Labels -->
          <div class="flex items-center justify-between text-xs text-slate-500 font-medium mt-3 px-1">
            <span class="flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
              ${escapeHtml(q.minLabel)}
            </span>
            <span class="flex items-center gap-1">
              ${escapeHtml(q.maxLabel)}
              <span class="w-1.5 h-1.5 rounded-full bg-lime-500"></span>
            </span>
          </div>
        </div>
      `;

      questionsContainer.appendChild(card);
    });

    // Attach click events to score buttons
    const buttons = questionsContainer.querySelectorAll('.score-btn');
    buttons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget;
        const qId = target.getAttribute('data-question-id');
        const score = parseInt(target.getAttribute('data-score'), 10);
        selectScore(qId, score);
      });
    });
  }

  function selectScore(questionId, score) {
    selectedScores[questionId] = score;

    // Update button visual states for this question
    const qButtons = questionsContainer.querySelectorAll(`button[data-question-id="${questionId}"]`);
    qButtons.forEach((btn) => {
      const btnScore = parseInt(btn.getAttribute('data-score'), 10);
      if (btnScore === score) {
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
      } else {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
      }
    });

    // Update badge status
    const badge = document.getElementById(`badge-${questionId}`);
    if (badge) {
      badge.innerHTML = `<span class="inline-flex items-center gap-1 text-slate-900 font-bold"><span class="w-2 h-2 rounded-full bg-lime-500"></span>Selected: ${score}/10</span>`;
    }

    // Hide error if shown
    formError.classList.add('hidden');
    formError.textContent = '';

    updateProgress();
  }

  function updateProgress() {
    const answeredCount = Object.keys(selectedScores).length;
    const total = questions.length;
    const percentage = total > 0 ? Math.round((answeredCount / total) * 100) : 0;

    if (progressText) {
      progressText.textContent = `${answeredCount} of ${total} Completed (${percentage}%)`;
    }
    if (progressFill) {
      progressFill.style.width = `${percentage}%`;
    }
  }

  async function handleFormSubmit(e) {
    e.preventDefault();

    // Check if all questions have a score
    const unanswered = questions.filter((q) => !selectedScores[q.id]);
    if (unanswered.length > 0) {
      formError.textContent = `Please select a score (1 to 10) for question: "${unanswered[0].title}".`;
      formError.classList.remove('hidden');

      // Scroll to the first unanswered question
      const targetCard = document.getElementById(`card-${unanswered[0].id}`);
      if (targetCard) {
        targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        targetCard.classList.add('ring-2', 'ring-rose-400');
        setTimeout(() => {
          targetCard.classList.remove('ring-2', 'ring-rose-400');
        }, 2000);
      }
      return;
    }

    // Format payload
    const answers = Object.entries(selectedScores).map(([questionId, score]) => ({
      questionId,
      score,
    }));

    const respondentName = document.getElementById('respondent-name').value.trim();
    const feedback = document.getElementById('feedback-text').value.trim();

    const payload = {
      answers,
      respondentName: respondentName || undefined,
      feedback: feedback || undefined,
    };

    // Submit state
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
      </svg>
      <span>Submitting Rating...</span>
    `;

    try {
      const response = await fetch('/api/survey/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Submission failed');
      }

      // Success: Load results view
      showTab('results');
      await loadResults();
    } catch (err) {
      formError.textContent = `Submission Error: ${err.message}`;
      formError.classList.remove('hidden');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `
        <span>Submit Rating Scores</span>
        <svg class="w-5 h-5 text-lime-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
        </svg>
      `;
    }
  }

  async function loadResults() {
    try {
      const response = await fetch('/api/survey/results');
      if (!response.ok) throw new Error('Failed to load results');
      const data = await response.json();
      renderResults(data);
    } catch (err) {
      console.error('Error fetching results:', err);
    }
  }

  function renderResults(data) {
    if (statAvgScore) statAvgScore.textContent = data.overallAverage.toFixed(1);
    if (statTotalCount) statTotalCount.textContent = data.totalResponses;

    // Render Question Breakdown
    if (resultsQuestionsList && data.questionStats) {
      resultsQuestionsList.innerHTML = data.questionStats
        .map((stat) => {
          // Find max percentage for bar scaling
          const barsHtml = stat.distribution
            .map((item) => {
              const heightPct = Math.max(item.percentage, 4);
              const isProminent = item.score >= 9;
              return `
                <div class="flex-1 flex flex-col items-center gap-1 group relative">
                  <div class="w-full bg-slate-100 rounded-t h-20 flex items-end justify-center p-0.5">
                    <div 
                      class="w-full ${isProminent ? 'bg-lime-500' : 'bg-slate-800'} rounded-t transition-all duration-500 hover:opacity-80" 
                      style="height: ${heightPct}%;"
                    ></div>
                  </div>
                  <span class="text-[10px] font-semibold text-slate-500">${item.score}</span>
                  <!-- Tooltip -->
                  <div class="absolute -top-7 hidden group-hover:block bg-slate-950 text-white text-[10px] font-medium px-1.5 py-0.5 rounded shadow whitespace-nowrap z-10">
                    ${item.count} responses (${item.percentage}%)
                  </div>
                </div>
              `;
            })
            .join('');

          return `
            <div class="border-b border-slate-100 last:border-0 pb-6 last:pb-0">
              <div class="flex items-center justify-between mb-2">
                <h4 class="font-bold text-slate-900 text-sm sm:text-base">${escapeHtml(stat.title)}</h4>
                <div class="flex items-baseline gap-1.5">
                  <span class="text-xs text-slate-400 font-medium">Avg:</span>
                  <span class="text-lg font-extrabold text-slate-950">${stat.averageScore.toFixed(1)}</span>
                  <span class="text-xs text-slate-400 font-medium">/ 10</span>
                </div>
              </div>
              
              <!-- Mini 1-10 Bar Chart -->
              <div class="mt-3">
                <div class="flex items-end gap-1.5 sm:gap-2">
                  ${barsHtml}
                </div>
                <div class="flex justify-between text-[10px] text-slate-400 font-medium mt-1">
                  <span>Score 1 (Low)</span>
                  <span>Score 10 (High)</span>
                </div>
              </div>
            </div>
          `;
        })
        .join('');
    }

    // Render Recent Comments
    if (recentFeedbackList) {
      if (data.recentFeedback && data.recentFeedback.length > 0) {
        recentFeedbackList.innerHTML = data.recentFeedback
          .map((item) => `
            <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
              <p class="text-slate-800 font-medium italic">"${escapeHtml(item.feedback)}"</p>
              <div class="mt-2 flex items-center justify-between text-slate-400">
                <span class="font-semibold text-slate-700">${escapeHtml(item.respondent || 'Anonymous')}</span>
                <span>${formatDate(item.timestamp)}</span>
              </div>
            </div>
          `)
          .join('');
      } else {
        recentFeedbackList.innerHTML = `
          <p class="text-slate-400 text-xs italic">No comments submitted yet.</p>
        `;
      }
    }
  }

  function resetForm() {
    // Clear selections
    for (const key in selectedScores) {
      delete selectedScores[key];
    }
    const buttons = questionsContainer.querySelectorAll('.score-btn');
    buttons.forEach((btn) => {
      btn.classList.remove('active');
      btn.setAttribute('aria-pressed', 'false');
    });

    questions.forEach((q) => {
      const badge = document.getElementById(`badge-${q.id}`);
      if (badge) badge.textContent = 'Not rated';
    });

    surveyForm.reset();
    formError.classList.add('hidden');
    formError.textContent = '';
    updateProgress();
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatDate(isoStr) {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }
});
