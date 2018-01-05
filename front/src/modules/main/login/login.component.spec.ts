import { EventEmitter } from '@angular/core';

import { 
	TestModuleMetadata,
	async,
	fakeAsync,
	flushMicrotasks,
} from '@angular/core/testing';

import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/Observable/throw';
import 'rxjs/add/Observable/never';
import 'rxjs/add/Observable/empty';
import 'rxjs/add/Observable/of';

import { User, UserService } from '../models';
import { LoginComponent } from './login.component';
import { LoginForm, LoginError } from './login.form';

import {
	ComponentTest,
	MockFlyoutDirective,
	MockLoginFormDirective,
	MockUserMenuDirective,
	testCredentials,
	mergeModuleMetadata,
	testUserData,
} from 'testing';



class LoginComponentTest extends ComponentTest {

	private mockUserService: any;
	private testUser: User;


	constructor() {
		super(LoginComponent);
	}


	protected getModuleMetadata(): TestModuleMetadata {
		const defaultMetadata = super.getModuleMetadata();

		this.mockUserService = this.createMockUserService();

		const extraMetadata = {
			declarations: [
				MockFlyoutDirective,
				MockLoginFormDirective,
				MockUserMenuDirective,
			],

			providers: [
				{
					provide: UserService,
					useFactory: () => this.mockUserService	// Workaround, as .useValue clones the object (bug?)
				},
			],
		};

		return mergeModuleMetadata(defaultMetadata, extraMetadata);
	}


	private createMockUserService(): any {
		this.testUser = this.createTestUser();

		return {
			loggedIn: false,
			currentUser: this.testUser,
			login: jasmine.createSpy('login'),
			logout: jasmine.createSpy('logout'),
			initialUser$: new Subject<User>(),
		};
	}


