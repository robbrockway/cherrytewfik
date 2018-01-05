import { async } from '@angular/core/testing';

import { Form, FormField } from './form';
import { testForms } from 'testing';



describe('FormField', () => {

	let field: FormField;

	
	beforeEach(() => {
		field = new FormField('test', 'Test field');
	});


	it('should set default value to empty string', () => {
		expect(field.value).toBe('');
	});


	it(`should set default input type to 'text'`, () => {
		expect(field.htmlInputType).toBe('text');
	});


	it('should emit new value through .value$', done => {
		const actualValue = 'Potty potty pot pot';
			 
		field.value$.subscribe((emittedValue: string) => {
			expect(emittedValue).toBe(actualValue);
			done();
		});

		field.value = actualValue;
	});


	it('should clear error when value changes', () => {
		field.error = 'Error';
		field.value = 'Value';
		expect(field.error).toBe('');
	});


	it('should clear value when error occurs', () => {
		field.value = 'Value';
		field.error = 'Error';
		expect(field.value).toBe('');
	});


	it('should focus when error occurs', done => {
		field.focus$.subscribe(done);
		field.error = 'Error';
	});


	it(`shouldn't clear value when error is set to nothing`, () => {
		field.value = 'Value';
		field.error = '';
		expect(field.value).toBe('Value');
	});


	it('.focus() should cause .focus$ to emit', done => {
		field.focus$.subscribe(() => done());
		field.focus();
	});


	describe('.clear()', () => {

		it('should nullify value', () => {
			field.value = 'Value';
			field.clear();
			expect(field.value).toBe(null);
		});

		
		it('should emit null through .value$', done => {
			field.value$.subscribe((value: string) => {
				expect(value).toBe(null);
				done();
			});

			field.clear();
		});

	});

});



describe('Form', () => {

	let form: Form;


	describe('.rowHasOnlyOneField()', () => {

		beforeEach(() => form = testForms.plain);


		it('should return true for singleton row', () => {
			form.fields.forEach((row: FormField[], rowIndex: number) => {
				if(row.length == 1)
					expect(form.rowHasOnlyOneField(rowIndex)).toBeTruthy();
			});
		});


		it('should return false for multi-field row', () => {
			form.fields.forEach((row: FormField[], rowIndex: number) => {
				if(row.length > 1)
					expect(form.rowHasOnlyOneField(rowIndex)).toBeFalsy();
			});
		});

	});


	describe('.hasAnyMultiFieldRows()', () => {

		it('should return true if there is one', () => {
			form = testForms.withTwoFieldsInFirstRow;
			expect(form.hasAnyMultiFieldRows()).toBeTruthy();
		});


		it(`should return false if there isn't one`, () => {
			form = testForms.plain;
			expect(form.hasAnyMultiFieldRows()).toBeFalsy();
		});

	});

});