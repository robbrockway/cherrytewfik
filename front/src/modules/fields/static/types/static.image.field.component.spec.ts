import { Component } from '@angular/core';
import { async } from '@angular/core/testing';

import { Piece } from 'modules/main/models';

import {
	fullImageSize,
	generateImgSrc,
	generateImgSrcset,
} from 'utils';

import { StaticImageFieldComponent }
	from './static.image.field.component';

import {
	StaticImageFieldHostComponent,
	StaticImageFieldComponentTestBase,
} from './static.image.field.component.test.base';



@Component({
	template: `
		<static-image-field
			[object]="object"
			[propertyName]="propertyName"
			[widthList]="widthList"
			[rootDirectory]="rootDirectory"
			(load)="onLoad()"
		></static-image-field>
	`,
})
class HostComponent extends StaticImageFieldHostComponent {}



class StaticImageFieldComponentTest
		extends StaticImageFieldComponentTestBase {

	constructor() {
		super(
			StaticImageFieldComponent,
			HostComponent
		);
	}


	protected defineTests(): void {
		super.defineTests();

		const testObject = this.testObject as Piece;


		describe(`'s image`, () => {

			beforeEach(() => {
				this.setComponentParams(testObject, 'image');
			});


			it('should have correct src property', () => {
				const expectedSrc = generateImgSrc(
					this.hostComponent.rootDirectory,
					fullImageSize,
					testObject.image
				);

				expect(this.img.src.endsWith(expectedSrc))
					.toBeTruthy();
			});


			it('should have correct srcset property, including all '
					+ 'widths', () => {
				const expectedSrcset = generateImgSrcset(
					this.hostComponent.rootDirectory,
					this.hostComponent.widthList,
					testObject.image
				);

				expect(this.img.srcset.endsWith(expectedSrcset))
					.toBeTruthy();
			});


			it('should emit load event, even if image fails to load',
					async(() => {
				this.img.dispatchEvent(new Event('error'));
				expect(this.hostComponent.onLoad).toHaveBeenCalled();
			}));

		});

	}


	protected get placeholderImgSrc(): string {
		return 'images/placeholders/light.svg';
	}


	protected triggerLoadEvent(): void {
		// Component is ready once the image itself has loaded
		this.img.dispatchEvent(new Event('load'));
	}

}


new StaticImageFieldComponentTest();


