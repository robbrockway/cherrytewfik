import { TableString } from './table.string';
import { ModelTest } from '../model.test.base';

import {
	ModelTestData,
	testTableStringData,
} from 'testing';



class TableStringTest extends ModelTest<TableString> {

	constructor() {
		super(TableString);
	}


	protected initTestData(): ModelTestData<TableString> {
		return testTableStringData;
	}


	protected defineTests(): void {
		super.defineTests();

		it('should return key as PK', () => {
			expect(this.instance.pk).toBe(this.instance.key);
		});

	}

}


new TableStringTest();