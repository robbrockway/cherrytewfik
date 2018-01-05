// Components used only when a staff user is logged in

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

import {
	EditableCategoryListComponent,
	EditableCategoryListItemComponent,
} from './editable-ordered-list';

import { AdminGuideView } from './admin.guide.view';
import { EditableFieldsModule } from '../fields/editable';
import { SharedModule } from '../shared';



const routes: Routes = [
	{
		path: 'guide',
		component: AdminGuideView,
	},
];



@NgModule({
	declarations: [
		EditableCategoryListComponent,
		EditableCategoryListItemComponent,
		AdminGuideView,
	],

	imports: [
		EditableFieldsModule,
		SharedModule,
		CommonModule,
		RouterModule.forChild(routes),
	],

	exports: [
		EditableCategoryListComponent,
	],
})
export class StaffModule {}