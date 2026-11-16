import { Component, input } from '@angular/core';
import { NavIcon } from '../../../core/config/navigation.config';

export type UiIcon =
  | NavIcon
  | 'menu'
  | 'collapse'
  | 'search'
  | 'bell'
  | 'chevron-down'
  | 'chevron-left'
  | 'chevron-right'
  | 'close'
  | 'command'
  | 'calendar'
  | 'filter'
  | 'sliders'
  | 'arrow-up'
  | 'arrow-down'
  | 'sort'
  | 'more'
  | 'info'
  | 'eye'
  | 'eye-off'
  | 'plus';

@Component({
  selector: 'app-icon',
  standalone: true,
  templateUrl: './icon.component.html',
  styleUrl: './icon.component.scss',
})
export class IconComponent {
  readonly name = input.required<UiIcon>();
  readonly size = input(20);
}
