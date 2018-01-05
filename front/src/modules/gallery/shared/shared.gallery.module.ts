// Common material for GalleryModule and EditableGalleryModule

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { SharedModule } from 'modules/shared';
import { StaticFieldsModule } from 'modules/fields/static';
import { TruncatedTextComponent } from './truncated.text.component';

import { StaticPieceListItemComponent }
	from './static.piece.list.item.component';



@NgModule({
	declarations: [
		StaticPieceListItemComponent,
		TruncatedTextComponent,
	],

	imports: [
		SharedModule,
		StaticFieldsModule,
		CommonModule,
		RouterModule,
	],

	exports: [
		StaticPieceListItemComponent,
	],
})
export class SharedGalleryModule {}