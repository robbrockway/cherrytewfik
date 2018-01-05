// Static, uneditable versions of field components. A field component is an on-screen representation of one (or, occasionally, more than one) property of a model instance. It may be of a string, price, image or other type.


import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { StaticFieldComponent } from './static.field.component';

import {
	StaticStringFieldComponent,
	StaticPriceFieldComponent,
	StaticYearMonthFieldComponent,
	StaticImageFieldComponent,
	StaticThumbnailFieldComponent,
	StaticCategoryLinkFieldComponent,
} from './types';

import { ThumbnailComponent }
	from './thumbnail.component';



@NgModule({
	declarations: [
		StaticFieldComponent,
		StaticStringFieldComponent,
		StaticPriceFieldComponent,
		StaticYearMonthFieldComponent,
		StaticImageFieldComponent,
		StaticThumbnailFieldComponent,
		StaticCategoryLinkFieldComponent,
		ThumbnailComponent,
	],

	imports: [
		CommonModule,
		RouterModule.forChild([]),
	],

	exports: [
		StaticFieldComponent,
		StaticYearMonthFieldComponent,	// used by PieceListItemComponent in GalleryModule
		ThumbnailComponent,
	],
})
export class StaticFieldsModule {}
