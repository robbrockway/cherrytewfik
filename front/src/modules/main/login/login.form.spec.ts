import { async } from '@angular/core/testing';

import { LoginError, LoginForm } from './login.form';
import { testCredentials } from 'testing';
import { getObjectPropertyValues } from 'utils';



describe('LoginError', () => {

	let checkMessagesAreDetectedAsType: (
		messagesDict: any,
		expectedType: LoginError.Type
	) => void;


	it('should auto-detect Email type for email errors', () => {
		checkMessagesAreDetectedAsType(
			LoginError.messages.email, 
			LoginError.Type.Email
		);
	});


	checkMessagesAreDetectedAsType = (
		messagesDict: any,
		expectedType: LoginError.Type
	) => {
		const messagesList = getObjectPropertyValues(messagesDict);

		for(let message of messagesList) {
			const error = new LoginError(message);
			expect(error.type).toBe(expectedType);
		}
	};


	it('should auto-detect Password type for password errors', () => {
		checkMessagesAreDetectedAsType(
			LoginError.messages.password,
			LoginError.Type.Password
		);
	});


	it('should auto-detect General type by default', () => {
		const error = new LoginError('Other message');
		expect(error.type).toBe(LoginError.Type.General);
	});

});




describe('LoginForm', () => {

	let form: LoginForm;


	beforeEach(() => {
		form = new LoginForm();
		form.emailField.value = testCredentials.email;
		form.passwordField.value = testCredentials.password;
	});


	it('.emailField should resolve to first field', () => {
		expect(form.emailField).toBe(form.fields[0]);
	});


	it('.passwordField should resolve to second field', () => {
		expect(form.passwordField).toBe(form.fields[1]);
	});


	it(`.email should resolve to email field's value `, () => {
		expect(form.email).toBe(form.emailField.value);
	});


	it(`.password should resolve to password field's value`, () => {
		expect(form.password).toBe(form.passwordField.value);
	});


	describe('.checkIsComplete()', () => {

		let checkErrorMessageIs: (
			expectedMessage: string
		) => void;


		it('should throw error if no email', () => {
			form.emailField.value = '';
			checkErrorMessageIs(LoginError.messages.email.none);
		});


		checkErrorMessageIs = (
			expectedMessage: string
		) => {
			try {
				form.checkIsComplete();				
				fail('Should have thrown error');
			} catch(error) {
				expect(error.message).toBe(expectedMessage);
			}
		};


		it('should throw error if no password', () => {
			form.passwordField.value = '';
			checkErrorMessageIs(LoginError.messages.password.none);
		});

	});


	it('.focus() should focus on first field', () => {
		spyOn(form.emailField, 'focus');
		form.focus();
		expect(form.emailField.focus).toHaveBeenCalled();
	});


	it('.clear() should clear both fields', () => {
		form.clear();

		for(let field of form.fields)
			expect(field.value).toBeFalsy();
	});


	it('should clear general error when either field emits value '
			+ 'from .value$', async(() => {

		for(let field of form.fields) {
			form.generalError = 'Error';
			field.value = 'New value';
			expect(form.generalError).toBeFalsy();
		}
	}));


	describe('.showError()', () => {

		const errorMessage = 'Error message';

		let showErrorOfType: (type: LoginError.Type) => void;


		it('should set state back to Idle', () => {
			form.state = LoginForm.State.Working;
			form.showError(new LoginError(errorMessage));
			expect(form.state).toBe(LoginForm.State.Idle);
		});


		it('should assign error with Email type to .emailField', () => {
			showErrorOfType(LoginError.Type.Email);
			expect(form.emailField.error).toBe(errorMessage);
		});


		showErrorOfType = (type: LoginError.Type) =>
			form.showError(new LoginError(errorMessage, type));


		it('should assign error with Password type to .passwordField',
				() => {
			showErrorOfType(LoginError.Type.Password);
			expect(form.passwordField.error).toBe(errorMessage);
		});


		it('should assign error with General type to .generalError',
				() => {
			showErrorOfType(LoginError.Type.General);
			expect(form.generalError).toBe(errorMessage);
		});

	});

});