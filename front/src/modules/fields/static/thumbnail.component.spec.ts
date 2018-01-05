import { Component } from '@angular/core';

import {
	async,
	fakeAsync,
	flushMicrotasks,
} from '@angular/core/testing';

import { ThumbnailComponent } from './thumbnail.component';
import { getChildNativeElementByCss, HostedComponentTest } from 'testing';

import {
	SlowLoadingHostComponent,
	SlowLoadingComponentTest,
} from 'modules/shared/slow.loading.component.test.base';

import {
	generateImgSrc,
	generateImgSrcset,
	fullImageSize,
	randInt,
} from 'utils';



@Component({
	template: `
		<thumbnail
			[rootDirectory]="rootDirectory"
			[widthList]="widthList"
			[filename]="filename"
			[alt]="alt"
			(load)="onLoad()"
			(mouseover)="onMouseOver($event)"
			(mouseout)="onMouseOut($event)"
		>
			<div class="injectedContent">{{injectedContent}}</div>
		</thumbnail>
	`,
})
class HostComponent extends SlowLoadingHostComponent {

	rootDirectory: string = 'directory';
	
	widthList: number[] = [
		180, 360, 720,
	];

	filename: string = 'image.jpg';
	alt: string = 'Alternative text';
	injectedContent: string = 'Inner content';

}



class ThumbnailComponentTest extends SlowLoadingComponentTest {

	constructor() {
		super(
			ThumbnailComponent,
			HostComponent
		);
	}


	protected defineTests(): void {
		super.defineTests();

		beforeEach(() => {
			this.fixture.detectChanges();
		});


		it('should emit load event when placeholder loads, if no image '
				+ 'is given', fakeAsync(() => {
			
			this.removeImage();
			const placeholder = this.getChildNativeElementByCss('img');
			expect(this.hostComponent.onLoad).not.toHaveBeenCalled();	// yet!

			placeholder.dispatchEvent(new Event('load'));
			flushMicrotasks();
			expect(this.hostComponent.onLoad).toHaveBeenCalled();
		}));
	}


	private removeImage(): void {
		this.hostComponent.filename = '';
		this.fixture.detectChanges();
	}

	
	protected definePreloadTests(): void {
		let getExpectedSrc: (width: number) => string;
		let getExpectedSrcset: () => string;

		let getContainer: () => HTMLDivElement;


		describe(`'s unzoomed image`, () => {

			let unzoomedImage: HTMLImageElement;

			
			beforeEach(() => {
				unzoomedImage = this.getChildNativeElementByCss(
					'img.unzoomed'
				) as HTMLImageElement;
			});


			it('should have correct src (smallest-sized image)', () => {
				const expectedSrc = 
					getExpectedSrc(this.hostComponent.widthList[0]);

				expect(unzoomedImage.src).toContain(expectedSrc);
			});


			it('should have correct srcset', () => {
				expect(unzoomedImage.srcset).toBe(getExpectedSrcset());
			});


			it('should use the provided alt text', () => {
				expect(unzoomedImage.alt).toBe(this.hostComponent.alt);
			});

		});


		getExpectedSrc = (width: number) =>
			generateImgSrc(
				this.hostComponent.rootDirectory,
				width,
				this.hostComponent.filename
			);


		getExpectedSrcset = () =>
			generateImgSrcset(
				this.hostComponent.rootDirectory,
				this.hostComponent.widthList,
				this.hostComponent.filename
			);


		describe(`'s zoomed image`, () => {

			let generateRandomXOffset: (
				container: HTMLDivElement
			) => number;

			let generateRandomYOffset: (
				container: HTMLDivElement
			) => number;

			let zoomedImage: HTMLImageElement;


			beforeEach(() => {
				zoomedImage = this.getChildNativeElementByCss(
					'img.zoomed'
				) as HTMLImageElement;
			});


			it('should have correct src (second-smallest image, '
					+ 'if there is no full-size one)', () => {
				
				const expectedSrc = 
					getExpectedSrc(this.hostComponent.widthList[1]);
				
				expect(zoomedImage.src).toContain(expectedSrc);
			});


			it('should have correct src (full-size image, '
					+ 'if provided)', () => {
				
				this.hostComponent.widthList = [180, 360, 720, fullImageSize];
				this.fixture.detectChanges();
				const expectedSrc =	getExpectedSrc(fullImageSize);
				expect(zoomedImage.src).toContain(expectedSrc);
			});


			it('should have correct srcset', () => {
				expect(zoomedImage.srcset).toBe(getExpectedSrcset());
			});


			it('should appear when mouse enters', () => {
				const container = getContainer();
				container.dispatchEvent(new Event('mouseover'));
				this.fixture.detectChanges();

				expect(zoomedImage.className).toContain('visible');
			});


			it('should disappear when mouse exits', () => {
				const container = getContainer();
				container.dispatchEvent(new Event('mouseover'));
				container.dispatchEvent(new Event('mouseout'));
				this.fixture.detectChanges();

				expect(zoomedImage.className)
					.not.toContain('visible');
			});


			it('should move to appropriate position as mouse moves', () => {
				const container = getContainer();
				const containerRect = container.getBoundingClientRect();

				const xOffset = generateRandomXOffset(container);
				const yOffset = generateRandomYOffset(container);

				const mouseMove = new MouseEvent(
					'mousemove',
					{
						clientX: containerRect.left + xOffset,
						clientY: containerRect.top + yOffset,
					}
				);

				container.dispatchEvent(mouseMove);
				this.fixture.detectChanges();

				const expectedTransform = 
					`translate3d(${-xOffset}px, ${-yOffset}px, 0px)`;

				expect(zoomedImage.style.transform)
					.toBe(expectedTransform);
			});


			generateRandomXOffset = (container: HTMLDivElement) =>
				randInt(0, container.offsetWidth);


			generateRandomYOffset = (container: HTMLDivElement) =>
				randInt(0, container.offsetHeight);

		});


		getContainer = () => this.getChildNativeElementByCss(
			'.thumbnail'
		) as HTMLDivElement;


		it('should show one placeholder image, and not zoomed/unzoomed '
				+ 'ones, if no filename is provided', () => {
			this.removeImage();

			this.expectChildNativeElement('img.zoomed').toBeFalsy();
			this.expectChildNativeElement('img.unzoomed').toBeFalsy();

			const placeholder = 
				this.getChildNativeElementByCss('img') as HTMLImageElement;

			expect(placeholder.src)
				.toContain('images/placeholders/dark.svg');
		});


		it('should show injected content', () => {
			const injectedDiv = this.getChildNativeElementByCss(
				'.wrapper div.injectedContent'
			);

			expect(injectedDiv.innerHTML)
				.toBe(this.hostComponent.injectedContent);
		});


		it('should emit load event even if images fail to load',
				async(() => {
			for(let image of this.images)
				image.dispatchEvent(new Event('error'));

			expect(this.hostComponent.onLoad).toHaveBeenCalled();
		}));

	}


	private get images(): HTMLImageElement[] {
		return this.getAllChildNativeElementsByCss(
			'img'
		) as HTMLImageElement[];
	}


	protected triggerLoadEvent(): void {
		// Ready once both images have loaded
		for(let image of this.images)
			image.dispatchEvent(new Event('load'));
	}


	protected definePostloadTests(): void {
	
		it('should re-emit load event when filename changes, and new '
				+ 'images have loaded', fakeAsync(() => {
			this.hostComponent.filename = 'new_image.jpg';
			this.fixture.detectChanges();
			this.checkComponentReloads();
		}));
	
	}

}


new ThumbnailComponentTest();