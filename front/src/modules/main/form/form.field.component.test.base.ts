// For testing FormFieldComponent and LoginFormFieldComponent

import { Type } from '@angular/core';

import {
	TestModuleMetadata,
	async,
	fakeAsync,
	flushMicrotasks,
} from '@angular/core/testing';

import { FormsModule } from '@angular/forms';

import { FormField } from './form';
import { FormFieldComponentBase } from './form.field.component.base';

import {
	HostedComponentTest,
	mergeModuleMetadata,
	testForms,
} from 'testing';



const testField = testForms.withDefaults.fields[0][0];



export abstract class FormFieldHostComponent {
	field: FormField;
	onInput = jasmine.createSpy('onInput');
	onEnter = jasmine.createSpy('onEnter');
}



export abstract class FormFieldComponentTestBase
		extends HostedComponentTest {

	constructor(
		hostedComponent: Type<FormFieldComponentBase>,
		hostComponent: Type<FormFieldHostComponent>,
		testName?: string
	) {
		super(hostedComponent, hostComponent, testName);
	}


	protected getModuleMetadata(): TestModuleMetadata {
		const defaultMetadata = super.getModuleMetadata();

		const extraMetadata = {
			imports: [FormsModule],
		};

		return mergeModuleMetadata(defaultMetadata, extraMetadata);
	}


	protected defineTests(): void {
		super.defineTests();


		let setErrorMessage: () => void;
		let checkNoErrorMessage: () => void;
		let clearErrorMessage: () => void;


		beforeEach(() => {
			this.hostComponent.field = testField;
			this.fixture.detectChanges();
		});


		it('should show correct label', () => {
			this.checkChildTextContentIs(
				this.labelCssSelector,
				testField.label
			);
		});


		describe(`'s input element`, () => {

			let inputElement: HTMLInputElement;

			let setInputValue: (value: any) => void;


			beforeEach(() => {
				inputElement = this.getChildNativeElementByCss(
					'input'
				) as HTMLInputElement;
			});


			it('should have correct ID', () => {
				expect(inputElement.id).toBe(testField.name);
			});


			it('should be of the correct type', () => {
				expect(inputElement.type).toBe(testField.htmlInputType);
			});


			it('should have correct data model', () => {
				const model = inputElement.attributes['ng-reflect-model'];
				expect(model.value).toBe(testField.value);
			});


			it('should update field.value on alteration', async(() => {
				const newValue = 'New value';
				setInputValue(newValue);

				expect(testField.value).toBe(newValue);
			}));


			setInputValue = (value: any) => {
				inputElement.value = value;
				inputElement.dispatchEvent(new Event('input'));
			};


			it(`should trigger component's enter event, when enter is 
					pressed`, fakeAsync(() => {

				inputElement.dispatchEvent(
					new KeyboardEvent('keyup', {key: 'enter'})
				);	
				
				flushMicrotasks();

				expect(this.hostComponent.onEnter).toHaveBeenCalled();
				
			}));


			it('should focus, when field.focus$ emits', fakeAsync(() => {
				testField.focus();
				flushMicrotasks();
				expect(document.activeElement).toBe(inputElement);
			}));


			it(`'s input event should be reemitted by component`,
					async(() => {
				const event = new Event('input');
				inputElement.dispatchEvent(event);

				expect(this.hostComponent.onInput)
					.toHaveBeenCalledWith(event);
			}));

		});


		setErrorMessage = () => {
			const error = '<i>Test error message</i>';
			testField.error = error;
			this.fixture.detectChanges();
		};


		checkNoErrorMessage = () =>
			this.expectChildNativeElement('.error').toBeFalsy();


		it('should show error, if there is one', () => {
			setErrorMessage();

			this.checkChildHtmlContentIs(
				'.error', 
				testField.error
			);
		});


		it(`shouldn't show error if there isn't one`, () => {
			clearErrorMessage();
			checkNoErrorMessage();
		});


		clearErrorMessage = () => {
			testField.error = '';
			this.fixture.detectChanges();
		};

	}


	// for the element containing the field's label text
	protected abstract get labelCssSelector(): string;

}