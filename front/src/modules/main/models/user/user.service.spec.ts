import { Injector } from '@angular/core';
import { async, TestModuleMetadata } from '@angular/core/testing';

import {
	XHRBackend,
	RequestMethod,
	Response,
	Http,
} from '@angular/http';

import { MockBackend, MockConnection } from '@angular/http/testing';

import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/throw';

import { User } from './user';
import { UserService } from './user.service';
import { ModelServiceTest } from '../model.service.test.base';

import {
	ModelTestData,
	testUserData,
	removeFromArrayWhere,
	createResponse,
	createErrorResponse,
} from 'testing';



class UserServiceTest extends ModelServiceTest<User> {

	private initialUserData = testUserData.instances[0];
	private loggedInUserData = testUserData.instances[1];


	constructor() {
		super(UserService, User);
	}


	protected getModuleMetadata(): TestModuleMetadata {
		const metadata = super.getModuleMetadata();
		
		const updatedMetadata =
			this.replaceXhrBackendProviderWithCustomOne(metadata);

		return updatedMetadata;
	}


	// Operates on metadata in-place, but also returns it. 
	private replaceXhrBackendProviderWithCustomOne(
		metadata: TestModuleMetadata
	): TestModuleMetadata {

		removeFromArrayWhere(
			metadata.providers,
			(provider: any) => provider.provide === XHRBackend
		);

		// New provider
		metadata.providers.push({
			provide: XHRBackend,
			useFactory: () => this.createMockHttpBackend(),
		});

		return metadata;
	}


	// This instance of MockBackend should, uniquely, return user data when queried with /user/self endpoint
	private createMockHttpBackend(): MockBackend {
		const backend = new MockBackend();
		
		backend.connections.subscribe((connection: MockConnection) => {
			if(connection.request.url.endsWith('user/self')) {
				const response = this.createLoggedInUserResponse();
				connection.mockRespond(response);
			}
		});

		return backend;
	}


	// Mock response to service's initial request for logged-in user data
	private createLoggedInUserResponse(): Response {
		return createResponse({
			body: this.loggedInUserData.toJson(),
			status: 200,
		});
	}


