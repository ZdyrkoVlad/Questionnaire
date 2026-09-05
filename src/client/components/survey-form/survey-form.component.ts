import { Component, BaseComponent } from '../../core/component.decorator';
import { inject } from '../../core/injectable.decorator';
import { SurveyService, Question } from '../../services/survey.service';
import { QuestionCardComponent } from '../question-card/question-card.component';

@Component({
  selector: 'app-survey-form',
})
export class SurveyFormComponent extends BaseComponent {
  private surveyService = inject(SurveyService);
  private questions: Question[] = [];
  private isLoading = true;
  private isSubmitting = false;
  private errorMessage = '';
  private unsubscribeScores?: () => void;

  async ngOnInit(): Promise<void> {
    this.unsubscribeScores = this.surveyService.onScoreChange(() => {
      this.updateProgress();
    });

    try {
      this.questions = await this.surveyService.getQuestions();
      this.isLoading = false;
      this.render();
      this.initQuestionCards();
      this.bindFormEvents();
      this.updateProgress();
    } catch (err: any) {
      this.isLoading = false;
      this.errorMessage = err.message || 'Error loading questionnaire';
      this.render();
    }
  }

  ngOnDestroy(): void {
    if (this.unsubscribeScores) {
      this.unsubscribeScores();
    }
  }

  render(): void {
    if (this.isLoading) {
      this.innerHTML = `
        <div class="p-10 text-center bg-white rounded-2xl border border-slate-200 shadow-sm animate-pulse">
          <p class="text-slate-500 text-sm font-medium">Loading questionnaire items...</p>
        </div>
      `;
      return;
    }

    if (this.errorMessage && this.questions.length === 0) {
      this.innerHTML = `
        <div class="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center">
          <p class="text-rose-700 font-semibold text-sm">${this.escape(this.errorMessage)}</p>
          <button id="retry-btn" class="mt-3 px-4 py-2 bg-rose-600 text-white text-xs rounded-xl font-bold">Retry</button>
        </div>
      `;
      this.$('#retry-btn')?.addEventListener('click', () => location.reload());
      return;
    }

    this.innerHTML = `
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
    `;
  }

  private initQuestionCards(): void {
    const container = this.$('#questions-list-container');
    if (!container) return;

    container.innerHTML = '';
    this.questions.forEach((q, index) => {
      const card = document.createElement('app-question-card') as QuestionCardComponent;
      card.id = `qcard-${q.id}`;
      container.appendChild(card);
      card.setQuestion(q, index, this.questions.length);
    });
  }

  private bindFormEvents(): void {
    const form = this.$<HTMLFormElement>('#survey-form-el');
    form?.addEventListener('submit', (e) => this.handleSubmit(e));
  }

  private updateProgress(): void {
    const answeredCount = this.surveyService.getAnsweredCount();
    const total = this.questions.length;
    const pct = total > 0 ? Math.round((answeredCount / total) * 100) : 0;

    const progressText = this.$('#progress-text');
    const progressFill = this.$<HTMLElement>('#progress-fill');

    if (progressText) {
      progressText.textContent = `${answeredCount} of ${total} Completed (${pct}%)`;
    }
    if (progressFill) {
      progressFill.style.width = `${pct}%`;
    }
  }

  private async handleSubmit(e: Event): Promise<void> {
    e.preventDefault();
    const errorEl = this.$('#form-error');

    // Validation: check for unanswered questions
    const scores = this.surveyService.getSelectedScores();
    const unanswered = this.questions.filter((q) => !scores.has(q.id));

    if (unanswered.length > 0) {
      if (errorEl) {
        errorEl.textContent = `Please select a score (1 to 10) for: "${unanswered[0].title}".`;
        errorEl.classList.remove('hidden');
      }
      const targetCard = this.$(`#qcard-${unanswered[0].id}`);
      targetCard?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const answers = Array.from(scores.entries()).map(([questionId, score]) => ({
      questionId,
      score,
    }));

    const respondentName = this.$<HTMLInputElement>('#respondent-name')?.value.trim();
    const feedback = this.$<HTMLTextAreaElement>('#feedback-text')?.value.trim();

    const submitBtn = this.$<HTMLButtonElement>('#submit-btn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
        <span>Submitting Rating...</span>
      `;
    }

    try {
      await this.surveyService.submitSurvey({
        answers,
        respondentName: respondentName || undefined,
        feedback: feedback || undefined,
      });

      // Switch to results view
      this.surveyService.setView('results');
    } catch (err: any) {
      if (errorEl) {
        errorEl.textContent = `Submission Error: ${err.message}`;
        errorEl.classList.remove('hidden');
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `
          <span>Submit Rating Scores</span>
          <svg class="w-5 h-5 text-lime-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
          </svg>
        `;
      }
    }
  }

  private escape(str: string): string {
    return str ? str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
  }
}
