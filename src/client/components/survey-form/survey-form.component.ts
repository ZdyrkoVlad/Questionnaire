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
  private totalQuestionsInDb = 1;
  private currentQuestionId = 1;
  private isLoading = true;
  private isFetchingQuestion = false;
  private errorMessage = '';
  private unsubscribeScores?: () => void;

  async ngOnInit(): Promise<void> {
    this.unsubscribeScores = this.surveyService.onScoreChange(() => {
      this.updateButtonStates();
    });

    try {
      // Fetch total count and initial question
      this.totalQuestionsInDb = await this.surveyService.getTotalQuestionsCount();
      this.questions = await this.surveyService.getQuestions();

      if (this.questions.length > 0) {
        const first = this.questions[0];
        const rawId = first.numericId !== undefined ? first.numericId : parseInt(first.id, 10);
        this.currentQuestionId = !isNaN(rawId) && rawId > 0 ? rawId : 1;
      }

      this.isLoading = false;
      this.render();
      this.mountCurrentCard();
      this.bindNavEvents();
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
          <div class="w-8 h-8 border-3 border-lime-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p class="text-slate-600 text-sm font-semibold">Завантаження опитувальника…</p>
        </div>`;
      return;
    }

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
            Оцініть <span class="font-semibold text-slate-900">${QGEVAL_METRICS.length} метрик QGEval</span>
            (шкала 1–3) для згенерованого запитання. Виберіть потрібний індекс для перегляду будь-якого запитання з бази.
          </p>
        </div>

        <!-- Question Index Selection Bar (Replaces old Progress Bar) -->
        <div class="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 mb-6 shadow-sm">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div>
              <label for="question-index-input" class="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-lime-500"></span>
                Номер / Індекс запитання в базі даних
              </label>
              <p class="text-xs text-slate-500 mt-0.5">
                Введіть індекс від <span class="font-bold text-slate-900">1</span> до <span id="max-questions-count" class="font-bold text-slate-900">${this.totalQuestionsInDb}</span> для завантаження з MongoDB
              </p>
            </div>
            
            <div class="flex items-center gap-2 self-start sm:self-auto">
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200/60">
                Всього в БД: <strong id="db-total-badge" class="font-bold text-slate-950">${this.totalQuestionsInDb}</strong>
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
                placeholder="Введіть індекс..."
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
              <span>Знайти в БД</span>
            </button>

            <!-- Quick Step Prev / Next Buttons -->
            <button
              type="button"
              id="step-prev-btn"
              title="Попереднє питання (ID - 1)"
              class="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all active:scale-95 cursor-pointer"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              id="step-next-btn"
              title="Наступне питання (ID + 1)"
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
              <span>🎲</span>
              <span class="hidden sm:inline">Випадкове</span>
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
            <span>Завантаження запитання з бази даних...</span>
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
            Зберегти оцінку
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

  private renderError(): void {
    this.innerHTML = `
      <div class="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center">
        <p class="text-rose-700 font-semibold text-sm">${this.escape(this.errorMessage)}</p>
        <button id="retry-btn" class="mt-3 px-4 py-2 bg-rose-600 text-white text-xs rounded-xl font-bold">Спробувати знову</button>
      </div>`;
    this.$('#retry-btn')?.addEventListener('click', () => location.reload());
  }

  // ─── Mount the card for the current question ──────────────────────────────
  private mountCurrentCard(): void {
    const slot = this.$('#card-slot');
    if (!slot) return;

    slot.innerHTML = '';

    const q = this.questions[0];
    if (!q) {
      slot.innerHTML = `
        <div class="p-8 text-center bg-white border border-slate-200 rounded-2xl">
          <p class="text-slate-500 text-sm">Запитання не знайдено.</p>
        </div>`;
      return;
    }

    const card = document.createElement('app-question-card') as QuestionCardComponent;
    card.id = `qcard-${q.id}`;
    slot.appendChild(card);
    card.setQuestion(q, this.currentQuestionId - 1, this.totalQuestionsInDb);
  }

  // ─── Event bindings ───────────────────────────────────────────────────────
  private bindNavEvents(): void {
    const inputEl = this.$<HTMLInputElement>('#question-index-input');
    const loadBtn = this.$<HTMLButtonElement>('#load-question-btn');
    const stepPrevBtn = this.$<HTMLButtonElement>('#step-prev-btn');
    const stepNextBtn = this.$<HTMLButtonElement>('#step-next-btn');
    const randomBtn = this.$<HTMLButtonElement>('#random-question-btn');

    // Bottom buttons
    const prevBtn = this.$<HTMLButtonElement>('#prev-btn');
    const nextBtn = this.$<HTMLButtonElement>('#next-btn');
    const finishBtn = this.$<HTMLButtonElement>('#finish-btn');

    const handleLoadFromInput = () => {
      if (!inputEl) return;
      const val = parseInt(inputEl.value, 10);
      if (isNaN(val)) {
        this.showIndexError('Будь ласка, введіть коректний числовий індекс');
        return;
      }
      this.loadQuestionById(val);
    };

    loadBtn?.addEventListener('click', handleLoadFromInput);

    inputEl?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        handleLoadFromInput();
      }
    });

    stepPrevBtn?.addEventListener('click', () => {
      if (this.currentQuestionId > 1) {
        this.loadQuestionById(this.currentQuestionId - 1);
      }
    });

    stepNextBtn?.addEventListener('click', () => {
      this.loadQuestionById(this.currentQuestionId + 1);
    });

    randomBtn?.addEventListener('click', () => {
      const max = Math.max(1, this.totalQuestionsInDb);
      const randomId = Math.floor(Math.random() * max) + 1;
      this.loadQuestionById(randomId);
    });

    prevBtn?.addEventListener('click', () => {
      if (this.currentQuestionId > 1) {
        this.loadQuestionById(this.currentQuestionId - 1);
      }
    });

    nextBtn?.addEventListener('click', () => {
      this.loadQuestionById(this.currentQuestionId + 1);
    });

    finishBtn?.addEventListener('click', () => this.handleFinish());
  }

  /**
   * Loads a question by its index from MongoDB
   */
  private async loadQuestionById(index: number): Promise<void> {
    if (this.isFetchingQuestion) return;

    if (index < 1) {
      this.showIndexError('Індекс запитання має бути не менше 1');
      return;
    }

    if (this.totalQuestionsInDb > 0 && index > this.totalQuestionsInDb) {
      this.showIndexError(`Індекс ${index} перевищує загальну кількість запитань у БД (${this.totalQuestionsInDb})`);
      return;
    }

    this.hideIndexError();
    this.showIndexLoading(true);
    this.isFetchingQuestion = true;

    try {
      const q = await this.surveyService.fetchQuestionByIndex(index);
      this.questions = [q];
      this.currentQuestionId = index;

      // Update input display
      const inputEl = this.$<HTMLInputElement>('#question-index-input');
      if (inputEl) inputEl.value = index.toString();

      this.mountCurrentCard();
      this.updateButtonStates();

      // Smooth scroll to card
      this.$('#card-slot')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err: any) {
      this.showIndexError(err.message || `Не вдалося отримати питання #${index}`);
    } finally {
      this.showIndexLoading(false);
      this.isFetchingQuestion = false;
    }
  }

  private showIndexError(message: string): void {
    const errBox = this.$('#index-error-msg');
    const errText = this.$('#index-error-text');
    if (errBox && errText) {
      errText.textContent = message;
      errBox.classList.remove('hidden');
    }
  }

  private hideIndexError(): void {
    const errBox = this.$('#index-error-msg');
    if (errBox) {
      errBox.classList.add('hidden');
    }
  }

  private showIndexLoading(show: boolean): void {
    const loader = this.$('#index-loading-msg');
    if (!loader) return;
    if (show) {
      loader.classList.remove('hidden');
    } else {
      loader.classList.add('hidden');
    }
  }

  private updateButtonStates(): void {
    const prevBtn = this.$<HTMLButtonElement>('#prev-btn');
    const nextBtn = this.$<HTMLButtonElement>('#next-btn');
    const stepPrevBtn = this.$<HTMLButtonElement>('#step-prev-btn');
    const stepNextBtn = this.$<HTMLButtonElement>('#step-next-btn');

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
        stepPrevBtn.classList.add('opacity-40', 'cursor-not-allowed');
      } else {
        stepPrevBtn.classList.remove('opacity-40', 'cursor-not-allowed');
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
        nextBtn.classList.add('opacity-40', 'cursor-not-allowed');
      } else {
        nextBtn.classList.remove('opacity-40', 'cursor-not-allowed');
      }
    }

    if (stepNextBtn) {
      stepNextBtn.disabled = isLast;
      if (isLast) {
        stepNextBtn.classList.add('opacity-40', 'cursor-not-allowed');
      } else {
        stepNextBtn.classList.remove('opacity-40', 'cursor-not-allowed');
      }
    }
  }

  // ─── Finish / Submit ──────────────────────────────────────────────────────
  private async handleFinish(): Promise<void> {
    const errorEl = this.$('#form-error');

    const currentQ = this.questions[0];
    if (!currentQ) return;

    const scores = this.surveyService.getScores(currentQ.id);
    const missingMetrics = QGEVAL_METRICS.filter((m) => scores[m.id as MetricId] === undefined);

    if (missingMetrics.length > 0) {
      const missingLabel = missingMetrics[0]?.labelUk || missingMetrics[0]?.label;
      if (errorEl) {
        errorEl.textContent = `Будь ласка, оцініть "${missingLabel}" перед збереженням.`;
        errorEl.classList.remove('hidden');
      }
      return;
    }

    if (errorEl) errorEl.classList.add('hidden');

    const finishBtn = this.$<HTMLButtonElement>('#finish-btn');
    if (finishBtn) {
      finishBtn.disabled = true;
      finishBtn.innerHTML = `
        <div class="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
        <span>Saving…</span>
      `;
    }

    try {
      await this.surveyService.submitSurvey({
        answers: [{ questionId: currentQ.id, scores }],
      });

      if (finishBtn) {
        finishBtn.innerHTML = `
          <svg class="w-4 h-4 text-lime-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
          </svg>
          Save!
        `;
      }

      setTimeout(() => {
        if (this.currentQuestionId < this.totalQuestionsInDb) {
          this.loadQuestionById(this.currentQuestionId + 1);
        } else {
          this.surveyService.setView('results');
        }
      }, 1000);

    } catch (err: any) {
      if (errorEl) {
        errorEl.textContent = `Помилка збереження: ${err.message}`;
        errorEl.classList.remove('hidden');
      }
      if (finishBtn) {
        finishBtn.disabled = false;
        finishBtn.innerHTML = `
          <svg class="w-4 h-4 text-lime-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
          </svg>
          Save score
        `;
      }
    }
  }

  private escape(str: string): string {
    return str ? str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
  }
}
