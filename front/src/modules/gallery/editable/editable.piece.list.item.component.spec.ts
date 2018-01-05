import { Component } from '@angular/core';
import { TestModuleMetadata } from '@angular/core/testing';

import { Piece } from 'modules/main/models';

import {
	EditableOrderedListItemHostComponent,
	EditableOrderedListItemComponentTest,
} from 'modules/staff/editable-ordered-list/editable.ordered.list.item.component.test.base';

import { EditablePieceListItemComponent }
	from './editable.piece.list.item.component';

import { SlowLoadingComponentTest }
	from 'modules/shared/slow.loading.component.test.base';

import {
	MockStaticPieceListItemDirective,
	testPieceData,
} from 'testing';



@Component({
	template: `
		<editable-piece-list-item
			[object]="object"
			[reorder$]="reorder$"
			(load)="onLoad()"
		>
			<span class="injectedContent">{{injectedText}}</span>
		</editable-piece-list-item>
	`,
})
class HostComponent extends EditableOrderedListItemHostComponent<Piece> {

	ngOnInit(): void {
		this.object = testPieceData.instances[0].toModelInstance();
	}

}



class EditablePieceListItemComponentTest
		extends EditableOrderedListItemComponentTest<Piece> {

	constructor() {
		super(
			EditablePieceListItemComponent,
			HostComponent,
			MockStaticPieceListItemDirective
		);
	}


	protected getModuleMetadata(): TestModuleMetadata {
		const metadata = super.getModuleMetadata();
		metadata.declarations.push(MockStaticPieceListItemDirective);
		return metadata;
	}


	protected defineTests(): void {
		super.defineTests();

		let setPieceToDeleting: () => void;


		beforeEach(() => {
			this.fixture.detectChanges();
		});


		it(`should inject 'Deleting...' message into `
				+ 'StaticPieceListItemComponent while piece is being deleted',
				() => {
			setPieceToDeleting();
			
			this.checkChildTextContentIs(
				'static-piece-list-item *:not(.injectedContent)',
				'Deleting...'
			);
		});


		setPieceToDeleting = () => {
			this.hostComponent.object.deleting = true;
			this.fixture.detectChanges();
		};

	}

}


new EditablePieceListItemComponentTest();