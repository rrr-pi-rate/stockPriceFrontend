import { Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { TrackedPage, VisitTrackerPort } from './application/ports/outbound/visit-tracker.port';

const TRACKED_PAGES: Readonly<Record<string, TrackedPage>> = {
  '/': 'landing',
  '/dashboard': 'dashboard',
};

@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  constructor() {
    const tracker = inject(VisitTrackerPort);
    inject(Router)
      .events.pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((e) => {
        const page = TRACKED_PAGES[e.urlAfterRedirects.split(/[?#]/)[0]];
        if (page) tracker.trackVisit(page);
      });
  }
}
