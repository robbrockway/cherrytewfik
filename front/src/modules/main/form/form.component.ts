import { Component, Input } from '@angular/core';

import { Form, FormField } from './form';




@Component({
	selector: 'form-comp',
	templateUrl: './form.component.html',
	styles: [],
})
export class FormComponent {

	@Input() form: Form;


	getInputColSpan(rowIndex: number): number {
		if(this.form.hasAnyMultiFieldRows()
				&& this.form.rowHasOnlyOneField(rowIndex))
			return 3;

		return 1;
	}

}