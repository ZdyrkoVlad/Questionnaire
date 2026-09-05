import { Component, BaseComponent } from '../core/component.decorator';
import { inject } from '../core/injectable.decorator';
import { SurveyService, ActiveView } from '../services/survey.service';

@Component({
  selector: 'app-root',
})
export class AppComponent extends BaseComponent {
  private surveyService = inject(SurveyService);
  private currentView: ActiveView = 'survey';
  private unsubscribeView?: () => void;

  ngOnInit(): void {
    this.currentView = this.surveyService.getView();
    this.unsubscribeView = this.surveyService.onViewChange((view) => {
      this.currentView = view;
      this.renderView();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    this.renderView();
  }

  ngOnDestroy(): void {
    if (this.unsubscribeView) {
      this.unsubscribeView();
    }
  }

  render(): void {
    this.className = 'min-h-screen flex flex-col font-sans bg-[#fafafa] text-slate-900 selection:bg-lime-300 selection:text-black';
    this.innerHTML = `
      <!-- Angular-style Header Component -->
      <app-header></app-header>

      <!-- Main Shell -->
      <main class="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div id="view-outlet"></div>
      </main>

      <!-- Clean Footer -->
      <footer class="border-t border-slate-200 bg-white py-6 mt-12 text-center text-xs text-slate-500">
        <div class="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-lime-500"></span>
            <span class="font-semibold text-slate-800">Questionnaire NestJS Service</span>
            <span>•</span>
            <span>Angular-Style Components</span>
          </div>
          <div class="text-slate-400">
            Tailwind CSS • Light Theme • Black / Grey / Lime
          </div>
        </div>
      </footer>
    `;
  }

  private renderView(): void {
    const outlet = this.$('#view-outlet');
    if (!outlet) return;

    if (this.currentView === 'survey') {
      outlet.innerHTML = `<app-survey-form></app-survey-form>`;
    } else {
      outlet.innerHTML = `<app-results-view></app-results-view>`;
    }
  }
}
