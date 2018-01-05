import { Component } from '@angular/core';

import {
	TestModuleMetadata,
	async,
	fakeAsync,
	flushMicrotasks,
} from '@angular/core/testing';

import { RouterTestingModule } from '@angular/router/testing';

import { Subject } from 'rxjs/Subject';

import {
	Category,
	CategorySelector,
	Piece,
} from 'modules/main/models';

import { StaticCategoryListItemComponent }
	from './static.category.list.item.component';

import { TickerImage } from 'modules/shared/image-ticker';
import { fullImageSize } from 'utils';

import {
	SlowLoadingComponentTest,
	SlowLoadingHostComponent,
} from 'modules/shared/slow.loading.component.test.base';

import {
	StaticOrderedListItemHostComponent,
	StaticOrderedListItemComponentTest,
} from './static.ordered.list.item.component.test.base';

import {
	testCategoryData,
	MockImageTickerDirective,
	mergeModuleMetadata,
} from 'testing';



@Component({
	template: `
		<static-category-list-item
			[object]="object"
			[linkEnabled]="linkEnabled"
			[message]="message"
			(load)="onLoad()"
		></static-category-list-item>
	`,
})
class HostComponent
		extends StaticOrderedListItemHostComponent<Category> {

	message: string;


	constructor() {
		super();
		const testData = testCategoryData.instances[0];
		this.object = testData.toModelInstance();
	}

}



class CategoryListItemComponentTest
		extends StaticOrderedListItemComponentTest<Category> {

	private mockImageTickerComponent: MockImageTickerDirective;
	private categorySelector$ = new Subject<Category>();


	constructor() {
		super(
			StaticCategoryListItemComponent,
			HostComponent
		);
	}


	protected getModuleMetadata(): TestModuleMetadata {
		const defaultMetadata = super.getModuleMetadata();
		
		const mockCategorySelector = this.createMockCategorySelector();

		const extraMetadata = {
			declarations: [
				MockImageTickerDirective,
			],

			providers: [
				{provide: CategorySelector, useValue: mockCategorySelector},
			],

			imports: [
				RouterTestingModule,
			],
		};

		return mergeModuleMetadata(defaultMetadata, extraMetadata);
	}


	private createMockCategorySelector(): any {
		return {
			subscribe: (
				callback: (category: Category) => void
			) => this.categorySelector$.subscribe(callback),

			selection$: this.categorySelector$,
		};
	}


	protected defineTests(): void {
		super.defineTests();

		let category: Category;

		let checkTickerImagesMatchCategoryImages: () => void;
		let getImageListFromCategory: () => string[];
		let getImageListFromTicker: () => string[];
		let expectLitUp: () => any;
		let selectCategory: (category: Category) => void;
		let createSecondCategory: () => Category;


		beforeEach(() => {
			this.fixture.detectChanges();

			this.mockImageTickerComponent =
				this.getChildDirective(MockImageTickerDirective);

			category = this.hostComponent.object;
		});

		
		it('should use category name as heading, by default', () => {
			this.checkChildTextContentIs(
				'.categoryName',
				category.name
			);
		});


		it(`should show 'Untitled category' as heading, if no name`,
				() => {
			category.name = '';
			this.fixture.detectChanges();
			
			this.checkChildTextContentIs(
				'.categoryName.faint',
				'Untitled category'
			);
		});


		it('should show custom message as heading, if given', () => {
			const customMessage = 'Message';
			this.hostComponent.message = customMessage;
			this.fixture.detectChanges();

			this.checkChildTextContentIs(
				'.categoryName.faint',
				customMessage
			);
		});


		it(`should pass category's images to ImageTickerComponent`,
				() => {
			checkTickerImagesMatchCategoryImages();
		});


		checkTickerImagesMatchCategoryImages = () => {
			const expectedImageList = getImageListFromCategory();
			const actualImageList = getImageListFromTicker();
			expect(actualImageList).toEqual(expectedImageList);
		};


		// List of image filenames for all pieces in category
		getImageListFromCategory = () => {
			const list = category.pieces.filter(
				(piece: Piece) => piece.image	// Omit imageless pieces
			).map(
				(piece: Piece) => piece.image
			);
			
			// Normalise the order, so it can be compared with other list
			return list.sort();
		};


		// List of all image filenames provided to ImageTickerComponent
		getImageListFromTicker = () => {
			const list = this.mockImageTickerComponent.imageList.map(
				(image: TickerImage) => image.filename
			);

			return list.sort();
		};


		it('should update list of images when category fires '
				+ '.imageRefresh$', async(() => {
			category.pieces[0].image = 'newimage.jpg';
			category.refreshImages();
			this.fixture.detectChanges();

			checkTickerImagesMatchCategoryImages();
		}));


		it('should assign correct properties to ImageTickerComponent',
				() => {

			expect(this.mockImageTickerComponent.rootDirectory)
				.toBe('images/pieces');
			
			expect(this.mockImageTickerComponent.widthList)
				.toEqual([180, 360, 720, fullImageSize]);

			expect(this.mockImageTickerComponent.showLinks)
				.toBe(false);
		});


		it('should give ImageTickerComponent a turnaround time between '
				+ 'the min and max', () => {
			const time = this.mockImageTickerComponent.turnaroundTime;

			const min =
				StaticCategoryListItemComponent.minImageTurnaroundTime;
			const max =
				StaticCategoryListItemComponent.maxImageTurnaroundTime;
			
			expect(time).not.toBeLessThan(min);
			expect(time).not.toBeGreaterThan(max);
		});


		it('should be dimmed by default', () => {
			expectLitUp().toBeFalsy();
		});


		// Shorthand, for testing whether or not the component is highlighted (truthy if so)
		expectLitUp = () =>
			this.expectChildNativeElement('.selected');


		it('should light up if own category is selected by '
				+ 'CategorySelector', fakeAsync(() => {
			selectCategory(category);
			expectLitUp().toBeTruthy();
		}));


		selectCategory = (category: Category) => {
			this.categorySelector$.next(category);
			flushMicrotasks();
			this.fixture.detectChanges();
		};


		it('should dim if other category is selected by CategorySelector',
				fakeAsync(() => {
			selectCategory(category);
			
			const otherCategory = createSecondCategory();
			selectCategory(otherCategory);
			
			expectLitUp().toBeFalsy();
		}));


		createSecondCategory = () =>
			testCategoryData.instances[1].toModelInstance();


		it(`should dim if 'null' is sent by CategorySelector`,
				fakeAsync(() => {
			selectCategory(category);
			selectCategory(null);
			expectLitUp().toBeFalsy();
		}));

	}


	protected triggerLoadEvent(): void {
		// Ready once ticker component has loaded
		this.mockImageTickerComponent.load.emit();
	}

}


new CategoryListItemComponentTest();
