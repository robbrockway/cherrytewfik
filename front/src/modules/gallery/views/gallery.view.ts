// Base class for PieceView and CategoryView, providing an automatic load operation for the chosen piece or category based on the current URL

import { ActivatedRoute } from '@angular/router';

import { Subscription } from 'rxjs/Subscription';

import {
	GalleryModel,
	ModelService,
	Category,
	CategorySelector,
} from 'modules/main/models';

import { LoadScreenService } from 'modules/main/load-screen';
import { View } from 'modules/shared';



export abstract class GalleryView<T extends GalleryModel> extends View {

	protected instance: T;	// ...being viewed
	private routeSubscription: Subscription;


	constructor(
		protected route: ActivatedRoute,
		protected modelService: ModelService<T>,
		protected categorySelector: CategorySelector,
		loadScreenService: LoadScreenService
	) {
		super(loadScreenService);
	}


	ngOnInit(): void {
		this.routeSubscription =
				this.route.params.subscribe((params: any) => {
			const pk = +params['pk'];
			this.loadInstance(pk);
		});
	}


	private loadInstance(pk: number): void {
		this.loadScreenService.show();

		this.modelService.lazyRetrieve(pk).subscribe(
				(instance: T) => {

			this.instance = instance;
			this.categorySelector.select(this.categoryToHighlight);
		});
	}


	// Should return a category to light up in the nav bar's category list, or null
	protected abstract get categoryToHighlight(): Category;


	ngOnDestroy(): void {
		super.ngOnDestroy();
		this.routeSubscription.unsubscribe();
		this.categorySelector.select(null);
	}

}