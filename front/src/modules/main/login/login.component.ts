import {
	Component,
	ViewChild,
} from '@angular/core';

import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/take';
import 'rxjs/add/operator/finally';

import { User, UserService } from '../models';
import { LoginForm, LoginError } from './login.form';



enum State {
	LoggedOut,
	LoggingIn,
	LoggedIn,
	LoggingOut,
}



const titles = {
	signIn: 'Sign in',
	signingIn: 'Signing in...',
	signingOut: 'Signing out...',
};



@Component({
	selector: 'login',
	templateUrl: './login.component.html',
})
export class LoginComponent {

	private State = State;	// for access by template

	// Separate value from .userService.loggedIn; lags slightly behind the service's one in its changes, so that the flyout has a chance to close before switching its contents
	loggedIn: boolean;
	
	flyoutOpen: boolean;	// true for open; false for closed
	private flyoutClosed$ = new Subject();	// when flyout has finished closing
	private busy: boolean;	// Busy logging in, or out

	form = new LoginForm();



	constructor(private userService: UserService) {
		this.loggedIn = userService.loggedIn;

		// In case this component loads before current logged-in user data does
		userService.initialUser$.subscribe(() => this.loggedIn = true);
	}


	// Text for heading of 'flyout' drawer that contains login controls
	get flyoutTitle(): string {
		switch(this.state) {
		case State.LoggedOut:
			return titles.signIn;
		case State.LoggingIn:
			return titles.signingIn;
		case State.LoggedIn:
			return this.user.fullName;
		case State.LoggingOut:
			return titles.signingOut;
		}
	}


	onFlyoutOpenOrClose(open: boolean): void {
		if(open)
			this.form.focus();
	}


	onFlyoutFinishedClosing(): void {
		this.flyoutClosed$.next();
	}


	private get state(): State {
		if(!this.loggedIn) {
			if(!this.busy)
				return State.LoggedOut;
			
			return State.LoggingIn;
		}

		if(!this.busy)
			return State.LoggedIn;

		return State.LoggingOut;
	}


	private get user(): User {
		return this.userService.currentUser;
	}


	onSubmit(): void {
		this.login();
	}


	private login(): void {
		if(this.state !== State.LoggedOut)
			return;	// Can only be logged in once at a time

		try {
			this.attemptLogin();
		} catch(errorMessage) {
			this.form.showError(errorMessage);
		}
	}


	private attemptLogin(): void {
		this.form.checkIsComplete();

		this.busy = true;
		this.form.state = LoginForm.State.Working;

		const onSuccess = () => this.onLoginSuccess();

		const onError = (message: string) => this.onLoginError(message);

		this.userService.login(this.form.email, this.form.password)
				.subscribe(onSuccess, onError);
	}


	private onLoginSuccess(): void {
		this.closeFlyout();
		
		this.onceFlyoutIsClosed(() => {
			this.loggedIn = true;
			this.busy = false;
			this.form.state = LoginForm.State.Idle;
			this.form.clear();
		});
	}


	closeFlyout(): void {
		this.flyoutOpen = false;
	}


	private onceFlyoutIsClosed(func: () => void): void {
		this.flyoutClosed$.take(1).subscribe(func);
	}


	private onLoginError(message: string): void {
		this.form.showError(new LoginError(message));
		this.busy = false;
	}

	
	logout(): void {
		this.busy = true;

		this.userService.logout().finally(() => this.onLogoutComplete())
			.subscribe(null);
	}


	private onLogoutComplete(): void {
		this.closeFlyout();

		this.onceFlyoutIsClosed(() => {
			this.busy = false;
			this.loggedIn = false;
		});
	}

}
