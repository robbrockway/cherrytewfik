// An entire dataset for testing a model; includes data for several different instances of the model.


import { Type } from '@angular/core';

import { Model, ModelService } from 'modules/main/models';

import { ModelInstanceTestData } from './model.instance.test.data';
import { TestField } from './test.field';
import { LinkedObjectTestField } from './linked.object.test.field';
import { forEachPair, getSortedCopy } from '../utils';
import { isArray, getStaticMember } from 'utils';



type ModelInstanceDefinition<T extends Model>
	= ModelInstanceTestData<T> | TestField[];



export class ModelTestData<T extends Model> {
	
	instances: ModelInstanceTestData<T>[];


	constructor(
		protected modelType: Type<T>,
		public defaultLinkDepth: number = 0,
		fields: ModelInstanceDefinition<T>[] = []
	) {

		this.instances = this.createInstanceList(fields);
	}


	// Converts arrays of TestFields to single ModelInstanceTestData's, en masse
	private createInstanceList(
		fields: ModelInstanceDefinition<T>[]
	): ModelInstanceTestData<T>[] {

		return fields.map(
				(instance: ModelInstanceDefinition<T>) => {

			if(isArray(instance)) {
				// Needs converting
				const instanceFields = instance as TestField[];

				return new ModelInstanceTestData(
					this.modelType,
					this.defaultLinkDepth,
					instanceFields
				);
			}
			
			// Else, no need to convert
			return instance as ModelInstanceTestData<T>;

		});
	}


	getSubset(
		startInstanceIndex: number,
		endInstanceIndex: number
	): ModelTestData<T> {

		return new ModelTestData(
			this.modelType,
			this.defaultLinkDepth,
			this.instances.slice(startInstanceIndex, endInstanceIndex)
		);
	}


	// Returns a copy, with order of instances reversed
	getInReverse(): ModelTestData<T> {
		const copyOfInstanceList =
			Array.from(this.instances);

		return new ModelTestData(
			this.modelType,
			this.defaultLinkDepth,
			copyOfInstanceList.reverse()
		);
	}


	// Takes an array of fields – one per instance – and tacks them on the ends. First field goes to first instance, second to second, etc.
	unzipAndAddFields(fields: TestField[]): void {
		forEachPair(
			this.instances,
			fields,
			(instance: ModelInstanceTestData<T>, field: TestField) =>
				instance.addField(field)
		);
	}


	// Adds a LinkedObjectField with the given name to each instance, linking it to the corresponding object in the provided array – first instance to first linked object, etc.
	unzipAndAddLinkedObjects(
		fieldTSName: string,
		linkedObjects: ModelInstanceTestData<any>[],
		fieldRestName?: string
	): void {
		
		const addLinkedObjectToInstance = (
			instance: ModelInstanceTestData<T>,
			linkedObject: ModelInstanceTestData<any>
		) => {
			
			const field = new LinkedObjectTestField(
				fieldTSName,
				linkedObject,
				fieldRestName
			);

			instance.addField(field);
		};

		forEachPair(
			this.instances,
			linkedObjects,
			addLinkedObjectToInstance
		);
	}


	// See ModelInstanceTestData for info on linkDepth
	toListOfModelInstances(
		modelService?: ModelService<T>,
		linkDepth: number = this.defaultLinkDepth
	): T[] {
		return this.instances.map(
			(instance: ModelInstanceTestData<T>) =>
				instance.toModelInstance(modelService, linkDepth)
		);
	}


	toListOfModelInstanceStubs(
		modelService?: ModelService<T>
	): T[] {
		return this.instances.map(
			(instance: ModelInstanceTestData<T>) =>
				instance.toModelInstanceStub(modelService)
		);
	}


	toListOfTSDicts(
		linkDepth: number = this.defaultLinkDepth
	): any[] {
		return this.instances.map(
			(instance: ModelInstanceTestData<T>) =>
				instance.toDictOfTSValues(linkDepth)
		);
	}


	toListOfRestDicts(
		linkDepth: number = this.defaultLinkDepth
	): any[] {
		return this.instances.map(
			(instance: ModelInstanceTestData<T>) =>
				instance.toDictOfRestValues(linkDepth)
		);
	}


	toListOfPKs(): (number | string)[] {
		return this.instances.map(
			(instance: ModelInstanceTestData<T>) => instance.pk
		);
	}


	toJson(
		linkDepth: number = this.defaultLinkDepth
	): string {
		return JSON.stringify(
			this.toListOfRestDicts(linkDepth)
		);
	}


	checkModelInstancesMatch(
		instances: T[],
		expectedLinkDepth: number = this.defaultLinkDepth
	): void {

		for(let instance of instances) {
			expect(instance instanceof this.modelType)
				.toBeTruthy();
		}

		this.checkObjectsInListHaveCorrectTSValues(
			instances,
			expectedLinkDepth
		);
	}


	checkObjectsInListHaveCorrectTSValues(
		objects: any[],
		expectedLinkDepth: number = this.defaultLinkDepth
	): void {

		const sortedObjects = this.getObjectsSortedByPK(objects);

		const check = (
			testData: ModelInstanceTestData<T>,
			object: any
		) =>
			testData.checkObjectHasCorrectTSValues(
				object,
				expectedLinkDepth
			);

		forEachPair(this.instancesSortedByPK, sortedObjects, check);
	}


	protected getObjectsSortedByPK(objects: any[]): any[] {
		return getSortedCopy(
			objects,
			(a: any, b: any) =>
				a[this.pkName] < b[this.pkName] ? -1 : 1	// Put a before b if negative
		);
	}


	protected get pkName(): string {
		return getStaticMember(this.modelType, 'pkName');
	}


	protected get instancesSortedByPK(): ModelInstanceTestData<T>[] {
		return getSortedCopy(
			this.instances,
			(a: ModelInstanceTestData<T>, b: ModelInstanceTestData<T>) =>
				a.pk < b.pk ? -1 : 1
		);
	}


	checkObjectsInListHaveCorrectRestValues(
		objects: any[],
		expectedLinkDepth: number = this.defaultLinkDepth
	): void {

		const check = (
			testData: ModelInstanceTestData<T>,
			object: any
		) =>
			testData.checkObjectHasCorrectRestValues(
				object,
				expectedLinkDepth
			);

		forEachPair(this.instances,	objects, check);
	}


	checkModelInstancesInListHaveCorrectPKs(
		objects: T[],
		expectedLinkDepth: number = this.defaultLinkDepth
	): void {

		const check = (
			testData: ModelInstanceTestData<T>,
			object: T
		) =>
			testData.checkModelInstanceHasCorrectPK(object);

		forEachPair(this.instances,	objects, check);
	}

}



export function isTestData(data: any): boolean {
	return data instanceof ModelTestData
		|| data instanceof ModelInstanceTestData;
}