	protected defineTests(): void {
		super.defineTests();

		let mockLoginFormComponent: MockLoginFormDirective;
		let mockUserMenuComponent: MockUserMenuDirective
		let form: LoginForm;

		let expectLastErrorMessage: () => any;
		let attemptLogin: (credentials: any) => void;
		let useCredentials: (credentials: any) => void;
		let setMockLoginError: (message: string) => void;
		let setMockLoginReturnValue: (value: Observable<User>) => void;
		let checkForLoginForm: () => void;
		let checkTitleIsUsersFullName: () => void;
		let initLoggedIn: () => void;
		let attemptLogout: () => void;
		let setMockLogoutReturnValue: (value: Observable<any>) => void;
		let checkForUserMenu: () => void;


		beforeEach(() => {
			this.fixture.detectChanges();

			mockLoginFormComponent =
				this.getChildDirective(MockLoginFormDirective);

			form = mockLoginFormComponent.form;
			spyOn(form, 'showError');
		});


		it(`should give 'login' key to FlyoutComponent`, () => {
			const mockFlyoutComponent =
				this.getChildDirective(MockFlyoutDirective);

			expect(mockFlyoutComponent.key).toBe('login');
		});


		describe(', when logged out,', () => {

			let checkErrorValueIsUpdatedOnPromptFromForm:
				(errorType: string) => void;

			let getErrorChangeEventFromForm: (
				errorType: string
			) => EventEmitter<string>;

			let getActualErrorMessageFromForm: (
				errorType: string
			) => string;


			it(`should have 'Sign in' as title`, () => {
				expect(this.mockFlyoutComponent.title).toBe('Sign in');
			});


			it('should focus on form, when flyout opens',
					fakeAsync(() => {
				spyOn(form, 'focus');

				this.mockFlyoutComponent.openChange.emit(true);
				flushMicrotasks();
				
				expect(form.focus).toHaveBeenCalled();
			}));


			it('should pass no error messages to LoginFormComponent at '
					+ 'first', () => {
				expect(form.showError).not.toHaveBeenCalled();
			});


			it(`should keep LoginFormComponent in 'idle' state`, () => {
				expect(form.state).toBe(LoginForm.State.Idle);
			});


			describe('should pass error back to LoginFormComponent', () => {

				it('if asked to sign in without email address',
						fakeAsync(() => {

					attemptLogin({password: 'password'});

					expectLastErrorMessage()
						.toBe(LoginError.messages.email.none);
				}));


				it('if asked to sign in without password',
						fakeAsync(() => {

					attemptLogin({email: 'email@address.com'});

					expectLastErrorMessage()
						.toBe(LoginError.messages.password.none);
				}));
			
			});


			it('should not include UserMenuComponent', () => {
				expect(mockUserMenuComponent).toBeFalsy();
			});


			it('should pass credentials to UserService when submitted',
					fakeAsync(() => {

				attemptLogin(testCredentials);

				expect(this.mockUserService.login).toHaveBeenCalledWith(
					testCredentials.email,
					testCredentials.password
				);
			}));


			it('should switch to logged-in state when '
					+ 'UserService.initialUser$ emits', async(() => {
				this.mockUserService.initialUser$.next(this.testUser);
				this.fixture.detectChanges();

				expect(this.mockFlyoutComponent.title)
					.toBe(this.testUser.fullName);
			}));

		});


		// i.e. last error message passed to form.showError()
		expectLastErrorMessage = () => {
			expect(form.showError).toHaveBeenCalled();
			const spy = form.showError as any;
			const lastCall = spy.calls.mostRecent();
			const lastError = lastCall.args[0];
			return expect(lastError.message);
		};


		// Takes an object with 'email' and 'password' properties, either of which may be absent
		attemptLogin = (credentials: any) => {
			useCredentials(credentials);
			mockLoginFormComponent.submit.emit();
			flushMicrotasks();

			this.mockFlyoutComponent.finishedClosing.emit();
			flushMicrotasks();

			this.fixture.detectChanges();
		};


		// Fills email and password values in our form
		useCredentials = (credentials: any) => {
			form.emailField.value = credentials.email;
			form.passwordField.value = credentials.password;
		};


		setMockLoginError = (message: string) =>
			setMockLoginReturnValue(Observable.throw(message));


		setMockLoginReturnValue = (value: Observable<User>) => 
			this.mockUserService.login.and.returnValue(value);


		describe(', while logging in,', () => {

			let flyout: MockFlyoutDirective;

			let attemptIncompleteLogin: () => void;
			let attemptUnsuccessfulLogin: (errorMessage: string) => void;
			let attemptSuccessfulLogin: () => void;
			let prepareSuccessfulLogin: () => void;


			beforeEach(() => {
				flyout = this.mockFlyoutComponent;
				flyout.open = true;
				this.fixture.detectChanges();
			});


			it(`should have 'Signing in...' as title`, fakeAsync(() => {
				attemptIncompleteLogin();

				expect(this.mockFlyoutComponent.title)
					.toBe('Signing in...');
			}));


			// Triggers login events, but won't finish; useful for testing component while login is in progress
			attemptIncompleteLogin = () => {
				setMockLoginReturnValue(Observable.never());
				attemptLogin(testCredentials);
			};


			it(`should put LoginFormComponent in 'working' state`,
					fakeAsync(() => {
				attemptIncompleteLogin();
				
				expect(form.state).toBe(LoginForm.State.Working);
			}));


			it('should ignore further submit events from LoginFormComponent',
					fakeAsync(() => {
				attemptIncompleteLogin();
				this.mockUserService.login.calls.reset();
				attemptIncompleteLogin();	// again!
				expect(this.mockUserService.login).not.toHaveBeenCalled();
			}));


			it('should pass error to LoginFormComponent, if thrown',
					fakeAsync(() => {
				const errorMessage = 'Error message';
				attemptUnsuccessfulLogin(errorMessage);
				expectLastErrorMessage().toBe(errorMessage);
			}));


			attemptUnsuccessfulLogin = (errorMessage: string) => {
				setMockLoginError(errorMessage);
				attemptLogin(testCredentials);
			};


			it(`should switch back to original title, once error is
					thrown`, fakeAsync(() => {
				
				attemptUnsuccessfulLogin('');
				expect(this.mockFlyoutComponent.title)
					.toBe('Sign in');
			}));


			it('should keep flyout open while login is in progress',
					fakeAsync(() => {
				setMockLoginReturnValue(Observable.never());
				attemptLogin(testCredentials);
				expect(flyout.open).toBe(true);
			}));


			it('should close flyout once login is complete',
					fakeAsync(() => {
				attemptSuccessfulLogin();
				expect(flyout.open).toBe(false);
			}));


			attemptSuccessfulLogin = () => {
				prepareSuccessfulLogin();
				attemptLogin(testCredentials);
			};


			prepareSuccessfulLogin = () => {
				setMockLoginReturnValue(Observable.of(this.testUser));
			};


			it('should not switch from LoginFormComponent to '
					+ 'UserMenuComponent until flyout is closed',
					fakeAsync(() => {
				prepareSuccessfulLogin();

				mockLoginFormComponent.submit.emit();
				flushMicrotasks();

				// But don't fire mockFlyoutComponent.finishedClosing
				
				checkForLoginForm();
			}));


			it('should clear form once login is complete', fakeAsync(() => {
				spyOn(form, 'clear');
				attemptSuccessfulLogin();
				expect(form.clear).toHaveBeenCalled();
			}));

		});


		checkForLoginForm = () => {
			this.expectChildDirective(MockLoginFormDirective)
				.toBeTruthy();

			this.expectChildDirective(MockUserMenuDirective)
				.toBeFalsy();
		};


		describe(', when logged in,', () => {

			beforeEach(fakeAsync(() => {
				initLoggedIn();
			}));


			it(`should use user's full name as title`, () => {
				expect(this.mockFlyoutComponent.title)
					.toBe(this.testUser.fullName);
			});


			it('should include UserMenuComponent', () => {
				this.expectChildDirective(MockUserMenuDirective)
					.toBeTruthy();
			});


			it('should not include LoginFormComponent', () => {
				this.expectChildDirective(MockLoginFormDirective)
					.toBeFalsy();
			});


			it(`should call UserService once 'Sign out' is clicked`,
					fakeAsync(() => {
				attemptLogout();
				expect(this.mockUserService.logout).toHaveBeenCalled();
			}));


			it('should close flyout when UserMenuComponent emits close '
					+ 'event', async(() => {
				const mockUserMenuComponent =
					this.getChildDirective(MockUserMenuDirective);

				const mockFlyoutComponent =
					this.getChildDirective(MockFlyoutDirective);

				mockUserMenuComponent.close.emit();
				expect(mockFlyoutComponent.open).toBeFalsy();
			}));

		});


		// Forces the component into a logged-in state
		initLoggedIn = () => {
			setMockLoginReturnValue(Observable.of(this.testUser));
			this.mockUserService.loggedIn = true;
			attemptLogin(testCredentials);

			mockUserMenuComponent =
				this.getChildDirective(MockUserMenuDirective);
		};


		attemptLogout = () => {
			mockUserMenuComponent.logout.emit();
			flushMicrotasks();

			this.mockFlyoutComponent.finishedClosing.emit();
			flushMicrotasks();

			this.fixture.detectChanges();
		};


		describe(', while logging out,', () => {

			let flyout: MockFlyoutDirective;

			let attemptIncompleteLogout: () => void;
			let attemptSuccessfulLogout: () => void;
			let prepareSuccessfulLogout: () => void;


			beforeEach(fakeAsync(() => {
				initLoggedIn();
				flyout = this.mockFlyoutComponent;
			}));


			it(`should have 'Signing out...' as title`, fakeAsync(() => {
				attemptIncompleteLogout();
				expect(flyout.title).toBe('Signing out...');
			}));


			attemptIncompleteLogout = () => {
				setMockLogoutReturnValue(Observable.never());
				attemptLogout();
			};


			it('should close flyout once logout is complete', fakeAsync(() => {
				attemptSuccessfulLogout();
				expect(flyout.open).toBe(false);
			}));


			attemptSuccessfulLogout = () => {
				prepareSuccessfulLogout();
				attemptLogout();
			};


			prepareSuccessfulLogout = () =>
				setMockLogoutReturnValue(Observable.empty());


			it(`shouldn't switch UserMenuComponent back to `
					+ 'LoginFormComponent until flyout has closed',
					fakeAsync(() => {
				prepareSuccessfulLogout();
				
				mockUserMenuComponent.logout.emit();
				flushMicrotasks();
						
				checkForUserMenu();
			}));


			it('should switch UserMenuComponent back to LoginFormComponent'
					+ ' once flyout has closed', fakeAsync(() => {
				attemptSuccessfulLogout();
				checkForLoginForm();
			}));

		});


		setMockLogoutReturnValue = (value: Observable<any>) =>
			this.mockUserService.logout.and.returnValue(value);


		checkForUserMenu = () => {
			this.expectChildDirective(MockUserMenuDirective)
				.toBeTruthy();

			this.expectChildDirective(MockLoginFormDirective)
				.toBeFalsy();
		};

	}


	protected get mockFlyoutComponent(): MockFlyoutDirective {
		return this.getChildDirective(MockFlyoutDirective);
	}


	protected createTestUser(): User {
		const instanceData = testUserData.instances[0];
		return instanceData.toModelInstance();
	}

}


new LoginComponentTest();