import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { DashboardOverview } from '../../application/models/dashboard-overview.model';
import { GetDashboardOverviewUseCase } from '../../application/use-cases/get-dashboard-overview.use-case';
import { DashboardPage } from './dashboard-page';

const overview: DashboardOverview = {
  summary: {
    latest: { date: '2026-01-05', value: 1080 },
    dayChange: { absolute: -20, percentage: -1.82 },
    yearToDateChange: { absolute: 80, percentage: 8 },
    totalDataPoints: 5,
    dateRange: { from: '2026-01-01', to: '2026-01-05' },
  },
  period: {
    entries: [],
    change: { absolute: 80, percentage: 8 },
    pointCount: 5,
    bestDay: { date: '2026-01-04', change: 70 },
    volatility: 40.62,
    trendLine: null,
    benchmarkLine: null,
  },
};

describe('DashboardPage', () => {
  it('renders 8 stat cards from the use-case result', async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardPage],
      providers: [{ provide: GetDashboardOverviewUseCase, useValue: { execute: () => of(overview) } }],
    }).compileComponents();

    const fixture = TestBed.createComponent(DashboardPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const cards = fixture.nativeElement.querySelectorAll('app-stat-card');
    expect(cards.length).toBe(8);
    expect(cards[0].querySelector('.value')?.textContent).toContain('1.080');
    expect(cards[0].querySelector('.label')?.textContent).toContain('Latest total');
  });

  it('renders 8 placeholder cards while the use-case has not emitted yet', async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardPage],
      providers: [{ provide: GetDashboardOverviewUseCase, useValue: { execute: () => of() } }],
    }).compileComponents();

    const fixture = TestBed.createComponent(DashboardPage);
    fixture.detectChanges();

    const cards = fixture.nativeElement.querySelectorAll('app-stat-card');
    expect(cards.length).toBe(8);
    expect(cards[0].querySelector('.value')?.textContent).toContain('—');
  });
});
