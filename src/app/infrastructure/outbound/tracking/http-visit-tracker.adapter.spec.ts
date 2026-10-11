import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { HttpVisitTrackerAdapter } from './http-visit-tracker.adapter';

describe('HttpVisitTrackerAdapter', () => {
  let adapter: HttpVisitTrackerAdapter;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), HttpVisitTrackerAdapter],
    });
    adapter = TestBed.inject(HttpVisitTrackerAdapter);
    http = TestBed.inject(HttpTestingController);
  });

  it('POSTs to /track/<page>', () => {
    adapter.trackVisit('dashboard');

    const req = http.expectOne('/track/dashboard');
    expect(req.request.method).toBe('POST');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('swallows errors so tracking never breaks the app', () => {
    adapter.trackVisit('landing');

    expect(() =>
      http.expectOne('/track/landing').flush(null, { status: 500, statusText: 'Server Error' }),
    ).not.toThrow();
  });
});
