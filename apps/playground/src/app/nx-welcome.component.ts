import { Component, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SmzCoreComponent } from '@smz-ui/core';
@Component({
  selector: 'app-nx-welcome',
  imports: [CommonModule, SmzCoreComponent],
  template: `
  <div>Playground Works!</div>
  <lib-smz-core></lib-smz-core>
  `,
  styles: [],
  encapsulation: ViewEncapsulation.None,
})
export class NxWelcomeComponent {}
