import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
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
  styleUrl: './period-selector.scss',
})
export class PeriodSelector implements AfterViewInit, OnDestroy {
  readonly period = input.required<Period>();
  readonly periodChange = output<Period>();

  private readonly mobile = signal(false);

  /** På mobil er der ikke plads til "All history". */
  protected readonly options = computed(() =>
    this.mobile()
      ? OPTIONS.map((option) => (option.id === 'all' ? { ...option, text: 'All' } : option))
      : OPTIONS,
  );

  protected readonly canScrollLeft = signal(false);
  protected readonly canScrollRight = signal(false);

  @ViewChild('scroller') private readonly scroller?: ElementRef<HTMLElement>;

  private resizeObserver?: ResizeObserver;

  constructor() {
    if (typeof window.matchMedia === 'function') {
      const query = window.matchMedia('(max-width: 700px)');
      this.mobile.set(query.matches);
      query.addEventListener('change', (event) => this.mobile.set(event.matches));
    }

    // Knappernes tekst (og dermed bredden) ændrer sig med options
    effect(() => {
      this.options();
      queueMicrotask(() => this.updateScrollState());
    });
  }

  ngAfterViewInit(): void {
    const element = this.scroller?.nativeElement;
    if (!element || typeof ResizeObserver === 'undefined') return;
    this.resizeObserver = new ResizeObserver(() => this.updateScrollState());
    this.resizeObserver.observe(element);
    const control = element.firstElementChild;
    if (control) this.resizeObserver.observe(control);
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  protected updateScrollState(): void {
    const element = this.scroller?.nativeElement;
    if (!element) return;
    this.canScrollLeft.set(element.scrollLeft > 1);
    this.canScrollRight.set(element.scrollLeft + element.clientWidth < element.scrollWidth - 1);
  }

  protected readonly selectedIndex = computed(() =>
    OPTIONS.findIndex((option) => periodEquals(option.period, this.period())),
  );

  protected onSegmentSelect(option: PeriodOption): void {
    this.periodChange.emit(option.period);
  }
}
