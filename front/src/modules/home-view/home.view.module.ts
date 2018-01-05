import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

import { SharedModule } from 'modules/shared';
import { FieldsModule } from 'modules/fields';
import { HomeView } from './home.view';
import { PieceTickerComponent, PieceTickerService } from './piece-ticker';


const routes: Routes = [{
	path: '',
	component: HomeView,
}];


@NgModule({
	declarations: [
		HomeView,
		PieceTickerComponent,
	],

	providers: [
		PieceTickerService,
	],

	imports: [
		SharedModule,
		FieldsModule,
		CommonModule,
		RouterModule.forChild(routes),
	],
})
export class HomeViewModule {}