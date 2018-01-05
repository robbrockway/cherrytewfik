import { Component } from '@angular/core';

import { LoginFormFieldComponent } from './login.form.field.component';
import { FormField } from '../form';

import {
	FormFieldComponentTestBase,
	FormFieldHostComponent,
} from '../form/form.field.component.test.base';



@Component({
	template: `
			<login-form-field
				[field]="field"
				(input)="onInput($event)"
				(enter)="onEnter()"
			></login-form-field>
	`,
})
class HostComponent extends FormFieldHostComponent {}



class LoginFormFieldComponentTest extends FormFieldComponentTestBase {

	constructor() {
		super(LoginFormFieldComponent, HostComponent);
	}


	protected get labelCssSelector(): string {
		return '.label';
	}

}


new LoginFormFieldComponentTest();