import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { TestModuleMetadata, async } from '@angular/core/testing';
import { APP_BASE_HREF } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/timer';
import 'rxjs/add/observable/interval';
import 'rxjs/add/operator/take';
import 'rxjs/add/operator/skip';
import 'rxjs/add/operator/delay';

import { ImageTickerComponent } from './image.ticker.component';
import { TickerImage } from './ticker.image.component';
import { getFirstItemWhere, getLastItem } from 'utils';

import {
	SlowLoadingComponentTest,
	SlowLoadingHostComponent,
} from 'modules/shared/slow.loading.component.test.base';

import {
	MockTickerImageDirective,
	testTickerImages,
	stripLeadingSlash,
	mergeModuleMetadata,
	forEachPair,
	forNextTenCallsToSpy,
} from 'testing';



@Component({
	template: `
		<image-ticker
			[imageList]="imageList"
			[rootDirectory]="rootDirectory"
			[widthList]="widthList"
			[turnaroundTime]="turnaroundTime"
			[showLinks]="showLinks"
			(select)="onSelect($event)"
			(show)="onShow($event)"
			(load)="onLoad()"
		></image-ticker>
	`,
})
class HostComponent extends SlowLoadingHostComponent {

	imageList: TickerImage[] = testTickerImages;
	rootDirectory: string = 'directory';
	widthList: number[] = [180, 360, 720];
	turnaroundTime: number = 50;	// very quick, for testing's sake
	showLinks: boolean = true;

	onSelect = jasmine.createSpy('onSelect');
	onShow = jasmine.createSpy('onShow');

}



class ImageTickerComponentTest extends SlowLoadingComponentTest {

	constructor() {
		const routes = testTickerImages.filter(
			(image: TickerImage) => image.routerLink
		).map(
			(image: TickerImage) => this.createFakeRoute(image)
		);

		super(
			ImageTickerComponent,
			HostComponent
		);
	}


	protected getModuleMetadata(): TestModuleMetadata {
		const defaultMetadata = super.getModuleMetadata();

		const extraMetadata = {
			declarations: [
				MockTickerImageDirective,
			],

			schemas: [NO_ERRORS_SCHEMA],
		};
		
		return mergeModuleMetadata(defaultMetadata, extraMetadata);
	}


	// A route must be defined for each image's .routerLink property, but it needn't lead anywhere; pointing it to a fake external module keeps the router happy
	private createFakeRoute(image: TickerImage): any {
		const path = stripLeadingSlash(image.routerLink);

		return {
			path: path,
			loadChildren: '/fake-module-path/module#FakeModule',
		};
	}


