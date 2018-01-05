import { Component, Input, Output, EventEmitter } from '@angular/core';

import { Form, FormField } from './form';
import { FormFieldComponentBase } from './form.field.component.base';



@Component({
	selector: 'form-field',
	templateUrl: './form.field.component.html',
})
export class FormFieldComponent extends FormFieldComponentBase {

	@Input() inputColSpan: number;

}