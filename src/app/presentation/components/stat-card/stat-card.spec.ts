import { TestBed } from '@angular/core/testing';
import { StatCard } from './stat-card';

describe('StatCard', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatCard],
    }).compileComponents();
  });

  it('renders the label, value and sub text', () => {
    const fixture = TestBed.createComponent(StatCard);
    fixture.componentRef.setInput('label', 'Latest total');
    fixture.componentRef.setInput('value', '1.234.567 kr.');
    fixture.componentRef.setInput('sub', '+8,00 %');
    fixture.componentRef.setInput('tone', 'positive');
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.label')?.textContent).toContain('Latest total');
    expect(el.querySelector('.value')?.textContent).toContain('1.234.567 kr.');
    expect(el.querySelector('.sub')?.textContent).toContain('+8,00 %');
    expect(el.querySelector('.sub')?.classList.contains('positive')).toBe(true);
  });

  it('omits the sub line when no sub text is given', () => {
    const fixture = TestBed.createComponent(StatCard);
    fixture.componentRef.setInput('label', 'Total data points');
    fixture.componentRef.setInput('value', '312');
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.sub')).toBeNull();
  });
});
