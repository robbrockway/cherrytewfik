import { TestModuleMetadata } from '@angular/core/testing';

import { CategoryView } from './category.view';
import { GalleryViewTest } from './gallery.view.test.base';
import { Category, CategoryService } from 'modules/main/models';

import {
	testCategoryData,
	MockPieceListDirective,
} from 'testing';



export class CategoryViewTest extends GalleryViewTest<Category> {

	constructor() {
		super(
			CategoryView,
			Category,
			CategoryService,
			testCategoryData
		);
	}


	protected getModuleMetadata(): TestModuleMetadata {
		const metadata = super.getModuleMetadata();
		metadata.declarations.push(MockPieceListDirective);
		return metadata;
	}


	protected defineTests(): void {
		super.defineTests();


		it('should pass list of pieces to PieceListComponent', () => {
			expect(this.mockPieceListComponent.objects)
				.toBe(this.currentCategory.pieces);
		});


		it('should pass category to PieceListComponent', () => {
			expect(this.mockPieceListComponent.category)
				.toBe(this.currentCategory);
		});

	}


	private get mockPieceListComponent(): MockPieceListDirective {
		return this.getChildDirective(MockPieceListDirective);
	}


	// Should select the current category, to be highlighted on nav bar
	protected get expectedCategoryToHighlight(): Category {
		return this.currentCategory;
	}


	// Alias, for clarity
	private get currentCategory(): Category {
		return this.currentInstance;
	}


	private set currentCategory(category: Category) {
		this.currentInstance = category;
	}


	protected triggerLoadScreenHide(): void {
		// Should hide load screen once piece list has loaded
		this.mockPieceListComponent.load.emit();
	}

}


new CategoryViewTest();