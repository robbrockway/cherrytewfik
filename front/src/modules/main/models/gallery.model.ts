// Base class for Piece and Category; provides .routerLink property pointing to the correct piece/category view

import { Model } from './model';



export abstract class GalleryModel extends Model {

	get routerLink(): string {
		const parts = [
			'',
			'gallery',
			this.modelNameForRouter,
			this.pk,
		]

		return parts.join('/');
	}


	private get modelNameForRouter(): string {
		return this.constructor.name.toLowerCase();
	}

}