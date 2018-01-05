import { Component } from '@angular/core';
import { TestModuleMetadata } from '@angular/core/testing';

import { Piece } from 'modules/main/models';
import { StaticPieceListComponent } from './static.piece.list.component';

import {
	StaticOrderedListComponentTest,
	OrderedListHostComponent,
} from 'modules/shared/static-ordered-list/static.ordered.list.component.test.base';

import {
	MockStaticPieceListItemDirective,
	testPieceData,
} from 'testing';



@Component({
	template: `
		<static-piece-list
			[(objects)]="objects"
			(load)="onLoad()"
		></static-piece-list>
	`,
})
class HostComponent extends OrderedListHostComponent<Piece> {

	constructor() {
		super(Piece, testPieceData);
	}

}



class StaticPieceListComponentTest
		extends StaticOrderedListComponentTest<Piece> {

	constructor() {
		super(
			StaticPieceListComponent,
			HostComponent,
			MockStaticPieceListItemDirective
		);
	}

}


new StaticPieceListComponentTest();
