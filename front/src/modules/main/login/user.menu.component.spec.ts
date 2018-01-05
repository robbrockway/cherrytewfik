import { Component } from '@angular/core';

import {
	TestBed,
	async,
	TestModuleMetadata,
} from '@angular/core/testing';

import { UserService } from 'modules/main/models';
import { UserMenuComponent } from './user.menu.component';
import { HostedComponentTest, mergeModuleMetadata } from 'testing';



@Component({
	template: `
		<user-menu (logout)="onLogout()" (close)="onClose()"></user-menu>
	`,
})
class HostComponent {
	onLogout = jasmine.createSpy('onLogout');
	onClose = jasmine.createSpy('onClose');
}



// Position, as displayed, of each menu item
enum LinkIndex {
	SignOut = 0,
};



class UserMenuComponentTest extends HostedComponentTest {

	constructor() {
		super(
			UserMenuComponent,
			HostComponent
		);
	}


	protected getModuleMetadata(): TestModuleMetadata {
		const defaultMetadata = super.getModuleMetadata();

		const extraMetadata = {
			providers: [{
				provide: UserService,
				useFactory: this.createUserService,
			}],
		};

		return mergeModuleMetadata(defaultMetadata, extraMetadata);
	}


	protected createUserService(): any {
		return {
			isStaff: false,
		};
	}


	protected defineTests(): void {
		super.defineTests();

		const adminGuideLinkSelector =
			'a[routerLink="/staff/guide"]';

		let clickOnLink: (index: LinkIndex) => void;
		let beStaff: () => void;


		beforeEach(() => {
			this.fixture.detectChanges();
		});


		it(`should emit 'logout' event when 'Sign out' is clicked`,
				async(() => {
			clickOnLink(LinkIndex.SignOut);
			expect(this.hostComponent.onLogout).toHaveBeenCalled();
		}));


		clickOnLink = (index: LinkIndex) => {
			const allLinks = this.getAllChildNativeElementsByCss('a');
			const thisLink = allLinks[index];
			thisLink.dispatchEvent(new Event('click'));
		};


		it(`shouldn't contain 'Admin guide' link if user isn't staff`,
				() => {
			this.expectChildNativeElement(adminGuideLinkSelector)
				.toBeFalsy();
		});


		it(`should contain 'Admin guide' link if user is staff`, () => {
			beStaff();

			this.expectChildNativeElement(adminGuideLinkSelector)
				.toBeTruthy();
		});


		beStaff = () => {
			const mockUserService = TestBed.get(UserService);
			mockUserService.isStaff = true;
			this.fixture.detectChanges();
		};


		it(`should emit close event when 'Admin guide' link is clicked`,
				async(() => {
			beStaff();

			const link = 
				this.getChildNativeElementByCss(adminGuideLinkSelector);

			link.dispatchEvent(new Event('click'));
			expect(this.hostComponent.onClose).toHaveBeenCalled();
		}));

	}

}


new UserMenuComponentTest();