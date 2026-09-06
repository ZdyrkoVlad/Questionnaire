import { Component, BaseComponent } from '../../core/component.decorator';
import { inject } from '../../core/injectable.decorator';
import { SurveyService, Question, QGEVAL_METRICS, MetricId } from '../../services/survey.service';
import { QGEvalMetricRowComponent } from '../qgeval-metric-row/qgeval-metric-row.component';

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
    this.initMetricRows();
  }

  ngOnInit(): void {
    this.unsubscribeScores = this.surveyService.onScoreChange(() => {
      if (this.questionData) {
        this.updateProgressBadge();
      }
    });
  }

  ngOnDestroy(): void {
    this.unsubscribeScores?.();
  }

  render(): void {
    if (!this.questionData) return;
    const q = this.questionData;
    const ratedCount = this.getRatedCount();

    this.className = 'block';
    this.innerHTML = `
      <div id="card-${q.id}" class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden transition-all">

        <!-- Card Header -->
        <div class="px-6 pt-6 pb-4 border-b border-slate-100">
          <div class="flex items-start justify-between gap-3 mb-3">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider shrink-0">
              Q${this.index + 1} / ${this.total} &nbsp;·&nbsp; ${this.escape(q.category)}
            </span>
            <span id="badge-${q.id}" class="text-xs font-semibold shrink-0">
              ${this.badgeHtml(ratedCount)}
            </span>
          </div>

          <!-- Generated Question -->
          <p class="text-base sm:text-lg font-bold text-slate-950 leading-snug mb-3">
            "${this.escape(q.description)}"
          </p>

          <!-- Image context (optional) + target answer -->
          <div class="grid grid-cols-1 ${q.imageContext ? 'sm:grid-cols-2' : 'sm:grid-cols-1'} gap-2 mt-3">
            ${q.imageContext ? `
            <div class="rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5">
              <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Image Context</p>
              <p class="text-xs text-slate-700 leading-relaxed">${this.escape(q.imageContext)}</p>
            </div>` : ''}
            <div class="rounded-xl bg-lime-50 border border-lime-200 px-3.5 py-2.5">
              <p class="text-[10px] font-bold uppercase tracking-wider text-lime-600 mb-1">Target Answer</p>
              <p class="text-xs text-slate-700 font-semibold leading-relaxed">${this.escape(q.targetAnswer)}</p>
            </div>
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

  private initMetricRows(): void {
    if (!this.questionData) return;
    const q = this.questionData;

    const linguisticContainer = this.$(`#linguistic-rows-${q.id}`);
    const taskContainer = this.$(`#task-rows-${q.id}`);

    QGEVAL_METRICS.forEach((metric) => {
      const row = document.createElement('app-qgeval-metric-row') as QGEvalMetricRowComponent;
      row.id = `row-${q.id}-${metric.id}`;
      row.className = 'block px-4';

      const container = metric.group === 'linguistic' ? linguisticContainer : taskContainer;
      container?.appendChild(row);

      row.setProperties({
        questionId: q.id,
        metricId: metric.id as MetricId,
        label: metric.label,
        labelUk: metric.labelUk,
        description: metric.description,
      });
    });
  }

  private getRatedCount(): number {
    if (!this.questionData) return 0;
    const scores = this.surveyService.getScores(this.questionData.id);
    return QGEVAL_METRICS.filter((m) => scores[m.id as MetricId] !== undefined).length;
  }

  private updateProgressBadge(): void {
    if (!this.questionData) return;
    const badge = this.$(`#badge-${this.questionData.id}`);
    if (badge) {
      badge.innerHTML = this.badgeHtml(this.getRatedCount());
    }
  }

  private badgeHtml(ratedCount: number): string {
    const total = QGEVAL_METRICS.length;
    const allDone = ratedCount === total;
    if (allDone) {
      return `<span class="inline-flex items-center gap-1 text-lime-700 font-bold"><span class="w-2 h-2 rounded-full bg-lime-500"></span>All ${total} rated ✓</span>`;
    }
    if (ratedCount > 0) {
      return `<span class="inline-flex items-center gap-1 text-amber-600 font-semibold"><span class="w-2 h-2 rounded-full bg-amber-400"></span>${ratedCount}/${total} rated</span>`;
    }
    return `<span class="text-slate-400">Not rated yet</span>`;
  }

  private escape(str: string): string {
    return str ? str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
  }
}
