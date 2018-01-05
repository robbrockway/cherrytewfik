// For testing OrderedListItemComponent subclasses

import { Type } from '@angular/core';

import { Subject } from 'rxjs/Subject';

import { GalleryModel } from 'modules/main/models';
import { OrderedListItemComponent } from './ordered.list.item.component';

import {
	SlowLoadingHostComponent,
	SlowLoadingComponentTest,
} from 'modules/shared/slow.loading.component.test.base';



export abstract class OrderedListItemHostComponent<T extends GalleryModel>
		extends SlowLoadingHostComponent {
	object: T;
	reorder$ = new Subject<any>();
	injectedText = 'Injected text';
}



export abstract class OrderedListItemComponentTest<T extends GalleryModel>
		extends SlowLoadingComponentTest {

	constructor(
		hostedComponentType: Type<OrderedListItemComponent<T>>,
		hostComponentType: Type<OrderedListItemHostComponent<T>>,
		testName?: string
	) {
		super(hostedComponentType, hostComponentType, testName);
	}


	protected get object(): T {
		return this.hostComponent.object;
	}

}