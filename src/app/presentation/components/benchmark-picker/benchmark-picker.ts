import { Component, computed, input, output } from '@angular/core';
import { DropdownComponent } from '@kirbydesign/designsystem/dropdown';
import { BenchmarkKind } from '../../../domain/models/benchmark.model';

interface BenchmarkOption {
  readonly id: BenchmarkKind;
  readonly text: string;
}

const OPTIONS: readonly BenchmarkOption[] = [
  { id: 'msci', text: 'MSCI World (~10% p.a.)' },
  { id: 'sp500', text: 'S&P 500 (~11% p.a.)' },
  { id: 'omxc25', text: 'OMXC25 (~8% p.a.)' },
  { id: 'inflation', text: 'Inflation (~2,5% p.a.)' },
];

@Component({
  selector: 'app-benchmark-picker',
  imports: [DropdownComponent],
  templateUrl: './benchmark-picker.html',
})
export class BenchmarkPicker {
  readonly benchmark = input.required<BenchmarkKind>();
  readonly benchmarkChange = output<BenchmarkKind>();

  protected readonly options = OPTIONS;

  protected readonly selectedIndex = computed(() =>
    this.options.findIndex((option) => option.id === this.benchmark()),
  );

  protected onChange(option: BenchmarkOption): void {
    this.benchmarkChange.emit(option.id);
  }
}
