import { Component, BaseComponent } from '../../core/component.decorator';
import { inject } from '../../core/injectable.decorator';
import {
  SurveyService,
  SurveyResults,
  QuestionStat,
  QuestionAnswerItem,
  RecentAnswer,
  QGEVAL_METRICS,
} from '../../services/survey.service';

@Component({
  selector: 'app-results-view',
})
export class ResultsViewComponent extends BaseComponent {
  private surveyService = inject(SurveyService);
  private resultsData: SurveyResults | null = null;
  private isLoading = true;

  // Selected question number for summarized analytics (1 .. totalQuestionsCount)
  private selectedQuestionNumber: number = 1;
  private totalQuestionsCount: number = 1;

  // Detailed answers state for the selected question
  private isAnswersExpanded = false;
  private isLoadingAnswers = false;
  private questionAnswers: QuestionAnswerItem[] = [];
  private answersCache = new Map<string, QuestionAnswerItem[]>();
  private questionInfoCache = new Map<number, { question: string; answer: string }>();

  async ngOnInit(): Promise<void> {
    await this.loadData();
  }

  async loadData(): Promise<void> {
    this.isLoading = true;
    this.renderLoading();
    try {
      // Fetch results and total questions count in parallel
      const [results, totalCount] = await Promise.all([
        this.surveyService.getResults(),
        this.surveyService.getTotalQuestionsCount(),
      ]);

      this.resultsData = results;
      this.totalQuestionsCount = Math.min(1000, Math.max(totalCount || 1, 1));
      this.isLoading = false;

      // Populate question info cache from question stats if available
      if (this.resultsData.questionStats) {
        for (const stat of this.resultsData.questionStats) {
          const num = parseInt(stat.questionId, 10);
          if (!isNaN(num)) {
            this.questionInfoCache.set(num, {
              question: stat.questionText || '',
              answer: stat.targetAnswer || '',
            });
          }
        }
      }

      // Default selected question to the first question with stats or keep within [1, total]
      if (this.resultsData.questionStats && this.resultsData.questionStats.length > 0) {
        const firstWithStats = parseInt(this.resultsData.questionStats[0].questionId, 10);
        if (!isNaN(firstWithStats)) {
          this.selectedQuestionNumber = firstWithStats;
        }
      }

      if (this.selectedQuestionNumber < 1) this.selectedQuestionNumber = 1;
      if (this.selectedQuestionNumber > this.totalQuestionsCount) {
        this.selectedQuestionNumber = this.totalQuestionsCount;
      }

      this.render();
      this.bindEvents();

      // Ensure question info is loaded for the currently selected number
      this.fetchQuestionInfoIfNeeded(this.selectedQuestionNumber);
    } catch (err) {
      this.isLoading = false;
      this.innerHTML = `
        <div class="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-center">
          <p class="text-rose-700 font-bold text-base mb-1">Помилка завантаження статистики</p>
          <p class="text-rose-600 text-xs mb-4">Не вдалося отримати дані з сервера. Перевірте з'єднання з базою даних.</p>
          <button id="res-retry-btn" class="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs rounded-xl font-bold transition-all shadow-sm cursor-pointer">Спробувати знову</button>
        </div>
      `;
      this.$('#res-retry-btn')?.addEventListener('click', () => this.loadData());
    }
  }

  private renderLoading(): void {
    this.innerHTML = `
      <div class="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm animate-pulse">
        <div class="w-10 h-10 border-3 border-lime-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p class="text-slate-800 font-bold text-sm">Оновлення аналітики Live Score…</p>
        <p class="text-slate-400 text-xs mt-1">Отримання останніх відповідей та метрик із бази даних</p>
      </div>
    `;
  }

