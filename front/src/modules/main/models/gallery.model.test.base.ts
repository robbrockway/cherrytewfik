// Base class for testing GalleryModel subclasses

import { GalleryModel } from './gallery.model';
import { ModelTest } from './model.test.base';



export abstract class GalleryModelTest<T extends GalleryModel>
		extends ModelTest<T> {

	protected defineTests(): void {
		super.defineTests();


		it('should provide correct path as .routerLink', () => {
			const expectedPath = [
				'',
				'gallery',
				this.modelType.name.toLowerCase(),
				this.instance.pk
			].join('/');
			
			expect(this.instance.routerLink)
				.toBe(expectedPath);
		});

	}

}