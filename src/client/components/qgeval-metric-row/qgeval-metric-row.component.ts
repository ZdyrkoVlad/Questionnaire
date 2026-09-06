import { Component, BaseComponent } from '../../core/component.decorator';
import { inject } from '../../core/injectable.decorator';
import { SurveyService, MetricId, MetricScore } from '../../services/survey.service';

/**
 * Renders a single QGEval metric row with a label, description tooltip,
 * and three pill-shaped score buttons (1 / 2 / 3).
 *
 * Usage: set properties via setProperties() after creation.
 */
@Component({
  selector: 'app-qgeval-metric-row',
})
export class QGEvalMetricRowComponent extends BaseComponent {
  private surveyService = inject(SurveyService);

  private questionId = '';
  private metricId: MetricId = 'fluency';
  private label = '';
  private labelUk = '';
  private description = '';
  private selectedScore: MetricScore | null = null;
  private unsubscribe?: () => void;

  setProperties(props: {
    questionId: string;
    metricId: MetricId;
    label: string;
    labelUk: string;
    description: string;
  }): void {
    this.questionId = props.questionId;
    this.metricId = props.metricId;
    this.label = props.label;
    this.labelUk = props.labelUk;
    this.description = props.description;
    this.selectedScore = this.surveyService.getMetricScore(this.questionId, this.metricId) ?? null;
    this.render();
    this.bindEvents();
  }

  ngOnInit(): void {
    this.unsubscribe = this.surveyService.onScoreChange(() => {
      const score = this.surveyService.getMetricScore(this.questionId, this.metricId) ?? null;
      if (score !== this.selectedScore) {
        this.selectedScore = score;
        this.updateButtonStates();
      }
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe?.();
  }

  render(): void {
    const buttons = [1, 2, 3]
      .map((s) => {
        const isActive = this.selectedScore === s;
        const colorClass = this.scoreColorClass(s as MetricScore, isActive);
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
      })
      .join('');

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

  private bindEvents(): void {
    const btns = this.$$<HTMLButtonElement>('.metric-score-btn');
    btns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const score = parseInt(btn.getAttribute('data-score') || '0', 10) as MetricScore;
        if (score >= 1 && score <= 3) {
          this.surveyService.setMetricScore(this.questionId, this.metricId, score);
          this.emit('metricScored', { questionId: this.questionId, metricId: this.metricId, score });
        }
      });
    });
  }

  private updateButtonStates(): void {
    const btns = this.$$<HTMLButtonElement>('.metric-score-btn');
    btns.forEach((btn) => {
      const score = parseInt(btn.getAttribute('data-score') || '0', 10) as MetricScore;
      const isActive = score === this.selectedScore;
      // Reset all classes then apply correct ones
      btn.className = `metric-score-btn ${this.scoreColorClass(score, isActive)} w-10 h-10 rounded-xl font-bold text-sm transition-all duration-150 border-2 focus:outline-none focus:ring-2 focus:ring-offset-1 cursor-pointer select-none`;
      btn.setAttribute('aria-pressed', String(isActive));
    });
  }

  /**
   * Returns Tailwind classes for each score button based on value and active state.
   * 1 = rose/red  2 = amber/yellow  3 = green/lime
   */
  private scoreColorClass(score: MetricScore, active: boolean): string {
    if (active) {
      switch (score) {
        case 1: return 'bg-rose-500 border-rose-600 text-white shadow-sm shadow-rose-200 ring-rose-400';
        case 2: return 'bg-amber-400 border-amber-500 text-white shadow-sm shadow-amber-200 ring-amber-400';
        case 3: return 'bg-lime-500 border-lime-600 text-white shadow-sm shadow-lime-200 ring-lime-400';
      }
    }
    switch (score) {
      case 1: return 'bg-white border-slate-200 text-slate-500 hover:border-rose-300 hover:text-rose-500 hover:bg-rose-50 ring-rose-400';
      case 2: return 'bg-white border-slate-200 text-slate-500 hover:border-amber-300 hover:text-amber-500 hover:bg-amber-50 ring-amber-400';
      case 3: return 'bg-white border-slate-200 text-slate-500 hover:border-lime-400 hover:text-lime-600 hover:bg-lime-50 ring-lime-400';
    }
  }

  private escape(str: string): string {
    return str ? str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
  }
}
