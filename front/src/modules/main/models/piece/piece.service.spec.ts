import { TestModuleMetadata } from '@angular/core/testing';

import { Piece } from './piece';
import { Category, CategoryService } from '../category';
import { PieceService } from './piece.service';

import { ReorderableModelServiceTest }
	from '../reorderable.model.service.test.base';

import {
	testPieceData,
	ModelTestData,
	mergeModuleMetadata,
} from 'testing';



class PieceServiceTest extends ReorderableModelServiceTest<Piece> {

	constructor() {
		super(PieceService, Piece);
	}


	protected getModuleMetadata(): TestModuleMetadata {
		const defaultMetadata = super.getModuleMetadata();
		const extraMetadata = {providers: [CategoryService]};
		return mergeModuleMetadata(defaultMetadata, extraMetadata);
	}


	protected defineTests(): void {
		super.defineTests();
	}


	protected initTestData(): ModelTestData<Piece> {
		return testPieceData;
	}

}


new PieceServiceTest();