  render(): void {
    if (!this.resultsData) return;
    const data = this.resultsData;

    // ── 1. Global Metrics Progress Bars ─────────────────────────────────────
    const globalMetricsHtml = data.globalMetricAverages
      .map((m) => {
        const pct = Math.round(((m.averageScore - 1) / 2) * 100); // 1–3 → 0–100%
        const colorClass =
          m.averageScore >= 2.5
            ? 'bg-lime-500'
            : m.averageScore >= 1.75
            ? 'bg-amber-400'
            : 'bg-rose-500';
        return `
          <div class="flex items-center gap-3 py-2">
            <div class="w-44 shrink-0">
              <p class="text-xs font-semibold text-slate-800 truncate">${this.escape(m.label)}</p>
              <p class="text-[10px] text-slate-400">${this.escape(m.labelUk)}</p>
            </div>
            <div class="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
              <div class="${colorClass} h-2 rounded-full transition-all duration-500" style="width: ${pct}%;"></div>
            </div>
            <span class="text-sm font-bold text-slate-900 w-9 text-right">${m.averageScore.toFixed(2)}</span>
            <span class="text-xs text-slate-400 font-medium">/3</span>
          </div>
        `;
      })
      .join('<div class="border-t border-slate-100"></div>');

    // ── 2. Recent Answers Feed (Last 10 responses from DB) ───────────────────
    const recentAnswers = data.recentAnswers || [];
    let recentFeedHtml = '';

    if (recentAnswers.length === 0) {
      recentFeedHtml = `
        <div class="p-8 text-center bg-slate-50 border border-slate-200/80 rounded-2xl">
          <p class="text-slate-500 text-sm font-medium">У базі даних ще немає збережених відповідей.</p>
          <p class="text-slate-400 text-xs mt-1">Пройдіть опитування, щоб побачити перші результати.</p>
        </div>
      `;
    } else {
      recentFeedHtml = `
        <div class="space-y-3.5">
          ${recentAnswers
            .map((ans) => {
              const scores = ans.score || {};
              const metricKeys = Object.keys(scores);
              const scoreValues = metricKeys
                .map((k) => scores[k])
                .filter((v) => typeof v === 'number');
              const avgScore =
                scoreValues.length > 0
                  ? (scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length).toFixed(2)
                  : '—';

              const avgColor =
                Number(avgScore) >= 2.5
                  ? 'text-lime-600 bg-lime-50 border-lime-200'
                  : Number(avgScore) >= 1.75
                  ? 'text-amber-600 bg-amber-50 border-amber-200'
                  : 'text-rose-600 bg-rose-50 border-rose-200';

              const metricPills = QGEVAL_METRICS.map((metric) => {
                const score = scores[metric.id];
                if (score === undefined) return '';
                const pillColor =
                  score === 3
                    ? 'bg-lime-100 text-lime-800 border-lime-300'
                    : score === 2
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-rose-100 text-rose-800 border-rose-300';
                return `
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${pillColor}" title="${this.escape(metric.labelUk)}">
                    <span class="text-slate-600">${this.escape(metric.label)}:</span>
                    <span class="font-bold">${score}</span>
                  </span>
                `;
              }).join('');

              return `
                <div class="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-2xs hover:shadow-xs transition-all">
                  <div class="flex flex-wrap items-start justify-between gap-2 mb-2">
                    <div class="flex items-center gap-2">
                      <span class="px-2.5 py-0.5 rounded-lg text-xs font-extrabold bg-slate-900 text-white">
                        #${this.escape(String(ans.questionId))}
                      </span>
                      <span class="text-xs font-semibold text-slate-800">
                        ${this.escape(ans.respondentName || 'Anonymous')}
                      </span>
                      <span class="text-[11px] text-slate-400">
                        • ${this.formatDate(ans.createdAt || '')}
                      </span>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="text-[11px] font-bold px-2 py-0.5 rounded-lg border ${avgColor}">
                        Середній бал: ${avgScore} / 3
                      </span>
                      <button 
                        type="button" 
                        class="recent-select-btn px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                        data-qid="${this.escape(String(ans.questionId))}"
                      >
                        Аналізувати питання →
                      </button>
                    </div>
                  </div>

                  <p class="text-xs text-slate-700 font-medium line-clamp-2 mb-2.5">
                    <span class="text-slate-400 font-normal">Питання:</span> "${this.escape(ans.question || '')}"
                  </p>

                  <div class="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
                    ${metricPills}
                  </div>

                  ${
                    ans.feedback
                      ? `
                    <div class="mt-2.5 pt-2 border-t border-slate-100 text-xs text-slate-600 italic bg-slate-50/70 p-2.5 rounded-xl border border-slate-200/50">
                      <span class="font-semibold not-italic text-slate-500">Коментар:</span> "${this.escape(ans.feedback)}"
                    </div>
                  `
                      : ''
                  }
                </div>
              `;
            })
            .join('')}
        </div>
      `;
    }

    // ── 3. Question-Specific Analytics ──────────────────────────────────────
    const questionStats = data.questionStats || [];
    const currentQNumber = this.selectedQuestionNumber;
    const selectedStat = questionStats.find(
      (q) => Number(q.questionId) === currentQNumber,
    );
    const cachedInfo = this.questionInfoCache.get(currentQNumber);

    let questionDetailsHtml = '';

    if (!selectedStat || selectedStat.count === 0) {
      // ── Placeholder: No Score for this question ───────────────────────────
      questionDetailsHtml = `
        <div class="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 transition-all">
          <!-- Question Header Preview -->
          <div class="flex items-center gap-2 mb-2">
            <span class="px-2.5 py-0.5 rounded-lg text-xs font-extrabold bg-slate-900 text-white">
              Question #${currentQNumber}
            </span>
            <span class="text-xs text-slate-400 font-semibold">• LORA VQA</span>
          </div>

          ${
            cachedInfo?.question
              ? `
            <h4 class="font-bold text-slate-900 text-sm sm:text-base mt-1">
              "${this.escape(cachedInfo.question)}"
            </h4>
          `
              : `
            <h4 class="font-bold text-slate-400 text-sm italic mt-1">
              Питання #${currentQNumber}
            </h4>
          `
          }

          ${
            cachedInfo?.answer
              ? `
            <p class="text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80 inline-block mt-2">
              <span class="font-semibold text-slate-500">🎯 Цільова відповідь:</span> ${this.escape(cachedInfo.answer)}
            </p>
          `
              : ''
          }

          <!-- Empty score placeholder -->
          <div class="mt-6 p-8 text-center bg-slate-50/80 border-2 border-dashed border-slate-200 rounded-2xl">
            <div class="w-12 h-12 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-center mx-auto mb-3 text-amber-600 shadow-2xs">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
            <h4 class="text-base font-extrabold text-slate-900 mb-1">No Score for this question</h4>
            <p class="text-xs text-slate-500 max-w-sm mx-auto">
              Для питання #${currentQNumber} ще немає виставлених оцінок або збережених відповідей у базі даних.
            </p>
            <div class="mt-4">
              <button id="res-rate-this-btn" class="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer">
                Оцінити це питання зараз →
              </button>
            </div>
          </div>
        </div>
      `;
    } else {
      // ── Has Score: Display Detailed Summarized Statistics ─────────────────
      const overallColor =
        selectedStat.overallAverage >= 2.5
          ? 'text-lime-600'
          : selectedStat.overallAverage >= 1.75
          ? 'text-amber-600'
          : 'text-rose-500';

      const metricsMapHtml = selectedStat.metrics.map((m) => {
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
                <div class="w-full bg-slate-100 rounded h-11 flex items-end p-0.5">
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

        const avgColor =
          m.averageScore >= 2.5
            ? 'text-lime-600'
            : m.averageScore >= 1.75
            ? 'text-amber-600'
            : 'text-rose-500';

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

      const linguisticMetrics = QGEVAL_METRICS.filter((m) => m.group === 'linguistic').map((m) => m.id);
      const linguisticHtml = selectedStat.metrics
        .filter((m) => linguisticMetrics.includes(m.metricId as any))
        .map(
          (m, i, arr) =>
            metricsMapHtml[selectedStat.metrics.indexOf(m)] +
            (i < arr.length - 1 ? '<div class="border-t border-slate-100 mx-4"></div>' : ''),
        )
        .join('');

      const taskHtml = selectedStat.metrics
        .filter((m) => !linguisticMetrics.includes(m.metricId as any))
        .map(
          (m, i, arr) =>
            metricsMapHtml[selectedStat.metrics.indexOf(m)] +
            (i < arr.length - 1 ? '<div class="border-t border-slate-100 mx-4"></div>' : ''),
        )
        .join('');

      // Answers List Section (if expanded)
      let answersListContent = '';
      if (this.isAnswersExpanded) {
        if (this.isLoadingAnswers) {
          answersListContent = `
            <div class="p-8 text-center bg-slate-50 border-t border-slate-100">
              <div class="w-6 h-6 border-2 border-lime-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p class="text-xs text-slate-500 font-medium">Завантаження всіх відповідей для питання #${this.escape(selectedStat.questionId)}…</p>
            </div>
          `;
        } else if (this.questionAnswers.length === 0) {
          answersListContent = `
            <div class="p-6 text-center bg-slate-50 border-t border-slate-100 text-xs text-slate-500">
              Не знайдено збережених індивідуальних записів відповідей для цього питання.
            </div>
          `;
        } else {
          answersListContent = `
            <div class="border-t border-slate-200 bg-slate-50/50 p-4 sm:p-6 space-y-4">
              <div class="flex items-center justify-between pb-2 border-b border-slate-200/80">
                <h5 class="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <svg class="w-4 h-4 text-lime-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                  Всі надані відповіді (${this.questionAnswers.length})
                </h5>
                <span class="text-[11px] text-slate-400">Сортування: від найновіших</span>
              </div>

              <div class="space-y-3">
                ${this.questionAnswers
                  .map((item, idx) => {
                    const scores = item.score || {};
                    const scoreValues = Object.keys(scores)
                      .map((k) => scores[k])
                      .filter((v) => typeof v === 'number');
                    const singleAvg =
                      scoreValues.length > 0
                        ? (scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length).toFixed(2)
                        : '—';

                    const itemPills = QGEVAL_METRICS.map((metric) => {
                      const score = scores[metric.id];
                      if (score === undefined) return '';
                      const badgeBg =
                        score === 3
                          ? 'bg-lime-100 text-lime-800 border-lime-300'
                          : score === 2
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-rose-100 text-rose-800 border-rose-300';
                      return `
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${badgeBg}">
                          <span class="text-slate-600">${this.escape(metric.label)}:</span>
                          <span class="font-bold">${score}</span>
                        </span>
                      `;
                    }).join('');

                    return `
                      <div class="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
                        <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <div class="flex items-center gap-2">
                            <span class="w-6 h-6 rounded-full bg-slate-900 text-white text-[10px] font-extrabold flex items-center justify-center">
                              ${idx + 1}
                            </span>
                            <span class="font-bold text-xs text-slate-850">
                              ${this.escape(item.respondentName || 'Anonymous')}
                            </span>
                            <span class="text-[11px] text-slate-400">
                              • ${this.formatDate(item.createdAt || '')}
                            </span>
                          </div>
                          <div class="px-2 py-0.5 rounded-md text-xs font-extrabold bg-slate-100 text-slate-800 border border-slate-200">
                            Сер. бал: ${singleAvg} / 3
                          </div>
                        </div>

                        <div class="flex flex-wrap gap-1.5 pt-1.5 pb-1">
                          ${itemPills}
                        </div>

                        ${
                          item.feedback
                            ? `
                          <div class="mt-2 pt-2 border-t border-slate-100 text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                            <span class="font-semibold not-italic text-slate-500">Коментар:</span> "${this.escape(item.feedback)}"
                          </div>
                        `
                            : ''
                        }
                      </div>
                    `;
                  })
                  .join('')}
              </div>
            </div>
          `;
        }
      }

      questionDetailsHtml = `
        <div class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden transition-all">
          <!-- Card header -->
          <div class="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <span class="px-2.5 py-0.5 rounded-lg text-xs font-extrabold bg-lime-400 text-slate-950">
                  Question #${this.escape(selectedStat.questionId)}
                </span>
                <span class="text-xs text-slate-400 font-semibold">• ${selectedStat.count} ${this.formatCountUa(selectedStat.count)}</span>
              </div>
              <h4 class="font-bold text-slate-950 text-sm sm:text-base mt-1">
                "${this.escape(selectedStat.questionText || cachedInfo?.question || selectedStat.title)}"
              </h4>
              ${
                selectedStat.targetAnswer || cachedInfo?.answer
                  ? `
                <p class="text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80 inline-block mt-1">
                  <span class="font-semibold text-slate-500">🎯 Цільова відповідь:</span> ${this.escape(selectedStat.targetAnswer || cachedInfo?.answer || '')}
                </p>
              `
                  : ''
              }
            </div>
            <div class="text-right shrink-0 bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-0 border-slate-200 flex sm:flex-col items-center sm:items-end justify-between sm:justify-start">
              <span class="text-[11px] text-slate-400 font-medium">Загальний сер. бал</span>
              <div class="flex items-baseline gap-1 justify-end">
                <span class="text-2xl sm:text-3xl font-extrabold ${overallColor}">${selectedStat.overallAverage.toFixed(2)}</span>
                <span class="text-xs text-slate-400 font-medium">/3</span>
              </div>
            </div>
          </div>

          <!-- Linguistic Dimensions -->
          <div>
            <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-5 pt-3 pb-1 flex items-center gap-1.5">
              <span class="w-1 h-2.5 bg-slate-400 rounded-full inline-block"></span>
              Linguistic Dimensions (Мовні виміри)
            </p>
            <div class="divide-y-0">${linguisticHtml}</div>
          </div>

          <!-- Task-oriented Dimensions -->
          <div class="border-t border-slate-100">
            <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-5 pt-3 pb-1 flex items-center gap-1.5">
              <span class="w-1 h-2.5 bg-lime-500 rounded-full inline-block"></span>
              Task-Oriented Dimensions (Задачно-орієнтовані виміри)
            </p>
            <div class="divide-y-0 pb-2">${taskHtml}</div>
          </div>

          <!-- Action Button: Open/Close all submitted answers -->
          <div class="px-5 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between flex-wrap gap-3">
            <button 
              id="res-toggle-answers-btn"
              type="button"
              class="px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm flex items-center gap-2 cursor-pointer ${
                this.isAnswersExpanded
                  ? 'bg-slate-900 text-white hover:bg-slate-800'
                  : 'bg-lime-400 hover:bg-lime-500 text-slate-950 shadow-lime-400/20'
              }"
            >
              ${
                this.isAnswersExpanded
                  ? `
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/></svg>
                Приховати відповіді
              `
                  : `
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                Відкрити всі надані відповіді для цього питання (${selectedStat.count})
              `
              }
            </button>
            <span class="text-[11px] text-slate-400">
              ${this.isAnswersExpanded ? 'Показано індивідуальні анкети' : 'Натисніть для перегляду окремих відповідей'}
            </span>
          </div>

          <!-- Expanded Answers List -->
          ${answersListContent}
        </div>
      `;
    }

    // ── 4. Recent Comments / Feedback ───────────────────────────────────────
    let feedbackHtml = '<p class="text-slate-400 text-xs italic">Коментарів ще не залишено.</p>';
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

    // ── Assembling Full Component DOM ───────────────────────────────────────
    this.innerHTML = `
      <div class="space-y-8">
        <!-- Top Status Banner -->
        <div class="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 text-center shadow-sm relative overflow-hidden">
          <div class="absolute -top-10 -right-10 w-32 h-32 bg-lime-100 rounded-full blur-2xl opacity-70 pointer-events-none"></div>
          <div class="w-16 h-16 bg-lime-100 border-2 border-lime-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <svg class="w-8 h-8 text-lime-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-950">QGEval Live Score Dashboard</h2>
          <p class="text-slate-600 text-sm mt-1.5 max-w-md mx-auto">
            Оновлювана аналітика та останні відповіді респондентів з бази даних.
          </p>

          <div class="mt-6 flex flex-wrap justify-center gap-3">
            <button id="res-retake-btn" class="px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer">
              <svg class="w-4 h-4 text-lime-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              Оцінити нове питання
            </button>
            <button id="res-refresh-btn" class="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-2">
              <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              Оновити дані
            </button>
          </div>
        </div>

        <!-- Summary Stats Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Загальний сер. бал</span>
            <div class="flex items-baseline gap-2 mt-2">
              <span class="text-4xl font-extrabold text-slate-950">${data.overallAverage.toFixed(2)}</span>
              <span class="text-sm font-bold text-slate-400">/ 3</span>
              <span class="ml-auto px-2 py-0.5 rounded-md bg-lime-100 text-lime-800 text-xs font-semibold">Live</span>
            </div>
          </div>
          <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Всього відповідей</span>
            <div class="flex items-baseline gap-2 mt-2">
              <span class="text-4xl font-extrabold text-slate-950">${data.totalResponses}</span>
              <span class="text-xs text-slate-500 font-medium">записів</span>
            </div>
          </div>
          <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Метрик QGEval</span>
            <div class="flex items-baseline gap-2 mt-2">
              <span class="text-4xl font-extrabold text-slate-950">${QGEVAL_METRICS.length}</span>
              <span class="text-xs text-slate-500 font-medium">вимірів оцінки</span>
            </div>
          </div>
        </div>

        <!-- Global Metric Averages Overview -->
        <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 class="text-base font-bold text-slate-950 mb-1">Глобальні середні показники метрик</h3>
          <p class="text-xs text-slate-400 mb-4">Агрегована статистика за всіма питаннями та анотаторами</p>

          <div class="flex items-center gap-4 mb-4 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            <span class="flex items-center gap-1"><span class="w-3 h-1.5 rounded bg-rose-400 inline-block"></span>Низька (≤1.75)</span>
            <span class="flex items-center gap-1"><span class="w-3 h-1.5 rounded bg-amber-400 inline-block"></span>Середня (≤2.5)</span>
            <span class="flex items-center gap-1"><span class="w-3 h-1.5 rounded bg-lime-500 inline-block"></span>Висока (>2.5)</span>
          </div>

          <div class="divide-y divide-slate-100">
            ${globalMetricsHtml}
          </div>
        </div>

        <!-- SECTION: Останні відповіді з БД (Recent Responses Feed) -->
        <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 class="text-base font-bold text-slate-950 flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-lime-500 inline-block"></span>
                Останні відповіді з БД
              </h3>
              <p class="text-xs text-slate-400 mt-0.5">Останні збережені оцінки та коментарі респондентів</p>
            </div>
            <span class="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 self-start sm:self-auto">
              Показано: останні ${recentAnswers.length}
            </span>
          </div>

          ${recentFeedHtml}
        </div>

        <!-- SECTION: Детальна статистика за конкретним питанням (Question-Specific Analytics) -->
        <div id="question-analytics-section" class="space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
            <div>
              <h3 class="text-base font-bold text-slate-950 flex items-center gap-2">
                <svg class="w-5 h-5 text-lime-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
                Статистика за номером питання
              </h3>
              <p class="text-xs text-slate-400 mt-0.5">Введіть номер питання від 1 до ${this.totalQuestionsCount} для перегляду аналітики</p>
            </div>

            <!-- Question Number Input Stepper -->
            <div class="flex items-center gap-2">
              <button 
                id="res-prev-q-btn" 
                type="button" 
                class="h-10 px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                ${this.selectedQuestionNumber <= 1 ? 'disabled' : ''}
                title="Попереднє питання"
              >
                ◀
              </button>

              <div class="relative w-28 sm:w-32">
                <input 
                  type="number" 
                  id="res-question-input" 
                  min="1" 
                  max="${this.totalQuestionsCount}" 
                  value="${this.selectedQuestionNumber}" 
                  class="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white text-sm font-extrabold text-slate-900 shadow-2xs focus:ring-2 focus:ring-lime-500 focus:border-lime-500 text-center"
                  aria-label="Номер питання"
                />
              </div>

              <button 
                id="res-next-q-btn" 
                type="button" 
                class="h-10 px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                ${this.selectedQuestionNumber >= this.totalQuestionsCount ? 'disabled' : ''}
                title="Наступне питання"
              >
                ▶
              </button>

              <span class="text-xs font-bold text-slate-400 px-1">
                / ${this.totalQuestionsCount}
              </span>
            </div>
          </div>

          <!-- Question Details Card (Or "No Score for this question" placeholder) -->
          ${questionDetailsHtml}
        </div>

        <!-- Annotator Comments -->
        <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 class="text-sm font-bold uppercase tracking-wider text-slate-700 mb-4">
            Останні коментарі анотаторів
          </h3>
          <div class="space-y-3">
            ${feedbackHtml}
          </div>
        </div>
      </div>
    `;
  }

  private bindEvents(): void {
    // Retake button
    this.$('#res-retake-btn')?.addEventListener('click', () => {
      this.surveyService.resetScores();
      this.surveyService.setView('survey');
    });

    // Refresh button
    this.$('#res-refresh-btn')?.addEventListener('click', () => {
      this.answersCache.clear();
      this.loadData();
    });

    // Question number input
    const inputEl = this.$<HTMLInputElement>('#res-question-input');
    const handleNumberChange = (rawVal: string) => {
      let num = parseInt(rawVal, 10);
      if (isNaN(num)) return;
      if (num < 1) num = 1;
      if (num > this.totalQuestionsCount) num = this.totalQuestionsCount;

      if (num !== this.selectedQuestionNumber) {
        this.selectedQuestionNumber = num;
        this.isAnswersExpanded = false;
        this.questionAnswers = [];
        this.render();
        this.bindEvents();
        this.fetchQuestionInfoIfNeeded(num);
      }
    };

    inputEl?.addEventListener('change', (e) => {
      handleNumberChange((e.target as HTMLInputElement).value);
    });

    inputEl?.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleNumberChange((e.target as HTMLInputElement).value);
      }
    });

