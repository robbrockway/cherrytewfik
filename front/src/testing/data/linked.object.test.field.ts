// Linked objects, e.g. Piece.category, require a whole ModelInstanceTestData each. This type of field stores and relates to that data.


import { Type } from '@angular/core';

import { Model } from 'modules/main/models';

import { LinkedObjectTestFieldBase }
	from './linked.object.test.field.base';

import { ModelTestData } from './model.test.data';
import { ModelInstanceTestData } from './model.instance.test.data';



export class LinkedObjectTestField<T extends Model>
		extends LinkedObjectTestFieldBase {

	constructor(
		tsName: string,
		protected objectData: ModelInstanceTestData<T>,
		restName?: string
	) {
		super(tsName, restName);
	}


	static createEmpty<U extends Model>(
		tsName: string,
		modelType: Type<U>,
		restName?: string
	): LinkedObjectTestField<U> {
		const objectData = new ModelInstanceTestData(modelType);
		return new LinkedObjectTestField(tsName, objectData, restName);
	}


	getTSValueStub(): T {
		return this.objectData.toModelInstanceStub();
	}


	getFullTSValue(newLinkDepth: number): T {
		return this.objectData.toModelInstance(
			undefined,	// default ModelService
			newLinkDepth
		);
	}


	getRestValueStub(): number | string {
		return this.objectData.pk;
	}


	getFullRestValue(newLinkDepth: number): any {
		return this.objectData.toDictOfRestValues(newLinkDepth);
	}


	checkTSValueStubIs(instance: T): void {
		this.objectData.checkModelInstanceHasCorrectPK(instance);
	}


	checkFullTSValueIs(instance: T, newLinkDepth: number): void {
		this.objectData.checkObjectHasCorrectTSValues(
			instance,
			newLinkDepth
		);
	}


	checkRestValueStubIs(pk: number | string): void {
		expect(pk).toBe(this.objectData.pk);
	}


	checkFullRestValueIs(dict: any, newLinkDepth: number): void {
		this.objectData.checkObjectHasCorrectRestValues(
			dict,
			newLinkDepth
		);
	}

}