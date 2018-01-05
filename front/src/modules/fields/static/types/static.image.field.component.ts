// This field renders a flat image, as opposed to the zoomable thumbnail rendered by StaticThumbnailFieldComponent

import { Component, Input } from '@angular/core';

import { StaticImageFieldComponentBase }
	from './static.image.field.component.base';

import {
	generateImgSrc,
	generateImgSrcset,
	fullImageSize,
} from 'utils';



// for when no image is specified
const placeholderSrc = 'images/placeholders/light.svg';



@Component({
	selector: 'static-image-field',
	templateUrl: './static.image.field.component.html',
})
export class StaticImageFieldComponent
		extends StaticImageFieldComponentBase {

	get src(): string {
		if(!this.value)
			return placeholderSrc

		return generateImgSrc(
			this.rootDirectory,
			this.defaultWidth,
			this.value
		);
	}


	private get defaultWidth(): number {
		return this.widthList.slice(-1)[0] || fullImageSize;
	}


	get srcset(): string {
		if(!this.value)
			return null;

		return generateImgSrcset(
			this.rootDirectory,
			this.widthList,
			this.value
		);
	}

}