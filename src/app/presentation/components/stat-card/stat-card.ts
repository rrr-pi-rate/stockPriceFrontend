import { Component, input } from '@angular/core';
import { CardComponent } from '@kirbydesign/designsystem/card';

export type StatCardTone = 'positive' | 'negative' | 'neutral';

@Component({
  selector: 'app-stat-card',
  imports: [CardComponent],
  templateUrl: './stat-card.html',
  styleUrl: './stat-card.scss',
})
export class StatCard {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly sub = input<string>();
  readonly tone = input<StatCardTone>('neutral');
}
