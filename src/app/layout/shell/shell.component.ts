import { Component, DestroyRef, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, SidebarComponent],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  private readonly dialogScrollTimers = new WeakMap<HTMLElement, number>();
  protected readonly sidebarCollapsed = signal(false);
  protected readonly mobileNavigationOpen = signal(false);

  constructor() {
    const onScroll = (event: Event): void => this.syncDialogScrollbar(event);
    document.addEventListener('scroll', onScroll, true);
    inject(DestroyRef).onDestroy(() => document.removeEventListener('scroll', onScroll, true));
  }

  protected toggleSidebar(): void {
    this.sidebarCollapsed.update((collapsed) => !collapsed);
  }

  protected toggleMobileNavigation(): void {
    this.mobileNavigationOpen.update((open) => !open);
  }

  protected closeMobileNavigation(): void {
    this.mobileNavigationOpen.set(false);
  }

  // Matches the dashboard detail dialog: the native bar stays hidden until scrolling.
  private syncDialogScrollbar(event: Event): void {
    const scroller = event.target;
    if (!(scroller instanceof HTMLElement)) return;
    const dialog = scroller.classList.contains('dialog') ? scroller : scroller.closest('.dialog');
    if (!(dialog instanceof HTMLElement)) return;
    const designed = dialog.querySelector(':scope > .dialog__scrollbar:not([data-auto])');
    if (designed) return;

    const existing = dialog.querySelector(':scope > .dialog__scrollbar[data-auto]');
    const thumb = existing instanceof HTMLElement ? existing : document.createElement('span');
    if (!(existing instanceof HTMLElement)) {
      thumb.className = 'dialog__scrollbar';
      thumb.dataset['auto'] = 'true';
      thumb.setAttribute('aria-hidden', 'true');
      dialog.append(thumb);
    }

    const overflow = scroller.scrollHeight - scroller.clientHeight;
    if (overflow <= 1) {
      thumb.classList.remove('is-active');
      return;
    }

    const rect = scroller.getBoundingClientRect();
    const inset = 12;
    const track = Math.max(0, scroller.clientHeight - inset * 2);
    const height = Math.max(32, (scroller.clientHeight / scroller.scrollHeight) * track);
    const top = rect.top + inset + (scroller.scrollTop / overflow) * Math.max(0, track - height);
    thumb.style.top = `${top}px`;
    thumb.style.left = `${rect.right - 14}px`;
    thumb.style.height = `${height}px`;
    thumb.classList.add('is-active');

    const previous = this.dialogScrollTimers.get(dialog);
    if (previous) window.clearTimeout(previous);
    this.dialogScrollTimers.set(dialog, window.setTimeout(() => thumb.classList.remove('is-active'), 700));
  }
}
