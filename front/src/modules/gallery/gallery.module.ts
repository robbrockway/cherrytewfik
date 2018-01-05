// Contains 'gallery' components, i.e. main gallery view at /category/<pk>, and single piece view at /piece/<pk>, as well as some special subcomponents.

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

import { PieceView, CategoryView } from './views';

import {
	PieceListComponent,
	StaticPieceListComponent,
} from './piece-list';

import {
	PieceNavigatorComponent,
	PieceNavigatorButtonComponent,
} from './piece-navigator';

import { FieldsModule } from 'modules/fields';
import { StaticFieldsModule } from 'modules/fields/static';
import { EditableFieldsModule } from 'modules/fields/editable';
import { SharedModule } from 'modules/shared';
import { EditableGalleryModule } from './editable';
import { SharedGalleryModule } from './shared';



const routes: Routes = [

	{
		path: 'piece/:pk',
		component: PieceView,
	},

	{
		path: 'category/:pk',
		component: CategoryView,
	},

];



@NgModule({
	declarations: [
		PieceView,
		PieceNavigatorComponent,
		PieceNavigatorButtonComponent,
		CategoryView,
		PieceListComponent,
		StaticPieceListComponent,
	],

	imports: [
		SharedModule,
		EditableGalleryModule,
		SharedGalleryModule,
		EditableFieldsModule,
		FieldsModule,
		StaticFieldsModule,
		CommonModule,
		RouterModule.forChild(routes),
	],
})
export class GalleryModule {}