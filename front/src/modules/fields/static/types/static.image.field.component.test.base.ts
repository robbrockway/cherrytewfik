// Common material for testing StaticImageFieldComponent and StaticThumbnailFieldComponent

import { Type } from '@angular/core';
import { async } from '@angular/core/testing';

import { Piece } from 'modules/main/models';

import {
	TypedStaticFieldHostComponent,
	TypedStaticFieldComponentTest,
} from '../typed.static.field.component.test.base';

import { StaticImageFieldComponentBase }
	from './static.image.field.component.base';

import { fullImageSize } from 'utils';



export abstract class StaticImageFieldHostComponent
		extends TypedStaticFieldHostComponent {
	widthList: number[] = [150, 300, fullImageSize];
	rootDirectory: string = 'directory';
}



export abstract class StaticImageFieldComponentTestBase
		extends TypedStaticFieldComponentTest {

	constructor(
		hostedComponentType: Type<StaticImageFieldComponentBase>,
		hostComponentType: Type<StaticImageFieldHostComponent>,
		testName: string = hostedComponentType.name
	) {
		super(
			hostedComponentType,
			hostComponentType,
			testName
		);
	}


	protected defineTests(): void {
		super.defineTests();


		it('should emit load event when object changes, but image itself '
				+ `doesn't`, async(() => {
			this.setComponentParams(this.testPiece, 'image');

			const pieceProperties = this.testPiece.toDict();
			const pieceCopy = new Piece(null, pieceProperties);

			this.setComponentParams(pieceCopy, 'image');

			expect(this.hostComponent.onLoad).toHaveBeenCalled();
		}));

	}


	// Image/thumbnail fields, as opposed to others, don't disappear in the absence of a value; instead, they show a placeholder image
	protected defineNoValueTest(): void {

		it('should show placeholder image in the absence of a filename',
				() => {
			this.setValueToNothing();

			expect(this.img.src.endsWith(this.placeholderImgSrc))
				.toBeTruthy();
		});

	}


	// First <img> tag available
	protected get img(): HTMLImageElement {
		return this.getChildNativeElementByCss(
			'img'
		) as HTMLImageElement;
	}


	// Path to image file used in the absence of any provided image
	protected abstract get placeholderImgSrc(): string;

}