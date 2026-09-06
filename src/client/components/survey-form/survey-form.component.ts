import { Component, BaseComponent } from '../../core/component.decorator';
import { inject } from '../../core/injectable.decorator';
import { SurveyService, Question, QGEVAL_METRICS, MetricId } from '../../services/survey.service';
import { QuestionCardComponent } from '../question-card/question-card.component';

@Component({
  selector: 'app-survey-form',
})
export class SurveyFormComponent extends BaseComponent {
  private surveyService = inject(SurveyService);
  private questions: Question[] = [];
  private currentIndex = 0;
  private isLoading = true;
  private isSubmitting = false;
  private errorMessage = '';
  private unsubscribeScores?: () => void;

  async ngOnInit(): Promise<void> {
    this.unsubscribeScores = this.surveyService.onScoreChange(() => {
      this.updateProgressBar();
      this.updateButtonStates();
      this.updateCardBadge();
    });

    try {
      this.questions = await this.surveyService.getQuestions();
      this.isLoading = false;
      this.currentIndex = 0;
      this.render();
      this.mountCurrentCard();
      this.bindNavEvents();
      this.updateProgressBar();
      this.updateButtonStates();
    } catch (err: any) {
      this.isLoading = false;
      this.errorMessage = err.message || 'Error loading questionnaire';
      this.renderError();
    }
  }

  ngOnDestroy(): void {
    this.unsubscribeScores?.();
  }

  // ─── Shell render ─────────────────────────────────────────────────────────
  render(): void {
    if (this.isLoading) {
      this.innerHTML = `
        <div class="p-10 text-center bg-white rounded-2xl border border-slate-200 shadow-sm animate-pulse">
          <p class="text-slate-500 text-sm font-medium">Loading questionnaire items…</p>
        </div>`;
      return;
    }

    const total = this.questions.length;

    this.innerHTML = `
      <div>
        <!-- Header -->
        <div class="mb-6">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime-100 border border-lime-300/80 text-lime-900 text-xs font-semibold uppercase tracking-wider mb-3">
            <span class="w-2 h-2 rounded-full bg-lime-500 animate-pulse"></span>
            QGEval Scale: 1 · 2 · 3
          </div>
          <h1 class="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
            VQA Question Quality Evaluation
          </h1>
          <p class="mt-2 text-slate-600 text-sm sm:text-base leading-relaxed">
            Rate all <span class="font-semibold text-slate-900">${QGEVAL_METRICS.length} QGEval metrics</span>
            (scale 1–3) for each generated question. Use <strong>Next</strong> to proceed or <strong>Finish</strong> to submit at any time.
          </p>
        </div>

        <!-- Step progress row -->
        <div class="bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-sm">
          <div class="flex items-center justify-between text-xs font-medium text-slate-500 mb-3">
            <span>Question Progress</span>
            <span id="progress-text" class="font-semibold text-slate-900">
              Question 1 of ${total}
            </span>
          </div>

          <!-- Step dots -->
          <div class="flex items-center gap-1.5 mb-3 flex-wrap">
            ${this.questions
              .map((_, i) => `
                <button
                  type="button"
                  data-step="${i}"
                  id="step-dot-${i}"
                  aria-label="Go to question ${i + 1}"
                  class="step-dot w-7 h-7 rounded-lg text-[10px] font-bold border-2 transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-lime-400"
                >${i + 1}</button>
              `)
              .join('')}
          </div>

          <!-- Progress bar -->
          <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div id="progress-fill" class="bg-lime-500 h-1.5 rounded-full transition-all duration-300" style="width:0%;"></div>
          </div>
          <p class="text-[10px] text-slate-400 mt-1.5">
            <span id="progress-sub">0 of ${total} questions fully rated (all ${QGEVAL_METRICS.length} metrics each)</span>
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
    `;
  }

  private renderError(): void {
    this.innerHTML = `
      <div class="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center">
        <p class="text-rose-700 font-semibold text-sm">${this.escape(this.errorMessage)}</p>
        <button id="retry-btn" class="mt-3 px-4 py-2 bg-rose-600 text-white text-xs rounded-xl font-bold">Retry</button>
      </div>`;
    this.$('#retry-btn')?.addEventListener('click', () => location.reload());
  }

  // ─── Mount the card for the current question ──────────────────────────────
  private mountCurrentCard(): void {
    const slot = this.$('#card-slot');
    if (!slot) return;

    slot.innerHTML = '';

    const q = this.questions[this.currentIndex];
    if (!q) return;

    const card = document.createElement('app-question-card') as QuestionCardComponent;
    card.id = `qcard-${q.id}`;
    slot.appendChild(card);
    card.setQuestion(q, this.currentIndex, this.questions.length);
  }

  // ─── Event bindings ───────────────────────────────────────────────────────
  private bindNavEvents(): void {
    // Step dots
    this.$$<HTMLButtonElement>('.step-dot').forEach((dot) => {
      dot.addEventListener('click', () => {
        const idx = parseInt(dot.getAttribute('data-step') || '0', 10);
        this.navigateTo(idx);
      });
    });

    this.$('#prev-btn')?.addEventListener('click', () => {
      if (this.currentIndex > 0) this.navigateTo(this.currentIndex - 1);
    });

    this.$('#next-btn')?.addEventListener('click', () => {
      if (this.currentIndex < this.questions.length - 1) {
        this.navigateTo(this.currentIndex + 1);
      }
    });

    this.$('#finish-btn')?.addEventListener('click', () => this.handleFinish());
  }

