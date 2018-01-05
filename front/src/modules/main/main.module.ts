import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { BrowserModule } from '@angular/platform-browser';

import { BrowserAnimationsModule } 
	from '@angular/platform-browser/animations';

import { FormsModule } from '@angular/forms';
import { HttpModule, Http } from '@angular/http';

import { CustomHttp } from './custom.http';
import { AppComponent } from './app.component';

import {
	LoginComponent,
	LoginFormComponent,
	LoginFormFieldComponent,
	UserMenuComponent,
} from './login';

import { FlyoutComponent, FlyoutService } from './flyout';

import {
	FormComponent,
	FormFieldComponent
} from './form';

import {
	DialogueComponent,
	DialogueService,
} from './dialogue';

import {
	NotificationComponent,
	NotificationService,
} from './notification';

import { OkCancelComponent } from './ok-cancel';

import {
	CategoryListComponent,
	StaticCategoryListComponent,
} from './category-list';

import {
	LoadScreenComponent,
	LoadScreenService,
} from './load-screen';

import {
	PieceService,
	CategoryService,
	CategorySelector,
	UserService,
	TableStringService,
} from './models';

import { ScrollToTopOnNavigationDirective }
	from './scroll.to.top.on.navigation.directive';

import { StickyNavBarDirective } from './sticky.nav.bar.directive';
import { WindowService } from './window.service';
import { SharedModule } from '../shared';
import { FieldsModule } from '../fields';
import { StaffModule } from '../staff';


// Lazy-load other modules for specific pages
const routes: Routes = [

	{
		path: '',
		loadChildren: 'modules/home-view#HomeViewModule',
	},

	{
		path: 'gallery',
		loadChildren: 'modules/gallery#GalleryModule',
	},

	{
		path: 'staff',
		loadChildren: 'modules/staff#StaffModule',
	},

];



@NgModule({
	declarations: [
		AppComponent,
		LoadScreenComponent,
		LoginComponent,
		LoginFormComponent,
		LoginFormFieldComponent,
		UserMenuComponent,
		FlyoutComponent,
		DialogueComponent,
		NotificationComponent,
		FormComponent,
		FormFieldComponent,
		OkCancelComponent,
		CategoryListComponent,
		StaticCategoryListComponent,
		ScrollToTopOnNavigationDirective,
		StickyNavBarDirective,
	],

	imports: [
		SharedModule,
		FieldsModule,
		StaffModule,
		BrowserModule,
		BrowserAnimationsModule,
		FormsModule,
		HttpModule,
		RouterModule.forRoot(routes),
	],

	providers: [
		LoadScreenService,
		DialogueService,
		NotificationService,
		WindowService,
		FlyoutService,
		PieceService,
		CategoryService,
		CategorySelector,
		UserService,
		TableStringService,
		{provide: Http, useClass: CustomHttp},	// CustomHttp masquerades as standard Http
	],

	bootstrap: [AppComponent],
})
export class MainModule {}