    // Prev question button
    this.$('#res-prev-q-btn')?.addEventListener('click', () => {
      if (this.selectedQuestionNumber > 1) {
        this.selectedQuestionNumber--;
        this.isAnswersExpanded = false;
        this.questionAnswers = [];
        this.render();
        this.bindEvents();
        this.fetchQuestionInfoIfNeeded(this.selectedQuestionNumber);
      }
    });

    // Next question button
    this.$('#res-next-q-btn')?.addEventListener('click', () => {
      if (this.selectedQuestionNumber < this.totalQuestionsCount) {
        this.selectedQuestionNumber++;
        this.isAnswersExpanded = false;
        this.questionAnswers = [];
        this.render();
        this.bindEvents();
        this.fetchQuestionInfoIfNeeded(this.selectedQuestionNumber);
      }
    });

    // "Оцінити це питання зараз →" button on the empty score placeholder
    this.$('#res-rate-this-btn')?.addEventListener('click', async () => {
      try {
        await this.surveyService.fetchQuestionByIndex(this.selectedQuestionNumber);
        this.surveyService.resetScores();
        this.surveyService.setView('survey');
      } catch (err) {
        console.error('Failed to navigate to question for rating:', err);
      }
    });

    // Toggle all answers button
    this.$('#res-toggle-answers-btn')?.addEventListener('click', async () => {
      this.isAnswersExpanded = !this.isAnswersExpanded;
      if (this.isAnswersExpanded) {
        await this.loadAnswersForSelectedQuestion();
      }
      this.render();
      this.bindEvents();
    });

