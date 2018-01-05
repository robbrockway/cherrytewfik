// Editability for category view, to be loaded once user logs in as staff

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedGalleryModule } from '../shared';
import { SharedModule } from 'modules/shared';

import { EditablePieceListComponent }
	from './editable.piece.list.component';

import { EditablePieceListItemComponent }
	from './editable.piece.list.item.component';



@NgModule({
	declarations: [
		EditablePieceListComponent,
		EditablePieceListItemComponent,
	],

	imports: [
		SharedGalleryModule,
		SharedModule,
		CommonModule,
	],

	exports: [
		EditablePieceListComponent,
	],
})
export class EditableGalleryModule {}