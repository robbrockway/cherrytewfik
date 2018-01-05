// Common tests for EditablePieceListItemComponent and EditableCategoryListItemComponent; the components themselves inherit straight from OrderedListItemComponent

import { Type } from '@angular/core';
import { TestModuleMetadata } from '@angular/core/testing';

import { GalleryModel } from 'modules/main/models';
import { OrderedListItemComponent } from 'modules/shared/static-ordered-list';

import {
	OrderedListItemHostComponent,
	OrderedListItemComponentTest,
} from 'modules/shared/static-ordered-list/ordered.list.item.component.test.base';

import {
	MockStaticOrderedListItemDirective,
	checkChildTextContentIs,
} from 'testing';



export abstract class
		EditableOrderedListItemHostComponent<T extends GalleryModel>
		extends OrderedListItemHostComponent<T> {}



export abstract class
		EditableOrderedListItemComponentTest<T extends GalleryModel>
		extends OrderedListItemComponentTest<T> {

	constructor(
		hostedComponentType: Type<OrderedListItemComponent<T>>,
		hostComponentType: Type<EditableOrderedListItemHostComponent<T>>,
		private mockStaticOrderedListItemComponentType: 
			Type<MockStaticOrderedListItemDirective<T>>,
		testName?: string
	) {
		super(hostedComponentType, hostComponentType, testName);
	}


	protected getModuleMetadata(): TestModuleMetadata {
		const metadata = super.getModuleMetadata();

		metadata.declarations
			.push(this.mockStaticOrderedListItemComponentType);

		return metadata;
	}


	protected defineTests(): void {
		super.defineTests();

		let expectLinkEnabled: () => any;


		it('should pass correct inputs to static list item component', () => {
			this.fixture.detectChanges();

			this.checkSubcomponentMatchesHostComponentProperties(
				this.mockStaticOrderedListItemComponentType,
				['object', 'reorder$']
			);
		});


		it('should reinject injected content into static list item '
				+ 'component', () => {
			this.fixture.detectChanges();

			const searchSpace =
				this.getChildDirectiveDebugElement(
					this.mockStaticOrderedListItemComponentType
				);
					
			checkChildTextContentIs(
				searchSpace,
				'.injectedContent',
				this.hostComponent.injectedText
			);
		});


		it('should enable link by default', () => {
			this.fixture.detectChanges();
			expectLinkEnabled().toBe(true);
		});


		expectLinkEnabled = () =>
			expect(this.mockStaticOrderedListItemComponent.linkEnabled);


		it('should disable link while object is being deleted', () => {
			this.object.deleting = true;
			this.fixture.detectChanges();
			expectLinkEnabled().toBe(false);
		});

	}


	private get mockStaticOrderedListItemComponent(
	): MockStaticOrderedListItemDirective<T> {
		return this.getChildDirective(
			this.mockStaticOrderedListItemComponentType
		);
	}


	protected triggerLoadEvent(): void {
		this.mockStaticOrderedListItemComponent.load.emit();
	}

}