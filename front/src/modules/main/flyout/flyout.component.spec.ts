import { Component } from '@angular/core';

import {
	TestBed,
	TestModuleMetadata,
	async,
	fakeAsync,
	tick,
	flushMicrotasks,
} from '@angular/core/testing';

import { Subject } from 'rxjs/Subject';

import { FlyoutComponent } from './flyout.component';
import { FlyoutService } from './flyout.service';
import { WindowService } from '../window.service';

import {
	HostedComponentTest,
	mergeModuleMetadata,
	getMostRecentCallArg,
} from 'testing';



@Component({
	template: `
		<flyout 
			[key]="key"
			[title]="title"
			[icon]="icon"
			[(open)]="open"
			(finishedClosing)="onFinishedClosing()"
		>
			<span>{{flyoutContent}}</span>
		</flyout>
	`
})
class HostComponent {
	open: boolean = false;
	key: string = 'key';
	title: string = 'Title';
	icon: string = 'images/icon.svg';
	flyoutContent: string = 'Inner content';

	onFinishedClosing = jasmine.createSpy('onFinishedClosing');
}



class FlyoutComponentTest extends HostedComponentTest {

	constructor() {
		super(
			FlyoutComponent,
			HostComponent
		);
	}


	protected getModuleMetadata(): TestModuleMetadata {
		const defaultMetadata = super.getModuleMetadata();

		const extraMetadata = {
			providers: [
				{
					provide: FlyoutService,
					useFactory: this.createMockFlyoutService,
				},

				{
					provide: WindowService,
					useFactory: this.createMockWindowService,
				},
			],
		};

		return mergeModuleMetadata(defaultMetadata, extraMetadata);
	}


	private createMockFlyoutService(): any {
		return {
			focus$: new Subject<string>(),
		};
	}


	private createMockWindowService(): any {
		const spyMethodNames = ['scrollTo'];
		return jasmine.createSpyObj('WindowService', spyMethodNames);
	}


	protected defineTests(): void {
		super.defineTests();

		let expectOpennessAfterClickingOnHeading: () => any;
		let clickOnHeading: () => void;
		let getHeading: () => HTMLDivElement;
		let getBox: () => HTMLElement;
		let focusOn: (flyoutKey: string) => void;


		describe('should show', () => {

			beforeEach(() => {
				this.fixture.detectChanges();				
			});


			it('correct title', () => {
				this.checkChildTextContentIs(
					'.heading',
					this.hostComponent.title
				);
			});


			it('correct icon', () => {
				const img =	this.getChildNativeElementByCss(
					'.heading img'
				) as HTMLImageElement;

				expect(img.src).toContain(this.hostComponent.icon);
			});

		});


		describe(', when closed,', () => {

			beforeEach(() => {
				this.hostComponent.open = false;
				this.fixture.detectChanges();
			});


			it(`should include heading without 'selected' class`, () => {
				this.expectChildNativeElement(
					'.heading:not(.selected)'
				).toBeTruthy();
			});


			it(`shouldn't give flyout box .visible class`, () => {
				this.expectChildNativeElement(
					'.box.visible'
				).toBeFalsy();
			});


			it('should open, on click', fakeAsync(() => {
				expectOpennessAfterClickingOnHeading()
					.toBeTruthy();
			}));

		});


		expectOpennessAfterClickingOnHeading = () => {
			clickOnHeading();
			return expect(this.hostComponent.open);
		};


		clickOnHeading = () => {
			const heading = getHeading();
			heading.click();
			flushMicrotasks();
		};


		getHeading = () => 
			this.getChildNativeElementByCss('.heading') as
			HTMLDivElement;


		describe(', when open,', () => {

			const fadeTime = 300;

			let expectFinishedClosing: () => any;


			beforeEach(() => {
				this.hostComponent.open = true;
				this.fixture.detectChanges();
			});


			it('should include heading with .selected class', () => {
				this.expectChildNativeElement(
					'.heading.selected'
				).toBeTruthy();
			});


			it('should give flyout box .visible class', () => {
				this.expectChildNativeElement(
					'.box.visible'
				).toBeTruthy();
			});


			it('should include projected content in flyout box', () => {
				this.fixture.detectChanges();

				this.checkChildTextContentIs(
					'.box',
					this.hostComponent.flyoutContent
				);
			});


			describe('should close,', () => {
			
				it('after clicking on heading', fakeAsync(() => {
					clickOnHeading();
				}));


				it('on blur', async(() => {
					const box = getBox();
					box.dispatchEvent(new Event('blur'));
				}));


				it('after clicking on cross', async(() => {
					const cross = this.getChildNativeElementByCss(
						'.cross'
					);

					cross.click();
				}));


				it('after clicking outside of box', async(() => {
					document.body.click();
				}));


				it('after pressing escape', async(() => {
					const event = new KeyboardEvent('keyup', {key: 'escape'});
					dispatchEvent(event);
				}));


				afterEach(() => {
					expect(this.hostComponent.open).toBeFalsy();
				});
			
			});


			it(`shouldn't close after clicking on box`, fakeAsync(() => {
				const box = getBox();
				box.click();
				flushMicrotasks();
				expect(this.hostComponent.open).toBeTruthy();
			}));


			it('should dispatch finishedClosing event '
					+ 'shortly after closing', async(() => {
				const heading = getHeading();
				heading.click();
				
				this.fixture.detectChanges();
				expectFinishedClosing().not.toHaveBeenCalled();

				const box = getBox();
				box.dispatchEvent(new Event('transitionend'));

				expectFinishedClosing().toHaveBeenCalled();
			}));


			expectFinishedClosing = () =>
				expect(this.hostComponent.onFinishedClosing);
		
		});


		getBox = () => this.getChildNativeElementByCss('.box');


		describe(`, when FlyoutService emits this flyout's key,`, () => {

			let getLastElementScrolledTo: () => HTMLElement;


			beforeEach(async(() => {
				focusOn(this.hostComponent.key);
			}));


			it('should open', () => {
				expect(this.hostComponent.open).toBeTruthy();
			});


			it('should scroll to element', () => {
				const elementScrolledTo = getLastElementScrolledTo();
				const boxElement = getBox();
				expect(elementScrolledTo).toBe(boxElement);
			});


			getLastElementScrolledTo = () => {
				const mockWindowService = TestBed.get(WindowService);

				const elementRef =
					getMostRecentCallArg(mockWindowService.scrollTo);

				return elementRef.nativeElement;
			};

		});


		focusOn = (flyoutKey: string) => {
			this.fixture.detectChanges();	// Runs ngAfterViewInit(), which subscribes to .focus$
			const mockFlyoutService = TestBed.get(FlyoutService);
			mockFlyoutService.focus$.next(flyoutKey);
		};


		describe(`, when FlyoutService emits another flyout's key,`,
				() => {

			beforeEach(async(() => {
				this.setInputValues({open: true});
				focusOn('bogusFlyoutKey');
			}));


			it('should close', () => {
				expect(this.hostComponent.open).toBe(false);
			});


			it(`shouldn't scroll to element`, () => {
				const mockWindowService = TestBed.get(WindowService);
				expect(mockWindowService.scrollTo).not.toHaveBeenCalled();
			});

		});

	}

}


new FlyoutComponentTest();