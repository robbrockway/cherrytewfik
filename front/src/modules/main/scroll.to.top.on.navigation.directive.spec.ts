import { Component, ViewChild, ElementRef } from '@angular/core';

import {
	TestBed,
	TestModuleMetadata,
	async,
} from '@angular/core/testing';

import { Router, Event, NavigationEnd } from '@angular/router';
import { Location, PopStateEvent } from '@angular/common';

import { Subject } from 'rxjs/Subject';

import { ScrollToTopOnNavigationDirective }
	from './scroll.to.top.on.navigation.directive';

import { WindowService } from './window.service';
import { ComponentTest, mergeModuleMetadata } from 'testing';



@Component({
	template: `
		<div #directiveElement scrollToTopOnNavigation></div>
	`,
})
class HostComponent {
	@ViewChild('directiveElement') directiveElement: ElementRef;
}



class ScrollToTopOnNavigaitonDirectiveTest extends ComponentTest {

	constructor() {
		super(HostComponent, 'ScrollToTopOnNavigationDirective');
	}


	protected getModuleMetadata(): TestModuleMetadata {
		const defaultMetadata = super.getModuleMetadata();

		const extraMetadata = {
			declarations: [
				ScrollToTopOnNavigationDirective,
			],

			providers: [
				{
					provide: Router,
					useFactory: this.createMockRouter,
				},

				{
					provide: Location,
					useFactory: this.createMockLocation,
				},

				{
					provide: WindowService,
					useFactory: this.createMockWindowService,
				},
			],
		};

		return mergeModuleMetadata(defaultMetadata, extraMetadata);
	}


	private createMockRouter(): any {
		return {
			events: new Subject<Event>(),
		};
	}


	private createMockLocation(): any {
		return new Subject<PopStateEvent>();
	}


	private createMockWindowService(): any {
		return {
			scrollTo: jasmine.createSpy('scrollTo'),
		};
	}


	protected defineTests(): void {
		super.defineTests();

		const defaultUrl = '/url';
		let mockWindowService: any;

		let navigate: (url?: string) => void;
		let checkWindowHasScrolled: () => void;
		let pressBackOrForward: (toUrl?: string) => void;
		let checkWindowHasntScrolled: () => void;


		beforeEach(() => {
			mockWindowService = TestBed.get(WindowService);
		});


		it('should scroll to element, on navigation', async(() => {
			navigate();
			checkWindowHasScrolled();
		}));


		navigate = (url = defaultUrl) => {
			const mockRouter = TestBed.get(Router);

			mockRouter.events.next(
				new NavigationEnd(1, url, url)
			);
		};


		checkWindowHasScrolled = () => {
			expect(mockWindowService.scrollTo)
				.toHaveBeenCalledWith(this.component.directiveElement);
		};


		it(`shouldn't scroll to element on navigation, if back/forward `
				+ 'is pressed', async(() => {
			pressBackOrForward();
			navigate();
			checkWindowHasntScrolled();
		}));


		pressBackOrForward = (toUrl = defaultUrl) => {
			const mockLocation = TestBed.get(Location);
			mockLocation.next({url: toUrl});
		};


		checkWindowHasntScrolled = () => {
			expect(mockWindowService.scrollTo).not.toHaveBeenCalled();
		};


		it(`shouldn't scroll to element on navigation to home view, if `
				+ 'back/forward is pressed', async(() => {
			pressBackOrForward('');		// Slight mismatch between '' and '/' urls must be handled
			navigate('/');
			checkWindowHasntScrolled();
		}));

	}

}


new ScrollToTopOnNavigaitonDirectiveTest();