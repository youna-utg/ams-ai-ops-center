import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { OrganizationsStore } from '../../organizations/data/organizations.store';
import { CreateUserInput } from '../../organizations/models/organization.models';

interface ImportRow {
  rowNumber: number;
  name: string;
  email: string;
  organizationCode: string;
  teamName: string;
  phone: string;
  jobTitle: string;
  errors: string[];
}

@Component({
  selector: 'app-user-import-page',
  imports: [IconComponent],
  templateUrl: './user-import.page.html',
  styleUrl: './user-import.page.scss',
})
export class UserImportPage {
  private readonly store = inject(OrganizationsStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly fileError = signal('');
  protected readonly rows = signal<ImportRow[]>([]);
  protected readonly importedCount = signal<number | null>(null);
  protected readonly validCount = () => this.rows().filter((row) => row.errors.length === 0).length;

  protected listQuery(): Record<string, string> {
    const query: Record<string, string> = {};
    this.route.snapshot.queryParamMap.keys.forEach((key) => {
      const value = this.route.snapshot.queryParamMap.get(key);
      if (value !== null) query[key] = value;
    });
    return query;
  }

  protected downloadTemplate(): void {
    const content = [
      'Full Name,Email,Organization Code,Team Name,Phone Number,Job Title',
      '예시 사용자,sample.user@example.com,ORG-0001,운영팀,010-0000-0000,매니저',
    ].join('\n');
    const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'users-template.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  protected async onFile(event: Event): Promise<void> {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || !input.files?.[0]) return;
    const file = input.files[0];
    this.importedCount.set(null);
    if (/\.xlsx?$/i.test(file.name)) {
      this.rows.set([]);
      this.fileError.set('XLSX는 이 프로토타입에서 지원하지 않습니다. CSV 파일을 사용해 주세요.');
      input.value = '';
      return;
    }
    if (!file.name.toLowerCase().endsWith('.csv')) {
      this.rows.set([]);
      this.fileError.set('CSV 파일만 업로드할 수 있습니다.');
      input.value = '';
      return;
    }
    const parsed = this.parseCsv(await file.text());
    const headers = parsed[0]?.map((header) => header.toLowerCase()) ?? [];
    const index = (name: string) => headers.indexOf(name.toLowerCase());
    const required = ['full name', 'email', 'organization code'];
    if (required.some((name) => index(name) < 0)) {
      this.rows.set([]);
      this.fileError.set('Full Name, Email, Organization Code 헤더가 필요합니다.');
      input.value = '';
      return;
    }
    this.fileError.set('');
    const rows = parsed.slice(1).map((cells, offset) => ({
      rowNumber: offset + 2,
      name: cells[index('full name')] ?? '',
      email: cells[index('email')] ?? '',
      organizationCode: cells[index('organization code')] ?? '',
      teamName: index('team name') >= 0 ? cells[index('team name')] ?? '' : '',
      phone: index('phone number') >= 0 ? cells[index('phone number')] ?? '' : '',
      jobTitle: index('job title') >= 0 ? cells[index('job title')] ?? '' : '',
      errors: [],
    }));
    this.rows.set(this.validate(rows));
    input.value = '';
  }

  protected updateRow(rowNumber: number, key: keyof Omit<ImportRow, 'rowNumber' | 'errors'>, value: string): void {
    this.rows.set(this.validate(this.rows().map((row) => row.rowNumber === rowNumber ? { ...row, [key]: value } : row)));
  }

  protected importUsers(): void {
    const rows = this.validate(this.rows());
    this.rows.set(rows);
    if (!rows.length || rows.some((row) => row.errors.length)) return;
    try {
      const created = this.store.importUsers(rows.map((row) => this.toInput(row)));
      this.importedCount.set(created.length);
      this.rows.set([]);
    } catch (error) {
      this.fileError.set(error instanceof Error ? error.message : '등록하지 못했습니다. 데이터는 변경되지 않았습니다.');
    }
  }

  protected backToUsers(): void {
    void this.router.navigate(['/users'], { queryParams: this.listQuery() });
  }

  private toInput(row: ImportRow): CreateUserInput {
    const organization = this.store.organizations().find((item) => item.code.toLowerCase() === row.organizationCode.trim().toLowerCase());
    const team = this.store.teams().find((item) =>
      item.organizationId === organization?.id && item.name.toLowerCase() === row.teamName.trim().toLowerCase(),
    );
    return {
      name: row.name,
      email: row.email,
      organizationId: organization?.id ?? '',
      teamId: row.teamName.trim() ? team?.id ?? null : null,
      phone: row.phone,
      jobTitle: row.jobTitle,
      registrationType: 'bulk',
    };
  }

  private validate(rows: readonly ImportRow[]): ImportRow[] {
    const seen = new Set<string>();
    return rows.map((row) => {
      const errors: string[] = [];
      const email = row.email.trim().toLowerCase();
      if (!row.name.trim()) errors.push('이름은 필수입니다.');
      if (!email) errors.push('이메일은 필수입니다.');
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('이메일 형식이 올바르지 않습니다.');
      if (email && seen.has(email)) errors.push('파일 안에 같은 이메일이 있습니다.');
      if (email) seen.add(email);
      const existing = email ? this.store.isEmailTaken(email) : false;
      if (email && existing) errors.push('이미 등록된 이메일입니다.');
      const organization = this.store.organizations().find((item) => item.code.toLowerCase() === row.organizationCode.trim().toLowerCase());
      if (!row.organizationCode.trim()) errors.push('Organization Code는 필수입니다.');
      else if (!organization) errors.push('Organization을 찾을 수 없습니다.');
      if (row.teamName.trim() && organization) {
        const team = this.store.teams().some((item) =>
          item.organizationId === organization.id && item.name.toLowerCase() === row.teamName.trim().toLowerCase(),
        );
        if (!team) errors.push('해당 Organization에 Team이 없습니다.');
      }
      return { ...row, errors };
    });
  }

  private parseCsv(text: string): string[][] {
    const rows: string[][] = [];
    let row: string[] = [];
    let cell = '';
    let quoted = false;
    const source = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    for (let index = 0; index < source.length; index += 1) {
      const char = source[index];
      if (quoted) {
        if (char === '"') {
          if (source[index + 1] === '"') { cell += '"'; index += 1; }
          else quoted = false;
        } else cell += char;
      } else if (char === '"') quoted = true;
      else if (char === ',') { row.push(cell.trim()); cell = ''; }
      else if (char === '\n') { row.push(cell.trim()); rows.push(row); row = []; cell = ''; }
      else cell += char;
    }
    if (cell || row.length) { row.push(cell.trim()); rows.push(row); }
    return rows.filter((item) => item.some((value) => value));
  }
}
