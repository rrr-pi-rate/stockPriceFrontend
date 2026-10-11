import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TrackedPage, VisitTrackerPort } from '../../../application/ports/outbound/visit-tracker.port';

@Injectable()
export class HttpVisitTrackerAdapter extends VisitTrackerPort {
  constructor(private readonly http: HttpClient) {
    super();
  }

  // Fire-and-forget: tracking must never affect the user, so errors are swallowed.
  override trackVisit(page: TrackedPage): void {
    this.http.post(`/track/${page}`, null).subscribe({ error: () => undefined });
  }
}
