// Fields that link to multiple objects, e.g. Category.pieces, require a whole ModelTestData instance to define their values. This is stored in, and dealt with by, the following field type.


import { Type } from '@angular/core';

import { Model } from 'modules/main/models';

import { LinkedObjectTestFieldBase }
	from './linked.object.test.field.base';

import { ModelTestData } from './model.test.data';



export class MultiLinkedObjectTestField<T extends Model>
		extends LinkedObjectTestFieldBase {

	constructor(
		tsName: string,
		protected dataset: ModelTestData<T>,
		restName?: string
	) {
		super(tsName, restName);
	}


	static createEmpty<T extends Model>(
		tsName: string,
		modelType: Type<T>,
		restName?: string
	): MultiLinkedObjectTestField<T> {
		const dataset = new ModelTestData(modelType);
		return new MultiLinkedObjectTestField(tsName, dataset, restName);
	}


	getTSValueStub(): T[] {
		return this.dataset.toListOfModelInstanceStubs();
	}


	getFullTSValue(newLinkDepth: number): T[] {
		return this.dataset.toListOfModelInstances(
			undefined,	// default ModelService
			newLinkDepth
		);
	}


	getRestValueStub(): (string | number)[] {
		return this.dataset.toListOfPKs();
	}


	getFullRestValue(newLinkDepth: number): any[] {
		return this.dataset.toListOfRestDicts(newLinkDepth);
	}


	// The 'stub' is, in this case, actually a list of stub objects
	checkTSValueStubIs(listOfModelInstanceStubs: T[]): void {
		this.dataset.checkModelInstancesInListHaveCorrectPKs(
			listOfModelInstanceStubs
		);
	}


	// and, here, the 'value' is a list of full model instances
	checkFullTSValueIs(
		listOfModelInstances: T[],
		newExpectedLinkDepth: number
	): void {
		this.dataset.checkObjectsInListHaveCorrectTSValues(
			listOfModelInstances,
			newExpectedLinkDepth
		);
	}


	checkRestValueStubIs(expectedListOfPKs: (number | string)[]): void {
		const actualListOfPKs = this.dataset.toListOfPKs();
		expect(actualListOfPKs).toEqual(expectedListOfPKs);
	}


	checkFullRestValueIs(listOfRestDicts: any[]): void {
		this.dataset.checkObjectsInListHaveCorrectRestValues(
			listOfRestDicts
		);
	}

}