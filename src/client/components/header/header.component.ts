import { Component, BaseComponent } from '../../core/component.decorator';
import { inject } from '../../core/injectable.decorator';
import { SurveyService, ActiveView } from '../../services/survey.service';

@Component({
  selector: 'app-header',
})
export class HeaderComponent extends BaseComponent {
  private surveyService = inject(SurveyService);
  private unsubscribeView?: () => void;

  ngOnInit(): void {
    this.unsubscribeView = this.surveyService.onViewChange(() => {
      this.updateActiveTabs();
    });
    this.bindEvents();
    this.updateActiveTabs();
  }

  ngOnDestroy(): void {
    if (this.unsubscribeView) {
      this.unsubscribeView();
    }
  }

  render(): void {
    this.innerHTML = `
      <header class="border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-30">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="h-9 w-9 rounded-xl bg-slate-950 flex items-center justify-center shadow-sm">
              <span class="text-lime-400 font-extrabold text-lg leading-none">10</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="font-bold text-slate-950 tracking-tight text-base">RatePulse</span>
              <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs">v1.4.8</span>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button id="nav-survey-btn" class="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all">
              Rate Survey
            </button>
            <button id="nav-results-btn" class="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all">
              Live Scores
            </button>
            <a href="/imageExample" class="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-950 hover:bg-slate-100 transition-all flex items-center gap-1">
              <span>🖼️ Image Example</span>
            </a>
          </div>
        </div>
      </header>
    `;
  }

  private bindEvents(): void {
    const surveyBtn = this.$<HTMLButtonElement>('#nav-survey-btn');
    const resultsBtn = this.$<HTMLButtonElement>('#nav-results-btn');

    surveyBtn?.addEventListener('click', () => {
      this.surveyService.setView('survey');
    });

    resultsBtn?.addEventListener('click', () => {
      this.surveyService.setView('results');
    });
  }

  private updateActiveTabs(): void {
    const currentView = this.surveyService.getView();
    const surveyBtn = this.$<HTMLButtonElement>('#nav-survey-btn');
    const resultsBtn = this.$<HTMLButtonElement>('#nav-results-btn');

    if (!surveyBtn || !resultsBtn) return;

    if (currentView === 'survey') {
      surveyBtn.className = 'px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-950 text-white transition-all shadow-sm';
      resultsBtn.className = 'px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-950 hover:bg-slate-100 transition-all';
    } else {
      surveyBtn.className = 'px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-950 hover:bg-slate-100 transition-all';
      resultsBtn.className = 'px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-950 text-white transition-all shadow-sm';
    }
  }
}
