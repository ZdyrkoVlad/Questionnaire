import { Component, BaseComponent } from '../../core/component.decorator';
import { inject } from '../../core/injectable.decorator';
import { SurveyService } from '../../services/survey.service';

@Component({
  selector: 'app-rating-scale',
})
export class RatingScaleComponent extends BaseComponent {
  private surveyService = inject(SurveyService);
  private questionId = '';
  private minLabel = '';
  private maxLabel = '';
  private selectedScore: number | null = null;
  private unsubscribeScores?: () => void;

  // Angular @Input equivalent setter
  setProperties(props: {
    questionId: string;
    minLabel: string;
    maxLabel: string;
    selectedScore?: number;
  }): void {
    this.questionId = props.questionId;
    this.minLabel = props.minLabel;
    this.maxLabel = props.maxLabel;
    this.selectedScore = props.selectedScore ?? null;
    this.render();
    this.bindEvents();
  }

  ngOnInit(): void {
    // Read attributes if passed directly on element
    if (!this.questionId) {
      this.questionId = this.getAttribute('question-id') || '';
      this.minLabel = this.getAttribute('min-label') || 'Low';
      this.maxLabel = this.getAttribute('max-label') || 'High';
      const stored = this.surveyService.getScore(this.questionId);
      if (stored !== undefined) {
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

  ngOnDestroy(): void {
    if (this.unsubscribeScores) {
      this.unsubscribeScores();
    }
  }

  render(): void {
    let buttonsHtml = '';
    for (let s = 1; s <= 10; s++) {
      const isActive = this.selectedScore === s;
      buttonsHtml += `
        <button 
          type="button" 
          data-score="${s}"
          aria-label="Score ${s} out of 10"
          aria-pressed="${isActive ? 'true' : 'false'}"
          class="score-btn ${isActive ? 'active' : ''}"
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

  private bindEvents(): void {
    const buttons = this.$$<HTMLButtonElement>('.score-btn');
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const score = parseInt(btn.getAttribute('data-score') || '0', 10);
        if (score >= 1 && score <= 10) {
          this.surveyService.setScore(this.questionId, score);
          this.emit('scoreSelected', { questionId: this.questionId, score });
        }
      });
    });
  }

  private updateButtonStates(): void {
    const buttons = this.$$<HTMLButtonElement>('.score-btn');
    buttons.forEach((btn) => {
      const score = parseInt(btn.getAttribute('data-score') || '0', 10);
      if (score === this.selectedScore) {
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
      } else {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
      }
    });
  }

  private escape(str: string): string {
    return str ? str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
  }
}
