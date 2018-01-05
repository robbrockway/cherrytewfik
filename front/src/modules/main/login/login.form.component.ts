import {
	Component,
	Input,
	Output,
	EventEmitter,
} from '@angular/core';

import { FormField } from '../form';
import { LoginForm } from './login.form';



@Component({
	selector: 'login-form',
	templateUrl: './login.form.component.html',
	styleUrls: ['./login.form.component.scss'],
})
export class LoginFormComponent {

	@Input() form: LoginForm;
	@Output() submit = new EventEmitter();


	get buttonLabel(): string {
		if(this.form.state === LoginForm.State.Working)
			return 'Signing in...';

		return 'Sign in';
	}


	onSubmit(): void {
		this.submit.emit();
	}

}