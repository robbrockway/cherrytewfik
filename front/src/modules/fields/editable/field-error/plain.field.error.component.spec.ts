import { Component } from '@angular/core';

import { PlainFieldErrorComponent } from './plain.field.error.component';

import {
	FieldErrorComponentTestBase,
	FieldErrorHostComponent,
} from './field.error.component.test.base';



@Component({
	template: `
		<plain-field-error
			[message]="message"
			(tryAgain)="onTryAgain($event)"
		></plain-field-error>
	`,
})
class HostComponent extends FieldErrorHostComponent {}



class PlainFieldErrorComponentTest extends FieldErrorComponentTestBase {

	constructor() {
		super(PlainFieldErrorComponent, HostComponent);
	}

}


new PlainFieldErrorComponentTest();