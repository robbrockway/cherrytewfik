import { async } from '@angular/core/testing';

import { TableString } from './table.string';
import { TableStringService, StringTable } from './table.string.service';
import { ModelServiceTest } from '../model.service.test.base';

import {
	ModelTestData,
	ModelInstanceTestData,
	testTableStringData,
} from 'testing';


class TableStringServiceTest extends ModelServiceTest<TableString> {

	constructor() {
		super(TableStringService, TableString);
	}


	protected initTestData(): ModelTestData<TableString> {
		return testTableStringData;
	}


	protected defineTests(): void {
		super.defineTests();


		describe('.dict()', () => {

			let prepareListResponse: () => void;
			
			let checkDictIncludesTableString: (
				dict: any,
				instanceData: ModelInstanceTestData<TableString>
			) => void;


			it('should provide a value for every key', async(() => {
				prepareListResponse();

				this.tableStringService.dict().subscribe(
						(dict: StringTable) => {

					for(let instance of this.testData.instances) {
						checkDictIncludesTableString(dict, instance);
					}
				});
			}));


			prepareListResponse = () =>
				this.setMockResponseData(this.testData);


			// Should have a full TableString object in dictionary, with the appropriate key
			checkDictIncludesTableString = (
				dict: StringTable,
				instanceData: ModelInstanceTestData<TableString>
			) => {
				const key = instanceData.getTSValue('key');
				const tableString = dict[key];
				instanceData.checkModelInstanceMatches(tableString);
			};


			it('should call .lazyList()', () => {
				spyOn(this.tableStringService, 'lazyList').and.callThrough();
				this.tableStringService.dict();

				expect(this.tableStringService.lazyList)
					.toHaveBeenCalled();
			});

		});

	}


	protected get tableStringService(): TableStringService {
		return this.modelService as TableStringService;
	}

}


new TableStringServiceTest();