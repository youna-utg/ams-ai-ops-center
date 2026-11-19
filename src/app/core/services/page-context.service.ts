import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PageContextService {
  readonly organizationName = signal('');
  readonly userName = signal('');
  readonly productName = signal('');
  readonly providerName = signal('');
}
