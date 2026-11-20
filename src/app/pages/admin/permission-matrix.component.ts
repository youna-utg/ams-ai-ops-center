import { Component, input, output, signal } from '@angular/core';
import { MenuPermission, PERMISSION_MENUS, PermissionMenu, applyToggle } from './data/permission-catalog';

@Component({
  selector: 'app-permission-matrix',
  templateUrl: './permission-matrix.component.html',
  styleUrl: './permission-matrix.component.scss',
})
export class PermissionMatrixComponent {
  readonly permissions = input.required<readonly MenuPermission[]>();
  readonly editable = input(false);
  readonly changed = output<MenuPermission[]>();

  protected readonly menus = PERMISSION_MENUS;
  private readonly closedGroups = signal<ReadonlySet<string>>(new Set());

  protected groups(): { label: string; menus: PermissionMenu[] }[] {
    const groups: { label: string; menus: PermissionMenu[] }[] = [];
    this.menus.forEach((menu) => {
      const current = groups.find((group) => group.label === menu.group);
      if (current) current.menus.push(menu);
      else groups.push({ label: menu.group, menus: [menu] });
    });
    return groups;
  }

  protected open(group: string): boolean {
    return !this.closedGroups().has(group);
  }

  protected toggleGroup(group: string): void {
    const next = new Set(this.closedGroups());
    if (next.has(group)) next.delete(group);
    else next.add(group);
    this.closedGroups.set(next);
  }

  protected permission(key: string): MenuPermission {
    return this.permissions().find((item) => item.menuKey === key) ?? { menuKey: key, view: false, manage: false };
  }

  protected groupSummary(menus: readonly PermissionMenu[]): string {
    const rows = menus.map((menu) => this.permission(menu.key));
    const view = rows.filter((item) => item.view).length;
    const manage = rows.filter((item) => item.manage).length;
    return `View ${view} · Manage ${manage}`;
  }

  protected toggle(key: string, field: 'view' | 'manage', event: Event): void {
    const checked = event.target instanceof HTMLInputElement && event.target.checked;
    this.changed.emit(applyToggle(this.permissions(), key, field, checked));
  }
}
