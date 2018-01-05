// Data model for LoginFormComponent

import { FormField } from '../form';
import { objectHasPropertyValue } from 'utils';



export class LoginError extends Error {

	constructor(
		message: string,
		public type?: LoginError.Type
	) {
		super(message);
		
		if(type === undefined)
			this.type = this.detectType(message);
	}


	// Arrow syntax, as it otherwise doesn't seem to be callable from the constructor (TypeScript bug?)
	private detectType = (message: string) => {
		if(objectHasPropertyValue(LoginError.messages.email, message))
			return LoginError.Type.Email;
		
		if(objectHasPropertyValue(LoginError.messages.password, message))
			return LoginError.Type.Password;
		
		return LoginError.Type.General;
	};

}



export module LoginError {

	export enum Type {
		Email,
		Password,
		General,
	}


	export const messages = {
		email: {
			none: 'You must supply an email address',
			invalid: 'No user exists with that email address',
		},

		password: {
			none: 'You must supply a password',
			invalid: 'Invalid password',
		},
	};

}



export class LoginForm {
	
	fields: FormField[] = [
		new FormField('email', 'Email address', '', 'email'),
		new FormField('password', 'Password', '', 'password'),
	];

	generalError: string;	// for display at bottom of form

	state: LoginForm.State = LoginForm.State.Idle;


	constructor() {
		for(let field of this.fields)
			field.value$.subscribe(() => this.onFieldValueChange());
	}


	private onFieldValueChange(): void {
		this.generalError = '';
	}


	get email(): string {
		return this.emailField.value;
	}


	get emailField(): FormField {
		return this.fields[0];
	}


	get password(): string {
		return this.passwordField.value;
	}


	get passwordField(): FormField {
		return this.fields[1];
	}


	checkIsComplete(): void {
		if(!this.emailField.value) {
			throw new LoginError(
				LoginError.messages.email.none,
				LoginError.Type.Email
			);
		}

		if(!this.passwordField.value) {
			throw new LoginError(
				LoginError.messages.password.none,
				LoginError.Type.Password
			);
		}
	}


	focus(): void {
		this.emailField.focus();
	}


	clear(): void {
		for(let field of this.fields)
			field.clear();
	}


	showError(error: LoginError): void {
		this.state = LoginForm.State.Idle;

		switch(error.type) {
		case LoginError.Type.Email:
			this.emailField.error = error.message;
			break;
		case LoginError.Type.Password:
			this.passwordField.error = error.message;
			break;
		case LoginError.Type.General:
			this.generalError = error.message;
		}
	}

}



export module LoginForm {

	export enum State {
		Idle,		// Form is being filled in, or ready to be
		Working,	// Credentials submitted; awaiting response
	}

}