// Displays the provided image filename as a zoomable thumbnail, by way of ThumbnailComponent

import { Component, Input } from '@angular/core';

import { StaticImageFieldComponentBase }
	from './static.image.field.component.base';



@Component({
	selector: 'static-thumbnail-field',
	templateUrl: './static.thumbnail.field.component.html',
})
export class StaticThumbnailFieldComponent
		extends StaticImageFieldComponentBase {

	// In the absence of an image
	placeholderSrc = 'images/placeholders/dark.svg';

}