import { Component, BaseComponent } from '../../core/component.decorator';
import { inject } from '../../core/injectable.decorator';
import { SurveyService, Question } from '../../services/survey.service';
import { RatingScaleComponent } from '../rating-scale/rating-scale.component';

@Component({
  selector: 'app-question-card',
})
export class QuestionCardComponent extends BaseComponent {
  private surveyService = inject(SurveyService);
  private questionData: Question | null = null;
  private index = 0;
  private total = 0;
  private unsubscribeScores?: () => void;

  setQuestion(question: Question, index: number, total: number): void {
    this.questionData = question;
    this.index = index;
    this.total = total;
    this.render();
    this.initRatingComponent();
  }

  ngOnInit(): void {
    this.unsubscribeScores = this.surveyService.onScoreChange((scores) => {
      if (this.questionData) {
        const score = scores.get(this.questionData.id);
        this.updateBadge(score);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.unsubscribeScores) {
      this.unsubscribeScores();
    }
  }

  render(): void {
    if (!this.questionData) return;
    const q = this.questionData;
    const score = this.surveyService.getScore(q.id);

    this.className = 'block';
    this.innerHTML = `
      <div id="card-${q.id}" class="clean-card p-6 sm:p-7 relative transition-all">
        <div class="flex items-center justify-between gap-2 mb-3">
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider">
            Question ${this.index + 1} of ${this.total} • ${this.escape(q.category)}
          </span>
          <span id="badge-${q.id}" class="text-xs font-semibold text-slate-400">
            ${score !== undefined ? `<span class="inline-flex items-center gap-1 text-slate-900 font-bold"><span class="w-2 h-2 rounded-full bg-lime-500"></span>Selected: ${score}/10</span>` : 'Not rated'}
          </span>
        </div>

        <h3 class="text-lg sm:text-xl font-bold text-slate-950 tracking-tight mb-2">
          ${this.escape(q.title)}
        </h3>
        
        <p class="text-slate-600 text-sm leading-relaxed mb-6">
          ${this.escape(q.description)}
        </p>

        <!-- Rating Scale Sub-component -->
        <app-rating-scale id="rating-${q.id}"></app-rating-scale>
      </div>
    `;
  }

  private initRatingComponent(): void {
    if (!this.questionData) return;
    const ratingComp = this.$<RatingScaleComponent>(`#rating-${this.questionData.id}`);
    if (ratingComp) {
      ratingComp.setProperties({
        questionId: this.questionData.id,
        minLabel: this.questionData.minLabel,
        maxLabel: this.questionData.maxLabel,
        selectedScore: this.surveyService.getScore(this.questionData.id),
      });
    }
  }

  private updateBadge(score?: number): void {
    if (!this.questionData) return;
    const badge = this.$(`#badge-${this.questionData.id}`);
    if (badge) {
      if (score !== undefined) {
        badge.innerHTML = `<span class="inline-flex items-center gap-1 text-slate-900 font-bold"><span class="w-2 h-2 rounded-full bg-lime-500"></span>Selected: ${score}/10</span>`;
      } else {
        badge.textContent = 'Not rated';
      }
    }
  }

  private escape(str: string): string {
    return str ? str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
  }
}
