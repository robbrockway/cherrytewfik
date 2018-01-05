import { Component } from '@angular/core';

import { FormFieldComponent } from './form.field.component';

import {
	FormFieldComponentTestBase,
	FormFieldHostComponent,
} from './form.field.component.test.base';

import { FormField } from './form';



@Component({
	template: `
		<form-field
			[inputColSpan]="inputColSpan"
			[field]="field"
			(input)="onInput($event)"
			(enter)="onEnter()"
		></form-field>
	`,
})
class HostComponent extends FormFieldHostComponent {
	inputColSpan: number;
}



class FormFieldComponentTest extends FormFieldComponentTestBase {

	constructor() {
		super(
			FormFieldComponent,
			HostComponent
		);
	}


	protected defineTests(): void {
		super.defineTests();


		it(`'s input cell should have correct column span`, () => {
			const testColSpan = 3;

			this.hostComponent.inputColSpan = testColSpan;
			this.fixture.detectChanges();

			const tableCells = this.getAllChildNativeElementsByCss(
				'td'
			) as HTMLTableCellElement[];

			const inputCell = tableCells[1];

			expect(inputCell.colSpan).toBe(testColSpan);
		});

	}


	protected get labelCssSelector(): string {
		return 'label';
	}

}


new FormFieldComponentTest();
