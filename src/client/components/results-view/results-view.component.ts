import { Component, BaseComponent } from '../../core/component.decorator';
import { inject } from '../../core/injectable.decorator';
import { SurveyService, SurveyResults, QGEVAL_METRICS } from '../../services/survey.service';

@Component({
  selector: 'app-results-view',
})
export class ResultsViewComponent extends BaseComponent {
  private surveyService = inject(SurveyService);
  private resultsData: SurveyResults | null = null;
  private isLoading = true;

  async ngOnInit(): Promise<void> {
    await this.loadData();
  }

  async loadData(): Promise<void> {
    this.isLoading = true;
    this.renderLoading();
    try {
      this.resultsData = await this.surveyService.getResults();
      this.isLoading = false;
      this.render();
      this.bindEvents();
    } catch (err) {
      this.isLoading = false;
      this.innerHTML = `
        <div class="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center">
          <p class="text-rose-700 font-semibold text-sm">Error loading results</p>
          <button id="res-retry-btn" class="mt-3 px-4 py-2 bg-rose-600 text-white text-xs rounded-xl font-bold">Retry</button>
        </div>
      `;
      this.$('#res-retry-btn')?.addEventListener('click', () => this.loadData());
    }
  }

  private renderLoading(): void {
    this.innerHTML = `
      <div class="p-10 text-center bg-white rounded-2xl border border-slate-200 shadow-sm animate-pulse">
        <p class="text-slate-500 text-sm font-medium">Aggregating QGEval score analytics…</p>
      </div>
    `;
  }

