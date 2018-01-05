import { Injectable, Injector } from '@angular/core';
import { Http, Response } from '@angular/http';

import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/catch';

import { ModelService } from '../model.service';
import { User } from './user';
import { apiRoot } from 'settings';



export const invalidEmailErrorMessage = 
	'No user exists with that email address';

export const invalidPasswordErrorMessage = 
	'Invalid password';
	


@Injectable()
export class UserService extends ModelService<User> {

	currentUser: User;
	initialUser$ = new Subject<User>();	// Emits when already-logged-in user loads
	login$ = new Subject<User>();
	logout$ = new Subject<any>();


	constructor(http: Http, injector: Injector) {
		super(User, http, injector);
		this.recordLoggedInUser();
	}


	protected recordLoggedInUser(): void {
		// Query to /user/self endpoint in API

		const onSuccess = (loggedInUser: User) => {
			this.currentUser = loggedInUser;
			this.initialUser$.next(loggedInUser);
		};

		const onError = () => {
			this.currentUser = undefined;	// No logged-in user; stay logged out 
		};

		this.retrieve('self').subscribe(onSuccess, onError);
	}


	get restEndpointName(): string {
		return 'user';
	}


	get loggedIn(): boolean {
		return !!this.currentUser;
	}


	get isStaff(): boolean {
		return this.loggedIn && this.currentUser.isStaff;
	}


	login(email: string, password: string): Observable<User> {
		const url = `${apiRoot}/login`;
		const requestBody = JSON.stringify({
			email: email,
			password: password,
		});

		return this.http.post(
			url,
			requestBody
		).catch(
			this.rethrowResponseErrorAsString
		).map(
			this.createModelInstanceFromResponse
		).do(
			(user: User) => this.currentUser = user
		).do(
			this.login$ // Pipe output to our public stream
		);
	}


	logout(): Observable<any> {
		const url = `${apiRoot}/logout`;

		return this.http.post(url, '')
			.catch(this.rethrowResponseErrorAsString)
			.do(() => this.currentUser = null)
			.do(this.logout$);
	}

}
