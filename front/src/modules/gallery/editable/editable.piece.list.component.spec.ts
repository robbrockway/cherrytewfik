import { Component, Type } from '@angular/core';
import { TestModuleMetadata, fakeAsync } from '@angular/core/testing';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';

import {
	Piece,
	PieceService,
	ReorderableModelService,
} from 'modules/main/models';

import { EditableOrderedListComponentTest }
	from 'modules/staff/editable-ordered-list/editable.ordered.list.component.test.base';

import { OrderedListHostComponent }
	from 'modules/shared/static-ordered-list/static.ordered.list.component.test.base';

import { EditablePieceListComponent }
	from './editable.piece.list.component';

import { 
	testPieceData,
	testCategoryData,
	MockEditablePieceListItemDirective,
} from 'testing';



const categoryInstanceData = testCategoryData.instances[0];



@Component({
	template: `
		<editable-piece-list
			[(objects)]="objects"
			[category]="category"
			(load)="onLoad()"
		></editable-piece-list>
	`
})
class HostComponent extends OrderedListHostComponent<Piece> {

	category = categoryInstanceData.toModelInstance();

	constructor() {
		super(Piece, testPieceData);
	}

}



class EditablePieceListComponentTest
		extends EditableOrderedListComponentTest<Piece> {

	constructor() {
		super(
			EditablePieceListComponent,
			HostComponent,
			MockEditablePieceListItemDirective
		);
	}


	protected get modelType(): Type<Piece> {
		return Piece;
	}


	protected get modelServiceType(): Type<ReorderableModelService<any>> {
		return PieceService;
	}


	// Make sure newly-created objects belong to the right category
	protected get expectedPropertiesForNewObject(): any {
		return {category: this.hostComponent.category};
	}

}


new EditablePieceListComponentTest();
