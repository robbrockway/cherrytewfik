// Much like FormFieldComponent, this is simply a view for a FormField object, albeit with more compact formatting.

import { Component, Input } from '@angular/core';

import {
	FormField,
	FormFieldComponentBase,
} from '../form';



@Component({
	selector: 'login-form-field',
	templateUrl: './login.form.field.component.html',
	styleUrls: ['./login.form.field.component.scss'],
})
export class LoginFormFieldComponent extends FormFieldComponentBase {}