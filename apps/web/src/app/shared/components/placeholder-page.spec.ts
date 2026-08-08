import { ActivatedRoute } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { PlaceholderPage } from './placeholder-page';

describe('PlaceholderPage', () => {
  it('renders the title and description from route data', async () => {
    await TestBed.configureTestingModule({
      imports: [PlaceholderPage],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { data: of({ title: 'Workspaces', description: 'Pick a workspace.' }) },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(PlaceholderPage);
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Workspaces');
    expect(compiled.querySelector('p')?.textContent).toContain('Pick a workspace.');
  });
});
