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
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:text-slate-950 hover:bg-slate-50 transition-colors ml-1">
              <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
              <span>GitHub</span>
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