	protected defineTests(): void {
		super.defineTests();

		const numTestCycles = 10;

		let checkSrcIsValid: (
			src: string,
			expectedWidthNotation?: string
		) => void;

		let checkSrcsetIsValid: (srcset: string) => void;

		let checkSrcsetItemIsValid: (
			srcsetItem: string,
			expectedWidth: number
		) => void;

		let checkFilenameComesFromList: (filename: string) => void;

		let afterInitialisation: (
			func: () => void
		) => void;

		let waitForNumCycles: (
			numCycles: number,
			func: () => void
		) => void;

		type TurnaroundCycleFunc = (
			imageFromEvent: TickerImage
		) => void;

		let repeatOnEachSelectEvent: (
			cycleFunc: TurnaroundCycleFunc,
			doneFunc: () => void
		) => void;

		let repeatOnEachEvent: (
			handlerSpy: any,
			cycleFunc: TurnaroundCycleFunc,
			doneFunc: () => void
		) => void;

		let repeatOnEachShowEvent: (
			cycleFunc: TurnaroundCycleFunc,
			doneFunc: () => void
		) => void;

		let checkEventFiresWhenImageIsRemovedFromList: (
			imageToRemove: TickerImage,
			eventHandler: any
		) => void;

		let getImageListWithout: (image: TickerImage) => TickerImage[];
		let useFirstNImagesOnly: (numImages: number) => void;

		let checkSubcomponentsMatchShowLinksProperty: (
			showLinks: boolean
		) => void;


		beforeEach(() => {
			this.fixture.detectChanges();
		});


		it('should have an image from list selected', () => {
			const image = this.foregroundImage;
			checkSrcIsValid(image.src);
			checkSrcsetIsValid(image.srcset);
		});


		checkSrcIsValid = (
			src: string,
			expectedWidthDirectory?: string
		) => {
			expectedWidthDirectory = expectedWidthDirectory
				|| getLastItem(this.hostComponent.widthList) + 'w';

			const expectedRootDirectory =
				this.hostComponent.rootDirectory.split('/');
			
			const segments = src.split('/');

			// Avoid all the http:// and stuff
			const actualRootStartIndex = -2 - expectedRootDirectory.length;
			const actualRootEndIndex = -2;

			const actualRootDirectory = segments.slice(
				actualRootStartIndex,
				actualRootEndIndex
			);

			const actualWidthDirectory = segments.slice(-2, -1)[0];

			const filename = segments.slice(-1)[0];

			expect(actualRootDirectory).toEqual(expectedRootDirectory);
			expect(actualWidthDirectory).toEqual(expectedWidthDirectory);
			checkFilenameComesFromList(filename);
		};


		checkSrcsetIsValid = (srcset: string) => {
			expect(srcset).toBeTruthy();

			const srcsetItems = srcset.split(',');

			forEachPair(
				srcsetItems,
				this.hostComponent.widthList,
				checkSrcsetItemIsValid
			);
		};


		checkSrcsetItemIsValid = (
			srcsetItem: string,
			expectedWidth: number
		) => {
			const segments = srcsetItem.trim().split(' ');
			const src = segments[0];
			const expectedWidthNotation = expectedWidth + 'w';
			const actualWidthNotation = segments[1];

			checkSrcIsValid(src, expectedWidthNotation);
			expect(actualWidthNotation).toBe(expectedWidthNotation);
		};


		checkFilenameComesFromList = (filename: string) => {
			const filenames = this.hostComponent.imageList.map(
				(image: TickerImage) => image.filename
			);

			expect(filenames.indexOf(filename)).not.toBe(-1);
		};


		it('should give correct CSS animation-duration to both images',
				() => {
			const expectedAnimationDuration =
				this.hostComponent.turnaroundTime * 1.1;

			for(let image of this.mockTickerImageComponents) {
				expect(image.animationDuration)
					.toBe(expectedAnimationDuration);
			}
		});


		describe(`'s initial foreground image`, () => {

			it('should not be moving', () => {
				expect(this.foregroundImage.moving).toBe(false);
			});


			it('should be hidden', () => {
				expect(this.foregroundImage.visible).toBe(false);
			});


			it(`should have been emitted through component's 'select' `
					+ 'output', async(() => {
				expect(this.hostComponent.onSelect)
					.toHaveBeenCalledWith(this.foregroundImage);
			}));


			it('should no longer be .hidden, but should be .moving, '
					+ 'after component has initialised', done => {
				afterInitialisation(() => {
					expect(this.foregroundImage.visible).toBe(true);
					expect(this.foregroundImage.moving).toBe(true);
					done();
				});
			});


			it('should have emitted through (show) event, once '
					+ 'component has initialised', done => {
				afterInitialisation(() => {
					expect(this.hostComponent.onShow)
						.toHaveBeenCalledWith(this.foregroundImage);

					done();
				});
			});

		});


		// After a short time, initial image should become visible
		afterInitialisation = (
			func: () => void
		) => {
			const delayTime = this.hostComponent.turnaroundTime / 10;
			Observable.timer(delayTime).subscribe(func);
		};

	
		it('should keep same image in foreground until first turnaround',
				done => {

			const intitialForegroundComponent =
				this.foregroundImageComponent;

			const initialSrc = this.foregroundImage.src;
			
			
			// Not full duration; we don't want to trigger any changes
			const delayTime = this.hostComponent.turnaroundTime * 0.75;
			
			Observable.timer(delayTime).subscribe(() => {
				this.fixture.detectChanges();

				const newForegroundComponent = this.foregroundImageComponent;
				expect(newForegroundComponent.image.src).toBe(initialSrc);

				done();
			}); 
			
		});


		it('should switch background and foreground when turnaround '
				+ 'time is up', done => {
			const initialForegroundComponent =
				this.foregroundImageComponent;

			const initialBackgroundComponent =
				this.backgroundImageComponent;

			const delayTime = this.hostComponent.turnaroundTime;

			Observable.timer(delayTime).subscribe(() => {
				this.fixture.detectChanges();
		
				const laterForegroundComponent =
					this.foregroundImageComponent;

				const laterBackgroundComponent =
					this.backgroundImageComponent;

				expect(initialForegroundComponent)
					.toBe(laterBackgroundComponent);

				expect(initialBackgroundComponent)
					.toBe(laterForegroundComponent);

				done();
			});
		});


		it('should put background and foreground back in '
				+ 'their original positions after two turnarounds',
				done => {

			const initialForegroundComponent = this.foregroundImageComponent;
			const initialBackgroundComponent = this.backgroundImageComponent;
			
			const delayTime = this.hostComponent.turnaroundTime * 2.2;

			Observable.timer(delayTime).subscribe(() => {
				this.fixture.detectChanges();

				const laterForegroundComponent =
					this.foregroundImageComponent;

				const laterBackgroundComponent =
					this.backgroundImageComponent;

				expect(initialForegroundComponent)
					.toBe(laterForegroundComponent);

				expect(initialBackgroundComponent)
					.toBe(laterBackgroundComponent);

				done();
			});
		});
		

		it('should emit a select and a show event on each cycle', done => {
			const numCycles = 10;

			waitForNumCycles(numCycles, () => {

				for(let handlerName of ['onSelect', 'onShow']) {
					const handler = this.hostComponent[handlerName];
					expect(handler.calls.count)
						.not.toBeLessThan(numCycles - 1);
				}

				done();
			});
		});


		waitForNumCycles = (
			numCycles: number,
			func: () => void
		) => {
			const delay = this.hostComponent.turnaroundTime * numCycles;
			Observable.timer(delay).subscribe(func);
		};


		it('should emit new background images through select event',
				done => {
			
			repeatOnEachSelectEvent(
					(imageFromSelectEvent: TickerImage) => {
				expect(imageFromSelectEvent).toBe(this.backgroundImage);
			}, done);

		});


		// Calls cycleFunc each time ticker's select event emits, with the emitted image as argument
		repeatOnEachSelectEvent = (
			cycleFunc: TurnaroundCycleFunc,
			doneFunc: () => void
		) => {
			repeatOnEachEvent(
				this.hostComponent.onSelect,
				cycleFunc,
				doneFunc
			);
		};


		repeatOnEachEvent = (
			handlerSpy: any,	// host component's .onSelect or .onShow
			cycleFunc: TurnaroundCycleFunc,
			doneFunc: () => void
		) => {

			const cycleFuncWrapper = (image: TickerImage) => {
				this.fixture.detectChanges();
				cycleFunc(image);
			};
			
			forNextTenCallsToSpy(
				handlerSpy,
				cycleFuncWrapper,
				doneFunc,
				2	// Skip first couple of calls, so that ticker can adjust to any changes e.g. to image list
			);
		};


		it('should emit new foreground images through show event', done => {

			repeatOnEachShowEvent((
				imageFromShowEvent: TickerImage
			) => {
				expect(imageFromShowEvent).toBe(this.foregroundImage);
			}, done);
		});
		

		repeatOnEachShowEvent = (
			cycleFunc: TurnaroundCycleFunc,
			doneFunc: () => void
		) => {
			repeatOnEachEvent(
				this.hostComponent.onShow,
				cycleFunc,
				doneFunc
			);
		};


		it('should show an image, if an empty image list is suddenly '
				+ 'populated', done => {
			this.setInputValues({imageList: []});
			
			this.hostComponent.onShow.calls.reset();
			const image = testTickerImages[0];
			this.setInputValues({imageList: [image]});
			
			afterInitialisation(() => {
				expect(this.hostComponent.onShow)
					.toHaveBeenCalledWith(image);

				done();
			});
		});


		it('should switch image, if the currently-visible image is '
				+ 'removed from list', async(() => {
			
			checkEventFiresWhenImageIsRemovedFromList(
				this.foregroundImage,
				this.hostComponent.onShow
			);
		}));


		checkEventFiresWhenImageIsRemovedFromList = (
			imageToRemove: TickerImage,
			eventHandler: any
		) => {
			const newImageList = getImageListWithout(imageToRemove);
			
			eventHandler.calls.reset();
			this.setInputValues({imageList: newImageList});
			expect(eventHandler).toHaveBeenCalled();
		};


		getImageListWithout = (image: TickerImage) =>
			testTickerImages.filter(
				(image: TickerImage) => 
					image.filename !== image.filename
			);


		it('should select a new upcoming image, if the currently-'
				+ 'upcoming one is removed from list', async(() => {
			
			checkEventFiresWhenImageIsRemovedFromList(
				this.backgroundImage,
				this.hostComponent.onSelect
			);
		}));


		it('should select and show no image at all, if list is '
				+ 'emptied', async(() => {
			this.setInputValues({imageList: []});

			expect(this.hostComponent.onSelect)
				.toHaveBeenCalledWith(null);

			expect(this.hostComponent.onShow)
				.toHaveBeenCalledWith(null);
		}));


		describe(`shouldn't use same image`, () => {

			it('twice without at least two cycles between', done => {

				let lastTwoForegroundSrcs: string[] = [];

				repeatOnEachShowEvent(() => {
					const newForegroundSrc = this.foregroundImage.src;

					expect(lastTwoForegroundSrcs)
						.not.toContain(newForegroundSrc);
					
					lastTwoForegroundSrcs.push(newForegroundSrc);
					if(lastTwoForegroundSrcs.length > 2)
						lastTwoForegroundSrcs = lastTwoForegroundSrcs.slice(-2);

				}, done);

			});


			it('twice in a row, with only two images available', done => {

				useFirstNImagesOnly(2);

				let oldForegroundSrc: string;

				repeatOnEachShowEvent(() => {
					const newForegroundSrc = this.foregroundImage.src;
					expect(newForegroundSrc).not.toBe(oldForegroundSrc);
					oldForegroundSrc = newForegroundSrc;
				}, done);
			});

		});


		useFirstNImagesOnly = (numImages: number) => {
			this.hostComponent.imageList = 
				this.hostComponent.imageList.slice(0, numImages);

			this.fixture.detectChanges();
		};


		it(', when only one TickerImage is supplied, should display it '
				+ 'in foreground and background simultaneously', done => {
			useFirstNImagesOnly(1);
			
			repeatOnEachShowEvent(() => {
				const foreground = this.foregroundImage;
				const background = this.backgroundImage;
				
				expect(foreground).toBeTruthy();
				expect(background).toBeTruthy();
				expect(foreground.src).toBe(background.src);
			}, done);
		});


		it('should keep new image hidden and unmoving', done => {
			const delayTime = this.hostComponent.turnaroundTime * 0.75;

			Observable.timer(delayTime).subscribe(() => {
				this.fixture.detectChanges();
				expect(this.backgroundImage.visible).toBe(false);
				expect(this.backgroundImage.moving).toBe(false);
				done();
			});
		});


		it('should show new image, and make it move, after it becomes '
				+ 'foreground', done => {

			const delayTime = this.hostComponent.turnaroundTime;

			Observable.timer(delayTime).subscribe(() => {
				this.fixture.detectChanges();
				expect(this.foregroundImage.visible).toBe(true);
				expect(this.foregroundImage.moving).toBe(true);
				done();
			});
		});


		it('should tell both TickerImageComponents to show links, if '
				+ 'showLinks is true', () => {
			checkSubcomponentsMatchShowLinksProperty(true);
		});


		checkSubcomponentsMatchShowLinksProperty = (
			showLinks: boolean
		) => {
			this.setInputValues({showLinks});
			
			for(let subcomponent of this.mockTickerImageComponents)
				expect(subcomponent.showLink).toBe(showLinks);
		};


		it('should tell both TickerImageComponents not to show links, if '
				+ 'showLinks is false', () => {
			checkSubcomponentsMatchShowLinksProperty(false);
		});


		it('should function without any images', done => {
			this.hostComponent.imageList = [];

			// Can it survive a few cycles?
			repeatOnEachShowEvent(
				() => this.fixture.detectChanges(),
				done
			);
		});

	}


	protected triggerLoadEvent(): void {
		// Should be considered ready once foreground and background images have loaded
	
		for(let image of this.mockTickerImageComponents)
			image.load.emit();
	}


	private get mockTickerImageComponents(
	): MockTickerImageDirective[] {
		return this.getAllChildDirectivesOfType(
			MockTickerImageDirective
		);
	}


	private get foregroundImage(): TickerImage {
		return this.foregroundImageComponent.image;
	}


	private get foregroundImageComponent(): MockTickerImageDirective {
		return getFirstItemWhere(
			this.mockTickerImageComponents,
			(component: MockTickerImageDirective) =>
				component.foreground
		);
	}


	private get backgroundImage(): TickerImage {
		return this.backgroundImageComponent.image;
	}


	private get backgroundImageComponent(): MockTickerImageDirective {
		return getFirstItemWhere(
			this.mockTickerImageComponents,
			(component: MockTickerImageDirective) =>
				!component.foreground
		);
	}

}


new ImageTickerComponentTest();