// Just a simple error message, followed by a 'try again' link

import { Component } from '@angular/core';

import { FieldErrorComponentBase } from './field.error.component.base';



@Component({
	selector: 'plain-field-error',
	templateUrl: './plain.field.error.component.html',
})
export class PlainFieldErrorComponent extends FieldErrorComponentBase {}