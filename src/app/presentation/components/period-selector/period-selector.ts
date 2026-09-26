import { Component, computed, input, output } from '@angular/core';
import { SegmentedControlComponent, SegmentItem } from '@kirbydesign/designsystem/segmented-control';
import { Period, periodEquals } from '../../../domain/models/period.model';

interface PeriodOption extends SegmentItem {
  readonly period: Period;
}

const OPTIONS: readonly PeriodOption[] = [
  { id: '7', text: '1W', period: { kind: 'trailing-days', days: 7 } },
  { id: '30', text: '1M', period: { kind: 'trailing-days', days: 30 } },
  { id: '90', text: '3M', period: { kind: 'trailing-days', days: 90 } },
  { id: '180', text: '6M', period: { kind: 'trailing-days', days: 180 } },
  { id: '365', text: '1Y', period: { kind: 'trailing-days', days: 365 } },
  { id: 'ytd', text: 'YTD', period: { kind: 'ytd' } },
  { id: 'all', text: 'All history', period: { kind: 'all' } },
];

@Component({
  selector: 'app-period-selector',
  imports: [SegmentedControlComponent],
  templateUrl: './period-selector.html',
})
export class PeriodSelector {
  readonly period = input.required<Period>();
  readonly periodChange = output<Period>();

  protected readonly options = OPTIONS;

  protected readonly selectedIndex = computed(() =>
    this.options.findIndex((option) => periodEquals(option.period, this.period())),
  );

  protected onSegmentSelect(option: PeriodOption): void {
    this.periodChange.emit(option.period);
  }
}
