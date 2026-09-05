/**
 * Client-side entrypoint: boots the Angular-style component hierarchy
 */

// Core Services & Decorators
import './core/injectable.decorator';
import './core/component.decorator';

// Angular-style Components
import './components/header/header.component';
import './components/rating-scale/rating-scale.component';
import './components/question-card/question-card.component';
import './components/survey-form/survey-form.component';
import './components/results-view/results-view.component';
import './components/app.component';

console.log('[RatePulse] Angular-style components initialized successfully.');
