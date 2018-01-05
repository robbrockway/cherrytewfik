import { Component, DebugElement } from '@angular/core';
import { TestModuleMetadata, async } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import { Form, FormField } from './form';
import { FormComponent } from './form.component';

import {
	testForms,
	HostedComponentTest,
	MockFormFieldDirective,
	getAllChildDebugElementsByCss,
	getAllChildDirectivesOfType,
	mergeModuleMetadata,
	forEachPair,
} from 'testing';



@Component({
	template: '<form-comp [form]="form"></form-comp>',
})
class HostComponent {
	form: Form;
}



class FormComponentTest extends HostedComponentTest {

	constructor() {
		super(
			FormComponent,
			HostComponent
		);
	}


	protected getModuleMetadata(): TestModuleMetadata {
		const defaultMetadata = super.getModuleMetadata();

		const extraMetadata = {
			imports: [FormsModule],
			declarations: [MockFormFieldDirective],
		};

		return mergeModuleMetadata(defaultMetadata, extraMetadata);
	}


	protected defineTests(): void {
		super.defineTests();

		let checkNumRowsEqualsNumFields: (form: Form) => void;
		let setForm: (form: Form) => void;

		type FieldFunction = (
			field: FormField,
			fieldComponent: MockFormFieldDirective,
			rowLength: number
		) => void;


		let forEachField: (func: FieldFunction) => void;

		type RowFunction = (
			fieldsRow: FormField[],
			tableRow: DebugElement
		) => void;

		let forEachRow: (func: RowFunction) => void;

		let getTableRows: () => DebugElement[];

		let forEachFieldInRow: (
			fieldsRow: FormField[],
			tableRow: DebugElement,
			func: FieldFunction
		) => void;


		it('should pass correct field to each MockFormFieldDirective', () => {
			setForm(testForms.plain);

			forEachField((
				field: FormField,
				fieldComponent: MockFormFieldDirective
			) => {
				expect(fieldComponent.field).toBe(field);
			});
		});


		setForm = (form: Form) => {
			this.hostComponent.form = form;
			this.fixture.detectChanges();
		};


		forEachField = (func: FieldFunction) => {
			forEachRow((fieldsRow: FormField[], tableRow: DebugElement) => {
				forEachFieldInRow(fieldsRow, tableRow, func);
			});
		};


		forEachRow = (func: RowFunction) => {
			const fields = this.hostComponent.form.fields;
			const tableRows = getTableRows();

			forEachPair(fields, tableRows, func);
		};

	
		getTableRows = () => this.getAllChildDebugElementsByCss('tr');


		forEachFieldInRow = (
			fieldsRow: FormField[],
			tableRow: DebugElement,
			func: FieldFunction
		) => {

			const fieldDirectivesInRow = getAllChildDirectivesOfType(
				tableRow,
				MockFormFieldDirective
			);

			forEachPair(
				fieldsRow,
				fieldDirectivesInRow,
				(field: FormField, fieldDirective: MockFormFieldDirective) => {
					func(field, fieldDirective, fieldDirectivesInRow.length);
				}
			);
		};


		it(
			'should give each field an inputColSpan of 1 '
			+ 'if no half-width fields',
				() => {
		
			setForm(testForms.plain);

			forEachField((
				field: any,
				fieldComponent: MockFormFieldDirective
			) => {
				expect(fieldComponent.inputColSpan).toBe(1);
			});
		});


		it(
			'should give full-width fields an inputColSpan of 3 '
			+ 'if there are other half-width fields',
				() => {

			setForm(testForms.withTwoFieldsInFirstRow);

			forEachField((
				field: any,
				fieldComponent: MockFormFieldDirective,
				rowLength: number
			) => {
				if(rowLength === 1)
					expect(fieldComponent.inputColSpan).toBe(3);
			});
		});


		it('should give half-width fields an inputColSpan of 1', () => {

			setForm(testForms.withTwoFieldsInFirstRow);

			forEachField((
				field: any,
				fieldComponent: MockFormFieldDirective,
				rowLength: number
			) => {
				if(rowLength > 1)
					expect(fieldComponent.inputColSpan).toBe(1);
			});
		});
	}

}


new FormComponentTest();
