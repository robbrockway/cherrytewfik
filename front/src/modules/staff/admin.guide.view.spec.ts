import {
	TestBed,
	TestModuleMetadata,
	async,
} from '@angular/core/testing';

import { ViewTest } from 'modules/shared/view.test.base';
import { AdminGuideView } from './admin.guide.view';
import { UserService } from 'modules/main/models';
import { FlyoutService } from 'modules/main/flyout';
import { mergeModuleMetadata } from 'testing';



class AdminGuideViewTest extends ViewTest {

	constructor() {
		super(AdminGuideView);
	}


	protected getModuleMetadata(): TestModuleMetadata {
		const defaultMetadata = super.getModuleMetadata();

		const extraMetadata = {
			providers: [
				{
					provide: UserService,
					useFactory: this.createMockUserService,
				},

				{
					provide: FlyoutService,
					useFactory: this.createMockFlyoutService,
				},
			],
		};

		return mergeModuleMetadata(defaultMetadata, extraMetadata);
	}


	private createMockUserService(): any {
		return {isStaff: false};
	}


	private createMockFlyoutService(): any {
		const spyMethodNames = ['focus'];
		return jasmine.createSpyObj('FlyoutService', spyMethodNames);
	}


	protected defineTests(): void {
		super.defineTests();

		const expectedHeadings = {
			forbidden: 'Who goes there?',
			allowed: 'Running the site',
		};

		let checkHeadingIs: (expectedHeading: string) => void;


		describe(', if not staff,', () => {

			let link: HTMLElement;


			beforeEach(() => {
				this.fixture.detectChanges();
				link = this.getChildNativeElementByCss('a');
			});


			it(`should show 'forbidden' message`, () => {
				checkHeadingIs(expectedHeadings.forbidden);
			});


			it(`should ask FlyoutService to focus on login box, when 'log `
					+ `in as administrator' is clicked`, async(() => {
				link.dispatchEvent(new Event('click'));
				
				const mockFlyoutService = TestBed.get(FlyoutService);

				expect(mockFlyoutService.focus)
					.toHaveBeenCalledWith('login');
			}));


			it(`should stop 'login' link's click event from bubbling up to `
					+ 'window', async(() => {
				const event = new Event('click');
				spyOn(event, 'stopPropagation');
				
				link.dispatchEvent(event);

				expect(event.stopPropagation).toHaveBeenCalled();
			}));

		});


		checkHeadingIs = (expectedHeading: string) =>
			this.checkChildTextContentIs('h1', expectedHeading);


		it('should show full admin guide, if staff', () => {
			const mockUserService = TestBed.get(UserService);
			mockUserService.isStaff = true;
			this.fixture.detectChanges();
			checkHeadingIs(expectedHeadings.allowed);
		});

	}

}


new AdminGuideViewTest();