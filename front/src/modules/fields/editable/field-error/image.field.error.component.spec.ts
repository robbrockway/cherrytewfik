import { Component } from '@angular/core';

import { ImageFieldErrorComponent } from './image.field.error.component';

import {
	FieldErrorHostComponent,
	FieldErrorComponentTestBase,
} from './field.error.component.test.base';



@Component({
	template: `
		<image-field-error
			[message]="message"
			(tryAgain)="onTryAgain($event)"
		></image-field-error>
	`,
})
class HostComponent extends FieldErrorHostComponent {}



class ImageFieldErrorComponentTest extends FieldErrorComponentTestBase {

	constructor() {
		super(ImageFieldErrorComponent, HostComponent);
	}

}


new ImageFieldErrorComponentTest();