import { Type, Injector } from '@angular/core';
import { async } from '@angular/core/testing';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/catch';

import { Model } from './model';

import {
	FieldDescriptor,
	SingleObjectFieldDescriptor,
	MultiObjectFieldDescriptor,
} from './field-descriptors';

import { ModelService } from './model.service';
import { arrayXor, getStaticMember } from 'utils';

import {
	TestField,
	ModelTestData,
	getLinkedObjectsFromModelInstance,
	getDirectlyLinkedObjectsFromModelInstance,
	filterObjectByPropertyValues,
	getFirstPropertyName,
	getConstructorOf,
	spyOnIfNotAlready,
	getMostRecentCallArg,
	mockCachedObject,
} from 'testing';

import { getFirstItemWhere, isArray, removeFromArray } from 'utils';



export abstract class ModelTest<T extends Model> {

	private _testData: ModelTestData<T>;

	protected instance: T;
	protected mockCachedObject: any = {};


	constructor(
		protected modelType: Type<T>,
		testName: string = modelType.name
	) {
		describe(testName, () => this.defineTests());
	}


	protected defineTests(): void {

		const initialTestData = this.testData.instances[0];
		const changedTestData = this.testData.instances[1];
		const changedProperties = changedTestData.toDictOfTSValues();

		let mockService: ModelService<T>;

		let createNewInstanceWithSingleProperty: (
			propertyName: string,
			propertyValue: any
		) => T;

		let getPropertyNames: () => string[];


		beforeEach(() => {
			const mockServiceMethodReturnValues = {
				update: Observable.of(changedProperties),
				destroy: Observable.of(null),
				updateCache: null,
				getFromCache: mockCachedObject,
			};

			mockService = jasmine.createSpyObj(
				'mockService',
				mockServiceMethodReturnValues
			);

			this.instance = initialTestData.toModelInstance(mockService);
		});


		it('should initialise', () => {
			expect(this.instance).toBeTruthy();
		});


		it('should have .isStub === false by default', () => {
			expect(this.instance.isStub).toBe(false);
		});


		it('should have .deleting === false by default', () => {
			expect(this.instance.deleting).toBe(false);
		});


		it('should return appropriate field as PK', () => {
			const pk = null;
			this.instance[this.instance.pkName] = pk;
			expect(this.instance.pk).toBe(pk);
		});


		it('should write to appropriate field as PK', () => {
			const newPK = null;
			this.instance.pk = newPK;

			const actualPKFieldValue = 
				this.instance[this.instance.pkName];

			expect(actualPKFieldValue).toBe(newPK);
		});


		describe('.update()', () => {

			it('should pass data to ModelService.update()', () => {
				this.instance.update(changedProperties);

				expect(
					mockService.update
				).toHaveBeenCalledWith(
					this.instance.pk,
					changedProperties
				);
			});


			it('should return Observable of updated data', async(() => {

				this.instance.update(changedProperties)
						.subscribe((dataFromUpdate: any) => {
					
					expect(dataFromUpdate).toEqual(
						jasmine.objectContaining(changedProperties)
					);
				});

			}));

		});


		describe('.delete()', () => {

			let doDeletion: () => void;
			let makeDeletionFail: () => void;
			let getLinkedObjectsWithSpies: () => Set<Model>;


			it('should call ModelService.delete()', () => {
				this.instance.delete();
				expect(mockService.destroy).toHaveBeenCalled();
			});


			it('should set .deleting to true', () => {
				this.instance.delete();
				expect(this.instance.deleting).toBe(true);
			});


			describe('should set .deleting back to false', () => {

				it('when deletion succeeds', async(() => {
					doDeletion();
				}));


				it('when deletion fails', async(() => {
					makeDeletionFail();
					doDeletion();
				}));


				afterEach(() => {
					expect(this.instance.deleting).toBe(false);
				});

			});


			doDeletion = () => {
				const onSuccess = null, onError = () => {};
				this.instance.delete().subscribe(onSuccess, onError);
			};


			makeDeletionFail = () => {
				spyOnIfNotAlready(mockService, 'destroy').and.returnValue(
					Observable.throw('Error')
				);
			};


			it('should remove reverse links from linked objects',
					async(() => {
				const linkedObjects = getLinkedObjectsWithSpies();

				doDeletion();

				linkedObjects.forEach((object: Model) => {
					const callArg =
						getMostRecentCallArg(object.removeReferenceTo);

					expect(callArg).toBe(this.instance);
				});
			}));


			getLinkedObjectsWithSpies = () => {
				const linkedObjects =
					getDirectlyLinkedObjectsFromModelInstance(this.instance);

				linkedObjects.forEach((object: Model) =>
					spyOn(object, 'removeReferenceTo')
				);

				return linkedObjects;
			};


			it(`shouldn't remove reverse links if deletion fails`,
					async(() => {
				const linkedObjects = getLinkedObjectsWithSpies();

				makeDeletionFail();
				doDeletion();

				linkedObjects.forEach((object: Model) =>
					expect(object.removeReferenceTo).not.toHaveBeenCalled()
				);
			}));

		});


		describe('.cache()', () => {

			it('should call .updateCache() on the appropriate '
					+ 'service, with self as argument', () => {
				
				this.instance.cache();
				
				expect(mockService.updateCache)
					.toHaveBeenCalledWith(this.instance);
			});

		});


		describe('.setProperties()', () => {

			let getChangedPropertiesWithOneUndefined: (
				undefinedPropertyName: string
			) => any;


			it('should assign all defined properties to object', () => {
				this.instance.setProperties(changedProperties);

				const definedProperties = filterObjectByPropertyValues(
					changedProperties,
					(property: any) => property !== undefined
				);

				expect(this.instance).toEqual(
					jasmine.objectContaining(definedProperties)
				);
			});


			it(`shouldn't assign undefined values to object`, () => {
				const undefinedPropertyName =
					getFirstPropertyName(changedProperties);

				const initialPropertyValue =
					this.instance[undefinedPropertyName];

				const properties = 
					getChangedPropertiesWithOneUndefined(
						undefinedPropertyName
					);

				this.instance.setProperties(properties);

				// Check value hasn't changed
				expect(this.instance[undefinedPropertyName])
					.toBe(initialPropertyValue);
			});


			getChangedPropertiesWithOneUndefined = (
				undefinedPropertyName: string
			) => {
				const properties = Object.assign({}, changedProperties);
				properties[undefinedPropertyName] = undefined;
				return properties;
			};


			this.defineTestForSingleLinkedObjectField(
					'should remove reverse link from old linked object',
					(
						fieldName: string,
						linkedObject: Model,
						reverseLinkName: string
					) => {
				
				spyOn(linkedObject, 'removeReferenceTo');
				const properties = {[fieldName]: linkedObject};
				this.instance.setProperties(properties);
				
				expect(linkedObject.removeReferenceTo)
					.toHaveBeenCalledWith(this.instance, reverseLinkName);
			});


			this.defineTestForSingleLinkedObjectField(
					'should add reverse link to new linked object',
					(
						fieldName: string,
						linkedObject: Model,
						reverseLinkName: string
					) => {

				spyOn(linkedObject, 'addReferenceTo');
				const properties = {[fieldName]: linkedObject};
				this.instance.setProperties(properties);

				expect(linkedObject.addReferenceTo)
					.toHaveBeenCalledWith(this.instance, reverseLinkName);
			});

		});


		describe('.removeReferenceTo()', () => {

			// These tests shouldn't run for every single model type; only for those that have single- and multi-linked-object fields

			this.defineTestForSingleLinkedObjectField(
					'should set single-linked-object field value to null',
					(fieldName: string, initialLinkedObject: Model) => {
				
				this.instance.removeReferenceTo(
					initialLinkedObject,
					fieldName
				);

				expect(this.instance[fieldName]).toBe(null);
			});


			this.defineTestForMultiLinkedObjectField(
					'should remove object from multi-linked-object '
					+ `field's list`,
					(fieldName: string, linkedObjectList: Model[]) => {

				const objectToRemove = linkedObjectList[0];

				this.instance.removeReferenceTo(
					objectToRemove,
					fieldName
				);

				expect(linkedObjectList).not.toContain(objectToRemove);
			});

		});


		describe('.addReferenceTo()', () => {

			this.defineTestForSingleLinkedObjectField(
					'should make single-linked-object field refer to new '
					+ 'object',
					(fieldName: string, initialLinkedObject: Model) => {

				this.instance[fieldName] = null;	// Clear a space to reinsert the object
				
				this.instance.addReferenceTo(
					initialLinkedObject,
					fieldName
				);

				expect(this.instance[fieldName]).toBe(initialLinkedObject);
			});


			this.defineTestForMultiLinkedObjectField(
					`should add new object to multi-linked-object field's `
					+ 'list',
					(fieldName: string, linkedObjectList: Model[]) => {

				const objectToAdd = linkedObjectList[0];

				// Clear a space
				removeFromArray(linkedObjectList, objectToAdd);

				this.instance.addReferenceTo(objectToAdd, fieldName);
				expect(linkedObjectList).toContain(objectToAdd);
			});


			this.defineTestForMultiLinkedObjectField(
					`shouldn't add new object to multi-linked-object `
					+ `field's list if it's already there`,
					(fieldName: string, linkedObjectList: Model[]) => {

				const initialListLength = linkedObjectList.length;

				this.instance.addReferenceTo(
					linkedObjectList[0],
					fieldName
				);

				expect(linkedObjectList.length).toBe(initialListLength);
			});

		});


		describe('.toDict()', () => {

			let checkDictMatchesKeyNames: (
				dict: any,
				expectedKeys: string[]
			) => void;


			it('should return dictionary of correct values', () => {
				const dict = this.instance.toDict();
				const expectedKeys = getPropertyNames();
				checkDictMatchesKeyNames(dict, expectedKeys);
			});


			checkDictMatchesKeyNames = (
				dict: any,
				expectedKeys: string[]
			) => {
				for(let key of expectedKeys) {
					expect(dict[key])
						.toEqual(this.instance[key]);
				}
			};

		});


		getPropertyNames = () => {
			return this.fieldDescriptors.map(
				(fieldDescriptor: FieldDescriptor) =>
					fieldDescriptor.tsName
			);
		};


		describe('.getCachedVersion()', () => {

			it(`should return object from service's cache `
					+ 'with same PK', () => {

				const cachedVersion = this.instance.getCachedVersion();
				expect(cachedVersion).toBe(mockCachedObject);
				
				expect(mockService.getFromCache)
					.toHaveBeenCalledWith(this.instance.pk);
			});

		});


		describe('.hasValueForOneOf()', () => {

			let propertyNames: string[];


			beforeEach(() => {
				// PK is left intact
				propertyNames = getPropertyNames().filter(
					(name: string) => 
						name !== this.instance.pkName
				);

				// Other properties are nullified
				for(let propertyName of propertyNames)
					this.instance[propertyName] = null;
			});


			it('should return false if no values exist', () => {
				expect(this.instance.hasValueForOneOf(...propertyNames))
					.toBe(false);
			});


			it('should return true if one value exists', () => {
				propertyNames.push(this.instance.pkName);	// Include PK this time

				expect(this.instance.hasValueForOneOf(...propertyNames))
					.toBe(true);
			});

		});


		it('should supply same value for static and dynamic '
				+ 'versions of .pkName', () => {

			const staticName = getStaticMember(this.modelType, 'pkName');
			const dynamicName = this.instance.pkName;
			expect(dynamicName).toBe(staticName);
		});

	}


