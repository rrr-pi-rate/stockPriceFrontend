import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SegmentedControlComponent } from '@kirbydesign/designsystem/segmented-control';
import { Period } from '../../../domain/models/period.model';
import { PeriodSelector } from './period-selector';

describe('PeriodSelector', () => {
  it('selects the segment matching the given period', () => {
    const fixture = TestBed.createComponent(PeriodSelector);
    fixture.componentRef.setInput('period', { kind: 'ytd' });
    fixture.detectChanges();

    const segmentedControl = fixture.debugElement.query(By.directive(SegmentedControlComponent));
    expect(segmentedControl.componentInstance.selectedIndex).toBe(5);
  });

  it('emits the period matching the selected segment', () => {
    const fixture = TestBed.createComponent(PeriodSelector);
    fixture.componentRef.setInput('period', { kind: 'all' });
    fixture.detectChanges();

    let emitted: Period | undefined;
    fixture.componentInstance.periodChange.subscribe((period: Period) => (emitted = period));

    const segmentedControl = fixture.debugElement.query(By.directive(SegmentedControlComponent));
    segmentedControl.triggerEventHandler('segmentSelect', {
      id: '30',
      text: '1M',
      period: { kind: 'trailing-days', days: 30 },
    });

    expect(emitted).toEqual({ kind: 'trailing-days', days: 30 });
  });
});
