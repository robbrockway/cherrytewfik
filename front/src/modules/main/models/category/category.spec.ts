import { Category } from './category';
import { Piece } from '../piece';
import { GalleryModelTest } from '../gallery.model.test.base';

import {
	ModelTestData,
	testCategoryData,
} from 'testing';



class CategoryTest extends GalleryModelTest<Category> {

	constructor() {
		super(Category);
	}


	protected initTestData(): ModelTestData<Category> {
		return testCategoryData;
	}


	protected defineTests(): void {
		super.defineTests();


		it('should emit through .imageRefresh$ when .refreshImages() is '
				+ 'called', done => {

			this.category.imageRefresh$.subscribe(done);
			this.category.refreshImages();
		});


		describe('should refresh images', () => {

			let piece: Piece;

			beforeEach(() => {
				piece = this.category.pieces[0];
				spyOn(this.category, 'refreshImages');
			});


			it('when reference to a piece is removed', () => {
				this.category.removeReferenceTo(piece, 'pieces');
			});


			it('when reference to a piece is added', () => {
				this.category.addReferenceTo(piece, 'pieces');
			});


			afterEach(() => {
				expect(this.category.refreshImages).toHaveBeenCalled();
			});

		});

	}


	private get category(): Category {
		return this.instance as Category;
	}

}


new CategoryTest();