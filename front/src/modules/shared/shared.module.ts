import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

import { StaticFieldsModule } from '../fields/static';
import { SpacerComponent } from './spacer.component';
import { EditButtonsComponent } from './edit.buttons.component';
import { StaticCategoryListItemComponent } from './static-ordered-list';

import {
	ImageTickerComponent,
	TickerImageComponent,
} from './image-ticker';

import { ImagePreloader } from './image.preloader';



@NgModule({
	declarations: [
		SpacerComponent,
		EditButtonsComponent,
		StaticCategoryListItemComponent,
		ImageTickerComponent,
		TickerImageComponent,
	],

	providers: [
		ImagePreloader,
	],

	imports: [
		StaticFieldsModule,
		RouterModule,
		CommonModule,
	],

	exports: [
		SpacerComponent,
		EditButtonsComponent,
		StaticCategoryListItemComponent,
		ImageTickerComponent,
	],
})
export class SharedModule {}