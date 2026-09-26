import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { SlideButtonComponent } from '@kirbydesign/designsystem/slide-button';
import { LandingPage } from './landing-page';

describe('LandingPage', () => {
  it('navigates to the dashboard when the slide button completes', () => {
    const router = { navigateByUrl: vi.fn() };

    TestBed.overrideProvider(Router, { useValue: router });
    const fixture = TestBed.createComponent(LandingPage);
    fixture.detectChanges();

    const slideButton = fixture.debugElement.query(By.directive(SlideButtonComponent));
    slideButton.triggerEventHandler('slideDone', undefined);

    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });
});
