import { Injectable } from '@angular/core';

export type TrackedPage = 'landing' | 'dashboard';

@Injectable()
export abstract class VisitTrackerPort {
  abstract trackVisit(page: TrackedPage): void;
}
