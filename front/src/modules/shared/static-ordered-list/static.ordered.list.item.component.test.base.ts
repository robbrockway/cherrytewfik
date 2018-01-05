// Base classes for testing StaticPieceListItemComponent and StaticCategoryListItemComponent

import { Type } from '@angular/core';

import { GalleryModel } from 'modules/main/models';

import {
	OrderedListItemHostComponent,
	OrderedListItemComponentTest,
} from './ordered.list.item.component.test.base';

import { StaticOrderedListItemComponent }
	from './static.ordered.list.item.component';



export abstract class
		StaticOrderedListItemHostComponent<T extends GalleryModel>
		extends OrderedListItemHostComponent<T> {
	linkEnabled = true;
}



export abstract class
		StaticOrderedListItemComponentTest<T extends GalleryModel>
		extends OrderedListItemComponentTest<T> {

	constructor(
		hostedComponentType: Type<StaticOrderedListItemComponent<T>>,
		hostComponentType: Type<StaticOrderedListItemHostComponent<T>>,
		testName?: string
	) {
		super(hostedComponentType, hostComponentType, testName);
	}


	protected defineTests(): void {
		super.defineTests();

		let expectLinkElement: () => any;


		beforeEach(() => {
			this.fixture.detectChanges();
		});


		it('should include link to object, if .linkEnabled === true',
				() => {
			expectLinkElement().toBeTruthy();
		});

		
		expectLinkElement = () => {
			const expectedRouterLink =
				this.hostComponent.object.routerLink;

			return this.expectChildNativeElement(
				`a[ng-reflect-router-link="${expectedRouterLink}"]`
			);
		};


		it(`shouldn't include link to object, if .linkEnabled === false`,
				() => {
			this.hostComponent.linkEnabled = false;
			this.fixture.detectChanges();
			expectLinkElement().toBeFalsy();
		});

	}

}