import { TestModuleMetadata } from '@angular/core/testing';

import { Piece } from './piece';
import { Category, CategoryService } from '../category';
import { GalleryModelTest } from '../gallery.model.test.base';

import {
	testPieceData,
	ModelTestData,
	mergeModuleMetadata,
} from 'testing';



class PieceTest extends GalleryModelTest<Piece> {

	constructor() {
		super(Piece);
	}


	protected defineTests(): void {
		super.defineTests();


		describe('.renderedPrice', () => {
			
			it('should round price to two decimal places', () => {
				this.piece.price = 2.0472;
				expect(this.piece.renderedPrice)
					.toBe('2.05');
			});


			it('should supply two trailing zeros when necessary', () => {
				this.piece.price = 700.;
				expect(this.piece.renderedPrice)
					.toBe('700.00');
			});

		});


		it(`should refresh parent category's images, if image is updated`,
				() => {
			const category = this.piece.category;

			spyOn(category, 'refreshImages');
			this.piece.setProperties({image: 'newimage.jpg'});
			expect(category.refreshImages).toHaveBeenCalled();
		});

	}


	private get piece(): Piece {
		return this.instance as Piece;
	}


	protected initTestData(): ModelTestData<Piece> {
		return testPieceData;
	}

}


new PieceTest();
