import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, type Data } from '@angular/router';
import { map } from 'rxjs';

export interface PlaceholderPageData extends Data {
  title: string;
  description: string;
}

/**
 * Stand-in for a routed feature page that has not been built yet. Each route below wires this
 * component with route `data` so the route table in app.routes.ts stays real and testable while
 * features land week by week; replace with the real page component as each feature is built.
 */
@Component({
  selector: 'aka-placeholder-page',
  imports: [AsyncPipe],
  template: `
    <section class="placeholder-page">
      <h1>{{ (data | async)?.title }}</h1>
      <p>{{ (data | async)?.description }}</p>
    </section>
  `,
})
export class PlaceholderPage {
  private readonly route = inject(ActivatedRoute);
  // route.data is typed as Observable<Data> (an index-signature-only base type) by Angular; every
  // route wiring this component always supplies title/description (see app.routes.ts), so this
  // cast is safe.
  protected readonly data = this.route.data.pipe(map((data) => data as PlaceholderPageData));
}
