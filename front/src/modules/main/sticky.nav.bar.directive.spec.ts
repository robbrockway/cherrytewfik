import { Component } from '@angular/core';
import { TestModuleMetadata, async } from '@angular/core/testing';

import { Subject } from 'rxjs/Subject';

import { StickyNavBarDirective } from './sticky.nav.bar.directive';
import { WindowService, WindowState } from './window.service';
import { ComponentTest, mergeModuleMetadata } from 'testing';



@Component({
	template: `
		<nav [(class)]="class" (classChange)="onClassChange()"></nav>
	`,

	styles: [`
		nav {
			height: 200px;
		}

		::ng-deep body {
			min-height: 400px;
		}
	`],	// gives us some scrolling room, below the bottom of the nav bar
})
class HostComponent {
	class: string;
	onClassChange = jasmine.createSpy('onClassChange');
}



class StickyNavBarDirectiveTest extends ComponentTest {

	private mockWindowService: any;

		
	constructor() {
		super(HostComponent, 'StickyNavBarDirective');
	}


	protected getModuleMetadata(): TestModuleMetadata {
		const defaultMetadata = super.getModuleMetadata();

		this.mockWindowService = this.createMockWindowService();

		const extraMetadata = {
			declarations: [
				StickyNavBarDirective,
			],

			providers: [{
				provide: WindowService,
				useValue: this.mockWindowService,
			}],
		};

		return mergeModuleMetadata(defaultMetadata, extraMetadata);
	}


	private createMockWindowService = () => {
		return {
			stream: new Subject<WindowState>(),
		};
	};


	protected defineTests(): void {
		super.defineTests();

		let nav: HTMLElement;

		let setWindowHeight: (height: number) => void;


		beforeEach(() => {
			this.fixture.detectChanges();
			nav = this.getChildNativeElementByCss('nav');
		});


		it(`should have 'fixed' class if no taller than window`,
				async(() => {
			const tallerThanNav = nav.offsetHeight + 100;
			setWindowHeight(tallerThanNav);
			expect(this.component.class).toBe('fixed');
		}));


		setWindowHeight = (height: number) => {
			this.mockWindowService.stream.next({
				height,
				scrollPos: 0,
			});

			this.fixture.detectChanges();
		};


		describe(', if taller than window,', () => {

			const scrollPosWhenBottomOfWindowIsAtBottomOfNav = 100;

			let shorterThanNav: number;
			let setScroll: (y: number) => void;


			beforeEach(async(() => {
				shorterThanNav =
					nav.offsetHeight -
					scrollPosWhenBottomOfWindowIsAtBottomOfNav;
			}));


			it(`should have 'moving' class`, () => {
				setWindowHeight(shorterThanNav);
				expect(this.component.class).toBe('moving');
			});


			it(`should switch to 'sticky' class if window is scrolled `
					+ 'below its bottom', async(() => {
				const belowBottomOfNav =
					scrollPosWhenBottomOfWindowIsAtBottomOfNav + 100;
				
				setScroll(belowBottomOfNav);
				expect(this.component.class).toBe('sticky');
			}));

			
			setScroll = (y: number) => {
				this.mockWindowService.stream.next({
					height: shorterThanNav,
					scrollPos: y,
				});
				
				this.fixture.detectChanges();
			};


			it(`should switch back to 'moving' class if window is `
					+ 'scrolled above its bottom', async(() => {

				const aboveBottomOfNav =
					scrollPosWhenBottomOfWindowIsAtBottomOfNav - 100;

				setScroll(aboveBottomOfNav);
				expect(this.component.class).toBe('moving');
			}));

		});

	}


	private get directive(): StickyNavBarDirective {
		return this.getChildDirective(StickyNavBarDirective);
	}

}


new StickyNavBarDirectiveTest();