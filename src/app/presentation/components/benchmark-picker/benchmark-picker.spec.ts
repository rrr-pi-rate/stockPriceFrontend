import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DropdownComponent } from '@kirbydesign/designsystem/dropdown';
import { BenchmarkKind } from '../../../domain/models/benchmark.model';
import { BenchmarkPicker } from './benchmark-picker';

describe('BenchmarkPicker', () => {
  it('selects the dropdown item matching the given benchmark', () => {
    const fixture = TestBed.createComponent(BenchmarkPicker);
    fixture.componentRef.setInput('benchmark', 'omxc25');
    fixture.detectChanges();

    const dropdown = fixture.debugElement.query(By.directive(DropdownComponent));
    expect(dropdown.componentInstance.selectedIndex).toBe(2);
  });

  it('emits the benchmark matching the selected dropdown item', () => {
    const fixture = TestBed.createComponent(BenchmarkPicker);
    fixture.componentRef.setInput('benchmark', 'msci');
    fixture.detectChanges();

    let emitted: BenchmarkKind | undefined;
    fixture.componentInstance.benchmarkChange.subscribe((benchmark: BenchmarkKind) => (emitted = benchmark));

    const dropdown = fixture.debugElement.query(By.directive(DropdownComponent));
    dropdown.triggerEventHandler('change', { id: 'inflation', text: 'Inflation (~2,5% p.a.)' });

    expect(emitted).toBe('inflation');
  });
});
