import { Component } from '@angular/core';
import { TestModuleMetadata, async } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import {
	TickerImage,
	TickerImageComponent,
} from './ticker.image.component';

import {
	SlowLoadingComponentTest,
	SlowLoadingHostComponent,
} from '../slow.loading.component.test.base';

import { testTickerImages, mergeModuleMetadata } from 'testing';
import { getLastItem } from 'utils';



@Component({
	template: `
		<ticker-image
			[image]="image"
			[foreground]="foreground"
			[showLink]="showLink"
			[fadeTransition]="fadeTransition"
			[animationDuration]="animationDuration"
			(load)="onLoad()"
		></ticker-image>
	`,
})
class HostComponent extends SlowLoadingHostComponent {
	
	image: TickerImage;
	foreground = false;
	showLink = false;
	fadeTransition = 'opacity 0.5s';
	animationDuration = 4567;


	constructor() {
		super();

		this.image = getLastItem(testTickerImages);

		Object.assign(this.image, {
			src: 'src.jpg',
			srcset: 'src1.jpg 1w',
		});
	}

}



class TickerImageComponentTest extends SlowLoadingComponentTest {

	constructor() {
		super(TickerImageComponent, HostComponent);
	}


	protected getModuleMetadata(): TestModuleMetadata {
		const defaultMetadata = super.getModuleMetadata();

		const extraMetadata = {
			imports: [RouterTestingModule],
		};

		return mergeModuleMetadata(defaultMetadata, extraMetadata);
	}


	protected triggerLoadEvent(): void {
		this.fixture.detectChanges();
		const img = this.getChildNativeElementByCss('img');
		img.dispatchEvent(new Event('load'));
	}


	protected defineTests(): void {
		super.defineTests();


		describe(', when link is not showing,', () => {

			beforeEach(() => {
				this.fixture.detectChanges();
			});

			this.defineTestsForOuterWrapperType('div');
		});


		describe(', when link is showing,', () => {

			beforeEach(() => {
				this.hostComponent.showLink = true;
				this.fixture.detectChanges();
			});


			it('should give correct routerLink to outer wrapper', () => {
				const routerLink = this.hostComponent.image.routerLink;

				this.expectChildNativeElement(
					`a.outerWrapper[ng-reflect-router-link="${routerLink}"]`
				).toBeTruthy();
			});


			this.defineTestsForOuterWrapperType('a');
		});

	}


	// The .outerWrapper element is either a div or an anchor, depending on whether link has been told to show. Tests can run the same way each time, except for that one change
	private defineTestsForOuterWrapperType(
		outerWrapperType: 'div' | 'a'
	): void {

		const outerWrapperSelector =
			outerWrapperType + '.outerWrapper';

		let expectOuterWrapperWithClass: (className: string) => any;
		let setTickerImageProperties: (properties: any) => void;
		let expectImgWithClass: (className: string) => any;



		it(`should show ${outerWrapperType}.outerWrapper`, () => {
			this.expectChildNativeElement(
				outerWrapperSelector
			).toBeTruthy();
		});


		it('should give .foreground class to outer wrapper, when '
				+ 'foreground input is true', () => {
			this.setInputValues({foreground: true});
			expectOuterWrapperWithClass('foreground').toBeTruthy();
		});


		// Allows for checking whether the .outerWrapper element does/doesn't also have other CSS classes
		expectOuterWrapperWithClass = (className: string) =>
			this.expectChildNativeElement(
				outerWrapperSelector + '.' + className
			);
		

		it(`shouldn't give .foreground class to outer wrapper, when `
				+ 'foreground input is false', () => {
			this.setInputValues({foreground: false});
			expectOuterWrapperWithClass('foreground').toBeFalsy();
		});


		it('should give .hidden class to outer wrapper, when '
				+ 'image.visible is false', () => {
			setTickerImageProperties({visible: false});
			expectOuterWrapperWithClass('hidden').toBeTruthy();
		});


		setTickerImageProperties = (properties: any) => {
			const newTickerImage =
				Object.assign({}, this.hostComponent.image, properties);

			this.setInputValues({image: newTickerImage});
		};


		it(`shouldn't give .hidden class to outer wrapper, when `
				+ 'image.visible is true', () => {
			setTickerImageProperties({visible: true});
			expectOuterWrapperWithClass('hidden').toBeFalsy();
		});


		it('should give the provided CSS transition property to outer '
				+ 'wrapper', () => {
			const outerWrapper =
				this.getChildNativeElementByCss(outerWrapperSelector);

			expect(outerWrapper.style.transition)
				.toBe(this.hostComponent.fadeTransition);
		});


		it('should give .moving class to image, if image.moving is true',
				() => {
			setTickerImageProperties({moving: true});
			expectImgWithClass('moving').toBeTruthy();
		});


		expectImgWithClass = (className: string) =>
			this.expectChildNativeElement('img.' + className);


		it(`shouldn't give .moving class to image, if image.moving is `
				+ 'false', () => {
			setTickerImageProperties({moving: false});
			expectImgWithClass('moving').toBeFalsy();
		});


		describe(`should have image`, () => {

			let imgElement: HTMLImageElement;


			beforeEach(() => {
				imgElement = this.getChildNativeElementByCss(
					'img'
				) as HTMLImageElement;
			});


			it('with the provided animationDuration property', () => {
				expect(imgElement.style.animationDuration)
					.toBe(this.hostComponent.animationDuration + 'ms');
			});


			it('with the provided src', () => {
				expect(imgElement.src)
					.toContain(this.hostComponent.image.src);
			});


			it('with the provided srcset', () => {
				expect(imgElement.srcset)
					.toBe(this.hostComponent.image.srcset);
			});


			it('with the provided alt text', () => {
				expect(imgElement.alt).toBe(this.hostComponent.image.alt);
			});


			it('that triggers load event when it loads', async(() => {
				const handler = this.hostComponent.onLoad;
				handler.calls.reset();
				imgElement.dispatchEvent(new Event('load'));
				expect(handler).toHaveBeenCalled();
			}));

		});

	}

}


new TickerImageComponentTest();