  render(): void {
    if (!this.resultsData) return;
    const data = this.resultsData;

    // ── Global metric overview ──────────────────────────────────────────────
    const globalMetricsHtml = data.globalMetricAverages
      .map((m) => {
        const pct = Math.round(((m.averageScore - 1) / 2) * 100); // 1–3 → 0–100%
        const colorClass = m.averageScore >= 2.5 ? 'bg-lime-500' : m.averageScore >= 1.75 ? 'bg-amber-400' : 'bg-rose-500';
        return `
          <div class="flex items-center gap-3 py-2">
            <div class="w-36 shrink-0">
              <p class="text-xs font-semibold text-slate-800 truncate">${this.escape(m.label)}</p>
              <p class="text-[10px] text-slate-400">${this.escape(m.labelUk)}</p>
            </div>
            <div class="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
              <div class="${colorClass} h-2 rounded-full transition-all duration-500" style="width: ${pct}%;"></div>
            </div>
            <span class="text-sm font-bold text-slate-900 w-8 text-right">${m.averageScore.toFixed(2)}</span>
            <span class="text-xs text-slate-400 font-medium">/3</span>
          </div>
        `;
      })
      .join('<div class="border-t border-slate-100"></div>');

    // ── Per-question breakdown ──────────────────────────────────────────────
    const questionCardsHtml = data.questionStats
      .map((stat) => {
        const metricsHtml = stat.metrics
          .map((m) => {
            const dist = [1, 2, 3].map((s) => {
              const item = m.distribution.find((d) => d.score === s);
              return { score: s, count: item?.count ?? 0, pct: item?.percentage ?? 0 };
            });

            const barColors = ['bg-rose-400', 'bg-amber-400', 'bg-lime-500'];
            const barsHtml = dist
              .map((d, i) => {
                const h = Math.max(d.pct, 4);
                return `
                  <div class="flex-1 flex flex-col items-center gap-0.5 group relative">
                    <div class="w-full bg-slate-100 rounded h-12 flex items-end p-0.5">
                      <div class="w-full ${barColors[i]} rounded transition-all duration-500" style="height:${h}%;"></div>
                    </div>
                    <span class="text-[9px] font-bold text-slate-500">${d.score}</span>
                    <div class="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-900 text-white text-[10px] px-1.5 py-0.5 rounded shadow whitespace-nowrap z-10">
                      ${d.count} (${d.pct}%)
                    </div>
                  </div>
                `;
              })
              .join('');

            const avgColor = m.averageScore >= 2.5 ? 'text-lime-600' : m.averageScore >= 1.75 ? 'text-amber-600' : 'text-rose-500';

            return `
              <div class="py-2.5 px-4 flex items-center gap-3">
                <div class="w-40 shrink-0">
                  <p class="text-xs font-semibold text-slate-800">${this.escape(m.label)}</p>
                  <p class="text-[10px] text-slate-400">${this.escape(m.labelUk)}</p>
                </div>
                <div class="flex gap-1 w-24 shrink-0">
                  ${barsHtml}
                </div>
                <div class="ml-auto text-right">
                  <span class="text-base font-extrabold ${avgColor}">${m.averageScore.toFixed(2)}</span>
                  <span class="text-xs text-slate-400 font-medium">/3</span>
                </div>
              </div>
            `;
          });

        // Split by group
        const linguisticMetrics = QGEVAL_METRICS.filter((m) => m.group === 'linguistic').map((m) => m.id);
        const linguisticHtml = stat.metrics
          .filter((m) => linguisticMetrics.includes(m.metricId as any))
          .map((m, i, arr) => metricsHtml[stat.metrics.indexOf(m)] + (i < arr.length - 1 ? '<div class="border-t border-slate-100 mx-4"></div>' : ''))
          .join('');

        const taskHtml = stat.metrics
          .filter((m) => !linguisticMetrics.includes(m.metricId as any))
          .map((m, i, arr) => metricsHtml[stat.metrics.indexOf(m)] + (i < arr.length - 1 ? '<div class="border-t border-slate-100 mx-4"></div>' : ''))
          .join('');

        const overallColor = stat.overallAverage >= 2.5 ? 'text-lime-600' : stat.overallAverage >= 1.75 ? 'text-amber-600' : 'text-rose-500';

        return `
          <div class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <!-- Card header -->
            <div class="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3">
              <div>
                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">${this.escape(stat.category)}</span>
                <h4 class="font-bold text-slate-900 text-sm mt-0.5">${this.escape(stat.title)}</h4>
                <p class="text-xs text-slate-500 mt-0.5">${stat.count} annotation${stat.count !== 1 ? 's' : ''}</p>
              </div>
              <div class="text-right shrink-0">
                <span class="text-[10px] text-slate-400 font-medium">Overall avg</span>
                <div class="flex items-baseline gap-1 justify-end">
                  <span class="text-2xl font-extrabold ${overallColor}">${stat.overallAverage.toFixed(2)}</span>
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
              <div class="divide-y-0">${linguisticHtml}</div>
            </div>

            <!-- Task-oriented -->
            <div class="border-t border-slate-100">
              <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-5 pt-3 pb-1 flex items-center gap-1.5">
                <span class="w-1 h-2.5 bg-lime-500 rounded-full inline-block"></span>
                Task-Oriented Dimensions
              </p>
              <div class="divide-y-0 pb-2">${taskHtml}</div>
            </div>
          </div>
        `;
      })
      .join('');

    // ── Feedback ───────────────────────────────────────────────────────────
    let feedbackHtml = '<p class="text-slate-400 text-xs italic">No comments submitted yet.</p>';
    if (data.recentFeedback && data.recentFeedback.length > 0) {
      feedbackHtml = data.recentFeedback
        .map(
          (item) => `
          <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
            <p class="text-slate-800 font-medium italic">"${this.escape(item.feedback)}"</p>
            <div class="mt-2 flex items-center justify-between text-slate-400">
              <span class="font-semibold text-slate-700">${this.escape(item.respondent || 'Anonymous')}</span>
              <span>${this.formatDate(item.timestamp)}</span>
            </div>
          </div>
        `,
        )
        .join('');
    }

    this.innerHTML = `
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
              <span class="text-4xl font-extrabold text-slate-950">${data.overallAverage.toFixed(2)}</span>
              <span class="text-sm font-bold text-slate-400">/ 3</span>
              <span class="ml-auto px-2 py-0.5 rounded-md bg-lime-100 text-lime-800 text-xs font-semibold">Live</span>
            </div>
          </div>
          <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Submissions</span>
            <div class="flex items-baseline gap-2 mt-2">
              <span class="text-4xl font-extrabold text-slate-950">${data.totalResponses}</span>
              <span class="text-xs text-slate-500 font-medium">annotations</span>
            </div>
          </div>
          <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Metrics Evaluated</span>
            <div class="flex items-baseline gap-2 mt-2">
              <span class="text-4xl font-extrabold text-slate-950">${QGEVAL_METRICS.length}</span>
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
            <span class="flex items-center gap-1"><span class="w-3 h-1.5 rounded bg-rose-400 inline-block"></span>Low (≤1.75)</span>
            <span class="flex items-center gap-1"><span class="w-3 h-1.5 rounded bg-amber-400 inline-block"></span>Medium (≤2.5)</span>
            <span class="flex items-center gap-1"><span class="w-3 h-1.5 rounded bg-lime-500 inline-block"></span>High (>2.5)</span>
          </div>

          <div class="divide-y divide-slate-100">
            ${globalMetricsHtml}
          </div>
        </div>

        <!-- Per Question Breakdown -->
        <div class="mb-8">
          <h3 class="text-base font-bold text-slate-950 mb-1 flex items-center justify-between">
            <span>Per-Question Breakdown</span>
            <span class="text-xs text-slate-400 font-normal">Scale 1–3</span>
          </h3>
          <p class="text-xs text-slate-400 mb-4">Distribution bars show annotator score distributions (1=rose, 2=amber, 3=lime)</p>
          <div class="space-y-4">
            ${questionCardsHtml}
          </div>
        </div>

        <!-- Annotator Comments -->
        <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 class="text-sm font-bold uppercase tracking-wider text-slate-700 mb-4">
            Annotator Comments
          </h3>
          <div class="space-y-3">
            ${feedbackHtml}
          </div>
        </div>
      </div>
    `;
  }

  private bindEvents(): void {
    this.$('#res-retake-btn')?.addEventListener('click', () => {
      this.surveyService.resetScores();
      this.surveyService.setView('survey');
    });
    this.$('#res-refresh-btn')?.addEventListener('click', () => this.loadData());
  }

  private escape(str: string): string {
    return str ? str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
  }

  private formatDate(isoStr: string): string {
    if (!isoStr) return '';
    try {
      return new Date(isoStr).toLocaleDateString(undefined, {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return '';
    }
  }
}
