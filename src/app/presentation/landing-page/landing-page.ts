import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SlideButtonComponent } from '@kirbydesign/designsystem/slide-button';

@Component({
  selector: 'app-landing-page',
  imports: [SlideButtonComponent],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.scss',
})
export class LandingPage {
  private readonly router = inject(Router);

  protected onSlideDone(): void {
    this.router.navigateByUrl('/dashboard');
  }
}
