import { Component } from '@angular/core';
import { TestModuleMetadata, async } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';

import { Category, CategoryService } from 'modules/main/models';

import { CategoryLinkEditComponent }
	from './category.link.edit.component';

import { EditHostComponent } from '../edit.component.test.base';

import { TypedEditComponentTestBase }
	from './typed.edit.component.test.base';

import {
	mergeModuleMetadata,
	testCategoryData,
} from 'testing';

import { getLastItem } from 'utils';



@Component({
	template: `
		<category-link-edit
			[(value)]="value"
			(valueChange)="onValueChange($event)"
			(cancel)="onCancel()"
		></category-link-edit>
	`,
})
class HostComponent extends EditHostComponent<Category> {}



class CategoryLinkEditComponentTest
		extends TypedEditComponentTestBase<Category> {

	private mockCategoryService: any;
	private allCategories: Category[];


	constructor() {
		super(CategoryLinkEditComponent, HostComponent);
	}


	protected getModuleMetadata(): TestModuleMetadata {
		const defaultMetadata = super.getModuleMetadata();

		this.mockCategoryService = this.createMockCategoryService();

		const extraMetadata = {
			imports: [
				FormsModule,
			],

			providers: [{
				provide: CategoryService,
				useValue: this.mockCategoryService
			}],
		};

		return mergeModuleMetadata(defaultMetadata, extraMetadata);
	}


	private createMockCategoryService(): any {
		this.allCategories = testCategoryData.toListOfModelInstances();

		return {
			cache: this.allCategories,
		};
	}


	protected defineTests(): void {
		super.defineTests();

		let selectElement: HTMLSelectElement;
		let checkDefaultLabelIs: (expectedLabel: string) => void;


		beforeEach(() => {
			this.hostComponent.value = this.allCategories[0];

			this.fixture.detectChanges();

			selectElement = this.getChildNativeElementByCss(
				'select'
			) as HTMLSelectElement;
		});


		it(`should show current category's name as default select option`,
				() => {
			const currentCategory = this.hostComponent.value;
			checkDefaultLabelIs(currentCategory.name);
		});


		checkDefaultLabelIs = (expectedLabel: string) =>
			this.checkChildTextContentIs('option[selected]', expectedLabel);


		it(`should show 'Untitled category' as default select option, if `
				+ 'current category has no name', () => {
			const currentCategory = this.hostComponent.value;
			currentCategory.name = '';
			this.fixture.detectChanges();

			checkDefaultLabelIs('Untitled category');
		});


		it('should show all categories as select options', () => {
			// Categories are indexed from 0; options from 1, and we start with the second one as the first is just a placeholder used as default
			for(
				let categoryIndex = 0, optionIndex = 2;	
				categoryIndex < this.allCategories.length;
				categoryIndex++, optionIndex++
			) {
				const cssSelector = `option:nth-child(${optionIndex})`;
				const category = this.allCategories[categoryIndex];
				this.checkChildTextContentIs(cssSelector, category.name);
			}
		});


		it(`should use 'Untitled category' as option name, for unnamed `
				+ 'categories', () => {
			const lastCategory = getLastItem(this.allCategories);
			lastCategory.name = '';
			this.fixture.detectChanges();

			this.checkChildTextContentIs(
				'option:last-child',
				'Untitled category'
			);
		});


		it('should emit valueChange when a category is selected',
				async(() => {
			const chosenCategory = this.allCategories[1];

			selectElement.value = '2: Object';
			const event = new Event('change');
			selectElement.dispatchEvent(event);

			expect(this.hostComponent.onValueChange)
				.toHaveBeenCalledWith(chosenCategory);
		}));

	}

}


new CategoryLinkEditComponentTest();