	protected get testData(): ModelTestData<T> {
		this._testData = this._testData
			|| this.initTestData();

		return this._testData;
	}


	// Could return a reference to a dataset defined in testing/data/datasets.ts, or some kind of altered copy of one; this will be cached for later recall
	protected abstract initTestData(): ModelTestData<T>;


	// Defines an optional test, which will only run if the model being tested has at least one single-linked-object field.	
	private defineTestForSingleLinkedObjectField(
		description: string,
		testFunc: (
			fieldName: string,
			initialLinkedObject: Model,
			reverseLinkName: string
		) => void
	): void {

		const fieldDescriptor = this.singleObjectFieldDescriptor;

		if(fieldDescriptor) {
			it(description, () => {
				const fieldName = fieldDescriptor.tsName;
				const initialLinkedObject = this.instance[fieldName];
				const reverseLinkName = fieldDescriptor.correspondingTSName;
				testFunc(fieldName, initialLinkedObject, reverseLinkName);
			});
		}
	}


	// Null, if model has no SingleObjectFieldDescriptor fields
	private get singleObjectFieldDescriptor(
	): SingleObjectFieldDescriptor<any> {

		return getFirstItemWhere(
			this.fieldDescriptors,
			(fieldDescriptor: FieldDescriptor) =>
				fieldDescriptor instanceof SingleObjectFieldDescriptor
		) as SingleObjectFieldDescriptor<any>;
	}


	private get fieldDescriptors(): FieldDescriptor[] {
		return getStaticMember(this.modelType, 'fieldDescriptors');
	}


	// Test will only run if model has at least one multi-linked-object field
	private defineTestForMultiLinkedObjectField(
		description: string,
		testFunc: (
			fieldName: string,
			linkedObjectList: Model[],
			reverseLinkName: string
		) => void
	): void {

		const fieldDescriptor = this.multiObjectFieldDescriptor;

		if(fieldDescriptor) {
			it(description, () => {
				const fieldName = fieldDescriptor.tsName;
				const linkedObjectList = this.instance[fieldName];
				const reverseLinkName = fieldDescriptor.correspondingTSName;
				testFunc(fieldName, linkedObjectList, reverseLinkName);
			});
		}
	}


	private get multiObjectFieldDescriptor(
	): MultiObjectFieldDescriptor<any> {

		return getFirstItemWhere(
			this.fieldDescriptors,
			(fieldDescriptor: FieldDescriptor) =>
				fieldDescriptor instanceof MultiObjectFieldDescriptor
		);
	}

}
