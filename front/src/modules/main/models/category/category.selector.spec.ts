import { async } from '@angular/core/testing';

import { Category } from './category';
import { CategorySelector } from './category.selector';
import { testCategoryData } from 'testing';



describe('CategorySelector', () => {

	const originalCategory =
		testCategoryData.instances[0].toModelInstance();

	let service: CategorySelector;


	beforeEach(() => {
		service = new CategorySelector();
	});


	it('.select() should emit selected category through stream', async(() => {
		service.subscribe((emittedCategory: Category) => {
			if(emittedCategory)	// Will emit null first; ignore this
				expect(emittedCategory).toBe(originalCategory);
		});

		service.select(originalCategory);
	}));


	it('should emit last-selected category, on subscription', async(() => {
		service.select(originalCategory);

		service.subscribe((emittedCategory: Category) => {
			expect(emittedCategory).toBe(originalCategory);
		});
	}));

});