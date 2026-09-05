import { Component, BaseComponent } from '../../core/component.decorator';
import { inject } from '../../core/injectable.decorator';
import { SurveyService, SurveyResults } from '../../services/survey.service';

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
        <p class="text-slate-500 text-sm font-medium">Aggregating score analytics...</p>
      </div>
    `;
  }

  render(): void {
    if (!this.resultsData) return;
    const data = this.resultsData;

    // Per question breakdown cards
    const questionCardsHtml = data.questionStats
      .map((stat) => {
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
              <h4 class="font-bold text-slate-900 text-sm sm:text-base">${this.escape(stat.title)}</h4>
              <div class="flex items-baseline gap-1.5">
                <span class="text-xs text-slate-400 font-medium">Avg:</span>
                <span class="text-lg font-extrabold text-slate-950">${stat.averageScore.toFixed(1)}</span>
                <span class="text-xs text-slate-400 font-medium">/ 10</span>
              </div>
            </div>
            
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

    // Comments HTML
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
              <span class="text-4xl font-extrabold text-slate-950">${data.overallAverage.toFixed(1)}</span>
              <span class="text-sm font-bold text-slate-400">/ 10</span>
              <span class="ml-auto px-2 py-0.5 rounded-md bg-lime-100 text-lime-800 text-xs font-semibold">Live</span>
            </div>
          </div>

          <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Submissions</span>
            <div class="flex items-baseline gap-2 mt-2">
              <span class="text-4xl font-extrabold text-slate-950">${data.totalResponses}</span>
              <span class="text-xs text-slate-500 font-medium">responses recorded</span>
            </div>
          </div>
        </div>

        <!-- Per Question Breakdown -->
        <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-8">
          <h3 class="text-base font-bold text-slate-950 mb-4 flex items-center justify-between">
            <span>Question Score Breakdown</span>
            <span class="text-xs text-slate-400 font-normal">Scale 1–10</span>
          </h3>
          <div class="space-y-6">
            ${questionCardsHtml}
          </div>
        </div>

        <!-- Comments -->
        <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 class="text-sm font-bold uppercase tracking-wider text-slate-700 mb-4">
            Recent Respondent Comments
          </h3>
          <div class="space-y-3">
            ${feedbackHtml}
          </div>
        </div>
      </div>
    `;
  }

  private bindEvents(): void {
    const retakeBtn = this.$('#res-retake-btn');
    const refreshBtn = this.$('#res-refresh-btn');

    retakeBtn?.addEventListener('click', () => {
      this.surveyService.resetScores();
      this.surveyService.setView('survey');
    });

    refreshBtn?.addEventListener('click', () => {
      this.loadData();
    });
  }

  private escape(str: string): string {
    return str ? str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
  }

  private formatDate(isoStr: string): string {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  }
}