  private navigateTo(index: number): void {
    if (index < 0 || index >= this.questions.length) return;
    this.currentIndex = index;
    this.mountCurrentCard();
    this.updateProgressBar();
    this.updateButtonStates();
    this.updateStepDots();
    this.toggleExtraFields();

    // Scroll card into view smoothly
    this.$('#card-slot')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ─── State updates ────────────────────────────────────────────────────────
  private updateProgressBar(): void {
    const answered = this.surveyService.getAnsweredCount();
    const total = this.questions.length;
    const pct = total > 0 ? Math.round((answered / total) * 100) : 0;

    const progressText = this.$('#progress-text');
    const progressFill = this.$<HTMLElement>('#progress-fill');
    const progressSub = this.$('#progress-sub');

    if (progressText) {
      progressText.textContent = `Question ${this.currentIndex + 1} of ${total}`;
    }
    if (progressFill) {
      progressFill.style.width = `${pct}%`;
    }
    if (progressSub) {
      progressSub.textContent = `${answered} of ${total} questions fully rated (all ${QGEVAL_METRICS.length} metrics each)`;
    }
  }

  private updateButtonStates(): void {
    const prevBtn = this.$<HTMLButtonElement>('#prev-btn');
    const nextBtn = this.$<HTMLButtonElement>('#next-btn');
    const isLast = this.currentIndex === this.questions.length - 1;
    const isFirst = this.currentIndex === 0;

    if (prevBtn) prevBtn.disabled = isFirst;

    if (nextBtn) {
      if (isLast) {
        nextBtn.classList.add('opacity-40', 'cursor-not-allowed');
        nextBtn.disabled = true;
      } else {
        nextBtn.classList.remove('opacity-40', 'cursor-not-allowed');
        nextBtn.disabled = false;
      }
    }
  }

  private updateStepDots(): void {
    this.$$<HTMLButtonElement>('.step-dot').forEach((dot, i) => {
      const isFullyRated = this.surveyService.isQuestionFullyAnswered(this.questions[i]?.id);
      const isCurrent = i === this.currentIndex;

      dot.className = [
        'step-dot w-7 h-7 rounded-lg text-[10px] font-bold border-2 transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-lime-400',
        isCurrent
          ? 'bg-slate-950 border-slate-950 text-white scale-110 shadow'
          : isFullyRated
            ? 'bg-lime-500 border-lime-600 text-white'
            : 'bg-white border-slate-300 text-slate-500 hover:border-slate-400',
      ].join(' ');
    });
  }

  private updateCardBadge(): void {
    // The QuestionCardComponent updates its own badge via score listener — no extra work needed
  }

  private toggleExtraFields(): void {
    const extraFields = this.$('#extra-fields');
    if (!extraFields) return;
    const isLast = this.currentIndex === this.questions.length - 1;
    if (isLast) {
      extraFields.classList.remove('hidden');
    } else {
      extraFields.classList.add('hidden');
    }
  }

  // ─── Finish / Submit ──────────────────────────────────────────────────────
  private async handleFinish(): Promise<void> {
    const errorEl = this.$('#form-error');

    // Validate: find first question not fully rated
    const unanswered = this.questions.filter((q) => !this.surveyService.isQuestionFullyAnswered(q.id));

    if (unanswered.length > 0) {
      const q = unanswered[0];
      const scores = this.surveyService.getScores(q.id);
      const missingMetrics = QGEVAL_METRICS.filter((m) => scores[m.id as MetricId] === undefined);
      const missingLabel = missingMetrics[0]?.label ?? 'a metric';

      // Navigate to the first unanswered question
      const idx = this.questions.indexOf(q);
      if (idx !== this.currentIndex) this.navigateTo(idx);

      if (errorEl) {
        errorEl.textContent = `Please rate "${missingLabel}" for Question ${idx + 1} before finishing.`;
        errorEl.classList.remove('hidden');
      }
      return;
    }

    if (errorEl) errorEl.classList.add('hidden');

    // Build payload
    const selectedScores = this.surveyService.getSelectedScores();
    const answers = Array.from(selectedScores.entries()).map(([questionId, scores]) => ({
      questionId,
      scores,
    }));

    const respondentName = this.$<HTMLInputElement>('#respondent-name')?.value.trim();
    const feedback = this.$<HTMLTextAreaElement>('#feedback-text')?.value.trim();

    // Update finish button to loading state
    const finishBtn = this.$<HTMLButtonElement>('#finish-btn');
    const nextBtn = this.$<HTMLButtonElement>('#next-btn');
    if (finishBtn) {
      finishBtn.disabled = true;
      finishBtn.innerHTML = `
        <svg class="animate-spin h-4 w-4 text-lime-600" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
        <span>Submitting…</span>
      `;
    }
    if (nextBtn) nextBtn.disabled = true;

    try {
      await this.surveyService.submitSurvey({
        answers,
        respondentName: respondentName || undefined,
        feedback: feedback || undefined,
      });

      this.surveyService.setView('results');
    } catch (err: any) {
      if (errorEl) {
        errorEl.textContent = `Submission Error: ${err.message}`;
        errorEl.classList.remove('hidden');
      }
      // Restore button
      if (finishBtn) {
        finishBtn.disabled = false;
        finishBtn.innerHTML = `
          <svg class="w-4 h-4 text-lime-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
          </svg>
          Finish
        `;
      }
      if (nextBtn) nextBtn.disabled = this.currentIndex === this.questions.length - 1;
    }
  }

  private escape(str: string): string {
    return str ? str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
  }
}
