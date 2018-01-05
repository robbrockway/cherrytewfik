import { Component } from '@angular/core';

import {
	TestModuleMetadata,
	fakeAsync,
	flushMicrotasks,
} from '@angular/core/testing';

import { FormField } from '../form';
import { LoginForm } from './login.form';
import { LoginFormComponent } from './login.form.component';

import {
	HostedComponentTest,
	MockLoginFormFieldDirective,
	forEachPair,
} from 'testing';



@Component({
	template: `
		<login-form
			[form]="form"
			(submit)="onSubmit()"
		></login-form>
	`,
})
class HostComponent {
	form = new LoginForm();
	onSubmit = jasmine.createSpy('onSubmit');
}



class LoginFormComponentTest extends HostedComponentTest {

	constructor() {
		super(LoginFormComponent, HostComponent);
	}


	protected getModuleMetadata(): TestModuleMetadata {
		const metadata = super.getModuleMetadata();
		metadata.declarations.push(MockLoginFormFieldDirective);
		return metadata;
	}


	protected defineTests(): void {
		super.defineTests();

		let form: LoginForm;

		type FieldAndComponentFunc = (
			field: FormField,
			mockComponent: MockLoginFormFieldDirective
		) => void;

		let forEachFieldAndItsComponent: (
			func: FieldAndComponentFunc
		) => void;

		let setFormState: (state: LoginForm.State) => void;


		beforeEach(() => {
			this.fixture.detectChanges();
			form = this.hostComponent.form;
		});


		it('should pass each field to its own LoginFormFieldComponent',
				() => {
			
			forEachFieldAndItsComponent((
				field: FormField,
				component: MockLoginFormFieldDirective
			) => {
				expect(component.field).toBe(field);
			});
		});


		forEachFieldAndItsComponent = (
			func: FieldAndComponentFunc
		) => {
			const mockFormFieldComponents =
				this.getAllChildDirectivesOfType(MockLoginFormFieldDirective);

			forEachPair(form.fields, mockFormFieldComponents, func);
		};


		it(`should label button 'Sign in' when state is Idle`, () => {
			setFormState(LoginForm.State.Idle);
			this.checkChildTextContentIs('button', 'Sign in');
		});


		setFormState = (state: LoginForm.State) => {
			form.state = state;
			this.fixture.detectChanges();
		};


		it(`should label button 'Signing in...' when state is Working`,
				() => {
			setFormState(LoginForm.State.Working);
			this.checkChildTextContentIs('button', 'Signing in...');
		});


		it('should display general error message, if existent', () => {
			const errorMessage = '<i>Error message</i>';
			form.generalError = errorMessage;
			this.fixture.detectChanges();
			this.checkChildHtmlContentIs('.error.general', errorMessage);
		});


		describe('should emit submit event', () => {

			it('when button is clicked', fakeAsync(() => {
				const button = this.getChildNativeElementByCss('button');
				button.click();
			}));


			describe('when enter is pressed', () => {

				let mockFormFieldComponents: MockLoginFormFieldDirective[];
				let currentFieldComponent: MockLoginFormFieldDirective;


				beforeEach(() => {
					mockFormFieldComponents =
						this.getAllChildDirectivesOfType(
							MockLoginFormFieldDirective
						);
				});


				it('in email field', () => {
					currentFieldComponent = mockFormFieldComponents[0];
				});


				it('in password field', () => {
					currentFieldComponent = mockFormFieldComponents[1];
				});


				afterEach(fakeAsync(() => {
					currentFieldComponent.enter.emit();
				}));

			});


			afterEach(fakeAsync(() => {
				flushMicrotasks();
				expect(this.hostComponent.onSubmit).toHaveBeenCalled();
			}));

		});

	}

}


new LoginFormComponentTest();