    // Recent answers: "Аналізувати питання →" buttons
    const recentButtons = this.$$<HTMLButtonElement>('.recent-select-btn');
    recentButtons.forEach((btn) => {
      btn.addEventListener('click', async () => {
        const qId = btn.getAttribute('data-qid');
        const num = qId ? parseInt(qId, 10) : NaN;
        if (!isNaN(num)) {
          this.selectedQuestionNumber = num;
          this.isAnswersExpanded = false;
          this.questionAnswers = [];
          this.render();
          this.bindEvents();
          this.fetchQuestionInfoIfNeeded(num);

          // Smooth scroll to the question analytics section
          const targetSection = this.$('#question-analytics-section');
          targetSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  private async fetchQuestionInfoIfNeeded(num: number): Promise<void> {
    if (this.questionInfoCache.has(num)) return;
    try {
      const q = await this.surveyService.getQuestionDetails(num);
      if (q) {
        this.questionInfoCache.set(num, {
          question: q.description,
          answer: q.targetAnswer,
        });
        if (this.selectedQuestionNumber === num) {
          this.render();
          this.bindEvents();
        }
      }
    } catch (err) {
      console.warn(`Could not load question text for #${num}:`, err);
    }
  }

  private async loadAnswersForSelectedQuestion(): Promise<void> {
    const qIdStr = String(this.selectedQuestionNumber);

    if (this.answersCache.has(qIdStr)) {
      this.questionAnswers = this.answersCache.get(qIdStr) || [];
      return;
    }

    this.isLoadingAnswers = true;
    this.render();
    this.bindEvents();

    try {
      const items = await this.surveyService.getAnswersForQuestion(this.selectedQuestionNumber);
      this.answersCache.set(qIdStr, items);
      this.questionAnswers = items;
    } catch (err) {
      console.error('Failed to load answers for question:', err);
      this.questionAnswers = [];
    } finally {
      this.isLoadingAnswers = false;
    }
  }

  private formatCountUa(count: number): string {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod100 >= 11 && mod100 <= 14) return 'відповідей';
    if (mod10 === 1) return 'відповідь';
    if (mod10 >= 2 && mod10 <= 4) return 'відповіді';
    return 'відповідей';
  }

  private escape(str: string): string {
    return str ? str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
  }

  private formatDate(isoStr: string): string {
    if (!isoStr) return '';
    try {
      return new Date(isoStr).toLocaleDateString('uk-UA', {
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
