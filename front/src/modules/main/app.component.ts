import {
	Component,
	ViewEncapsulation,
	ChangeDetectorRef,
} from '@angular/core';

import { NotificationService } from './notification';
import { LoadScreenService } from './load-screen';
import { WindowService } from './window.service';

import { 
	UserService,
	Category,
	CategoryService
} from 'modules/main/models';



@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss'],
	encapsulation: ViewEncapsulation.None,
})
export class AppComponent {

	categories: Category[];
	loadScreenVisible = true;
	navCssClass: 'fixed' | 'moving' | 'sticky' = 'fixed';


	constructor(
		private categoryService: CategoryService,
		private loadScreenService: LoadScreenService,
		private changeDetector: ChangeDetectorRef,
		private windowService: WindowService
	) {}


	ngOnInit(): void {
		this.loadScreenService.visibility$.subscribe(
				(visible: boolean) => {

			this.loadScreenVisible = visible;
			this.changeDetector.detectChanges();
			
			// The 'initial load screen' is distinct from the load screen included in AppComponent
			if(!visible)
				this.hideInitialLoadScreen();
		});

		this.loadCategories();
	}


	ngAfterViewInit(): void {
		this.windowService.emitState();
	}


	onNavClassChange(): void {
		this.changeDetector.detectChanges();
	}


	// Initial load screen, displayed when the app first loads, exists outside of Angular as a raw part of index.html so that it can appear immediately
	private hideInitialLoadScreen(): void {
		const initialLoadScreen =
			document.querySelector('.initialLoadScreen.visible');

		if(initialLoadScreen)
			initialLoadScreen.className = 'initialLoadScreen';	// no longer visible
	}


	private loadCategories(): void {
		this.categoryService.list().subscribe(
			(categories: Category[]) =>	this.categories = categories
		);
	}
	
}