	protected defineTests(): void {
		super.defineTests();

		let userService: UserService;

		// Test template
		const testResponseThrowsErrorIfUnsuccessful = (
			sendRequest: () => Observable<any>,
			prepareUnsuccessfulResponse: () => void,
			expectedErrorMessage: string
		) => async(() => {
			
			const onResponseSuccess = fail;	// fail the test, that is
			const onResponseError = (thrownError: any) => {
				expect(thrownError).toBe(expectedErrorMessage);
			};

			prepareUnsuccessfulResponse();

			sendRequest().subscribe(
				onResponseSuccess,
				onResponseError
			);
		});


		beforeEach(() => {
			userService = this.modelService as UserService;
		});


		describe(', on initialisation,', () => {

			let createUnyieldingMockHttpClient: () => any;


			it('should check whether user is logged in already', () => {
				const firstConnection =
					this.mockHttpBackend.connectionsArray[0];

				const request = firstConnection.request;

				expect(request.url).toContain('user/self');
			});


			it('should set .currentUser to the logged-in user, if there '
					+ 'is one', () => {
				// this.initialUserData should have been used for our mock response from API's /user/self endpoint
				this.loggedInUserData.checkObjectHasCorrectTSValues(
					userService.currentUser
				);
			});


			it('should emit logged-in user through initialUser$', done => {
				const response$ = new Subject<Response>();
				const mockHttp = {get: () => response$} as any;
				
				// This service instance, using our mock HTTP client, must be fed a mock Response containing logged-in user data through response$
				const newUserService = new UserService(mockHttp, null);

				newUserService.initialUser$.subscribe((user: User) => {
					this.loggedInUserData.checkModelInstanceMatches(user);
					done();
				});

				const responseBody = this.loggedInUserData.toJson();
				const response = createResponse({body: responseBody});
				response$.next(response);
			});


			it('should leave .currentUser undefined if not logged in',
					async(() => {

				const mockHttp = createUnyieldingMockHttpClient();

				// This service instance, using mock HTTP client, won't receive any logged-in user data
				const newUserService = new UserService(mockHttp, null);

				expect(newUserService.currentUser).toBe(undefined);
			}));


			// The returned object (mocking Angular's Http) throws an error on all GET requests
			createUnyieldingMockHttpClient = () => {
				const errorResponse = createErrorResponse('Forbidden', 403);
				return {get: () => Observable.throw(errorResponse)};
			};

		});


		describe('.login()', () => {

			const authEmail = 'auth@email.com';
			const authPassword = 'passymcwordface';
			const errorMessage = 'Invalid password';

			let prepareSuccessfulResponse: () => void;
			let prepareUnsuccessfulResponse: () => void;


			beforeEach(() => {
				userService.currentUser = null;	// Get rid of the initially logged-in user
			});


			it('should send correct HTTP request', done => {
				prepareSuccessfulResponse();

				const expectedData = 
					{email: authEmail, password: authPassword};

				this.watchForRequest(
					RequestMethod.Post,
					'/login',
					expectedData,
					done
				);

				userService.login(authEmail, authPassword);
			});


			it('should return an Observable of the correct '
					+ 'User if successful', async(() => {

				const onLoginSuccess = (user: User) => {
					this.initialUserData.checkModelInstanceMatches(user);
				};

				const onLoginError = fail;

				prepareSuccessfulResponse();
				
				userService.login(authEmail, authPassword)
						.subscribe(onLoginSuccess, onLoginError);				
			}));


			prepareSuccessfulResponse = () =>
				this.setMockResponseData(this.initialUserData);


			it('should record new user as .currentUser, if successful',
					async(() => {
				
				prepareSuccessfulResponse();

				userService.login(authEmail, authPassword)
						.subscribe((user: User) => {
					expect(userService.currentUser).toBe(user);
				});
			}));


			it('should emit new user through login$, if successful',
					done => {

				prepareSuccessfulResponse();

				userService.login$.subscribe((user: User) => {
					expect(userService.currentUser).toBe(user);
					done();
				});

				userService.login(authEmail, authPassword).subscribe(null);
			});


			prepareUnsuccessfulResponse = () =>
				this.setMockResponseError(errorMessage, 401);


			it('should throw error, with message, if unsuccessful',
				testResponseThrowsErrorIfUnsuccessful(
					() => userService.login(authEmail, authPassword),
					prepareUnsuccessfulResponse,
					errorMessage
				)
			);


			it(`should keep .currentUser blank, if unsuccessful`,
					async(() => {

				prepareUnsuccessfulResponse();

				userService.login(authEmail, authPassword)
						.subscribe(null, (error: any) => {
					expect(userService.currentUser).toBeFalsy();
				});
			}));

		});


		describe('.logout()', () => {

			const errorMessage = 'Logout failed';

			let prepareSuccessfulResponse: () => void;
			let prepareUnsuccessfulResponse: () => void;


			beforeEach(() => {
				userService.currentUser = new User(
					userService,
					{}
				);
			});


			it('should send correct HTTP request', done => {
				prepareSuccessfulResponse();

				this.watchForRequest(
					RequestMethod.Post,
					'/logout',
					null,
					done
				);

				userService.logout();
			});


			it('should clear .currentUser, if successful',
					async(() => {

				prepareSuccessfulResponse();

				userService.logout().subscribe(() => {
					expect(userService.currentUser).toBeFalsy();
				});
			}));


			prepareSuccessfulResponse = () =>								
				this.setMockResponse({body: '', status: 200});


			it('should cause logout$ to emit, if successful', 
					done => {
				
				prepareSuccessfulResponse();
				
				userService.logout$.subscribe(done);
				userService.logout().subscribe(null);
			});


			prepareUnsuccessfulResponse = () =>
				this.setMockResponseError(errorMessage, 400);


			it('should throw error, with message, if unsuccessful',
				testResponseThrowsErrorIfUnsuccessful(
					() => userService.logout(),
					prepareUnsuccessfulResponse,
					errorMessage
				)
			);

		});


		describe('.loggedIn', () => {

			it('should be true if .currentUser is truthy', () => {
				userService.currentUser = new User(userService, {});
				expect(userService.loggedIn).toBe(true);
			});


			it('should be false if .currentUser is falsy', () => {
				userService.currentUser = null;
				expect(userService.loggedIn).toBe(false);
			});

		});


		describe('.isStaff', () => {

			const testWithValue = (isStaff: boolean) => () => {
				userService.currentUser = new User(
					userService,
					{isStaff: isStaff}
				);

				expect(userService.isStaff).toBe(isStaff);
			};


			it('should be true if .currentUser is staff', 
				testWithValue(true)
			);


			it('should be false if .currentUser is not staff', 
				testWithValue(false)
			);


			it('should be false if not logged in', () => {
				userService.currentUser = null;
				expect(userService.isStaff).toBe(false);
			});

		});

	}


	protected initTestData(): ModelTestData<User> {
		return testUserData;
	}

}


new UserServiceTest();
