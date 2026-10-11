import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { App } from './app';
import { TrackedPage, VisitTrackerPort } from './application/ports/outbound/visit-tracker.port';

describe('App', () => {
  const tracked: TrackedPage[] = [];

  beforeEach(async () => {
    tracked.length = 0;
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([
          { path: '', children: [] },
          { path: 'dashboard', children: [] },
          { path: 'other', children: [] },
        ]),
        { provide: VisitTrackerPort, useValue: { trackVisit: (p: TrackedPage) => tracked.push(p) } },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('tracks a visit when navigating to the landing page and the dashboard', async () => {
    TestBed.createComponent(App);
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/');
    await router.navigateByUrl('/dashboard?x=1');

    expect(tracked).toEqual(['landing', 'dashboard']);
  });

  it('does not track untracked routes', async () => {
    TestBed.createComponent(App);

    await TestBed.inject(Router).navigateByUrl('/other');

    expect(tracked).toEqual([]);
  });
});
