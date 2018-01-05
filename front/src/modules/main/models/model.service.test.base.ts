// Abstract base for testing ModelService subclasses. Write a subclass of ModelServiceTestBase, then construct an instance, and your tests will run.

import { Type } from '@angular/core';

import {
	TestBed,
	TestModuleMetadata,
	async,
	inject,
} from '@angular/core/testing';

import {
	HttpModule,
	XHRBackend,
	Request,
	RequestMethod,
	Response,
	ResponseOptions,
	ResponseOptionsArgs,
} from '@angular/http';

import { MockBackend, MockConnection } from '@angular/http/testing';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/empty';

import { Model } from './model';
import { ModelService } from './model.service';

import { flatten2DArray, forEachProperty } from 'utils';

import {
	HttpServiceTest,
	TestField,
	ModelTestData,
	ModelInstanceTestData,
	isTestData,
	getDirectlyLinkedObjectsFromModelInstance,
	getLinkedObjectsFromModelInstance,
	getModelInstancesFromDict,
	checkModelInstanceHasPropertiesOfOther,
	mockCachedObject,
	createResponse,
	isInArray,
	getMostRecentCallArg,
	isSpy,
	filterObjectByPropertyValues,
} from 'testing';



export abstract class ModelServiceTest<T extends Model>
		extends HttpServiceTest<ModelService<T>> {

	private _testData: ModelTestData<T>;


	constructor(
		serviceType: Type<ModelService<T>>,
		protected modelType: Type<T>,
		testName: string = serviceType.name
	) {
		super(serviceType, testName);
	}


	protected defineTests(): void {
		super.defineTests();

		const initialTestData = this.testData.instances[0];
		const pk = initialTestData.pk;

		let checkObjectMatchesCachedProperties: (object: T) => void;

		let checkObjectIsSameInstanceAsInCache: (
			object: Model
		) => void;

		let checkObjectIsCachedAfterOperation: (
			doOperation: () => Observable<T>
		) => void;

		let checkCachedCopiesOfLinkedObjectsHaveBeenRetrieved: (
			instance: T
		) => void;

		let checkCachedInstanceIsReturnedByOperation: (
			doOperation: () => Observable<T>
		) => void;

		let checkObjectIsValid: (object: T) => void;

		let createModelInstance: (
			testData?: ModelInstanceTestData<T>
		) => T;
		
		let stopLinkedObjectsFromStubbingThemselves: (
			mainObject: Model | any
		) => void;

		let stopModelInstanceFromStubbingItself: (
			instance: Model
		) => void;
		
		let getObjectFromCache: (pk: number | string) => Observable<T>;

		let createModelDict: (
			testData?: ModelInstanceTestData<T>
		) => any;



		describe('.lazyList()', () => {

			beforeEach(() => {
				this.modelService.cache = [];
			});


				it('should defer to .list() if cache is empty', () => {
					const listReturnValue = Observable.empty();

					spyOn(this.modelService, 'list')
					.and.returnValue(listReturnValue);

				expect(this.modelService.lazyList())
					.toBe(listReturnValue);
			});


			it('should return copy of whole cache, if it contains any '
					+ 'items', done => {
				const mockCachedObject = {} as T;
				this.modelService.cache.push(mockCachedObject);

				this.modelService.lazyList().subscribe((objects: T[]) => {
					expect(objects).toEqual(this.modelService.cache);
					
					// Objects should be exact same instances as in cache
					expect(objects[0]).toBe(mockCachedObject);

					// but list itself should be a copy
					expect(objects).not.toBe(this.modelService.cache);

					done();
				});
			});

		});



		describe('.list()', () => {

			let prepareListResponse: () => void;
			
			let testEachListedObject: (
				testFunc: (object: T) => void
			) => void;


			it('should send correct HTTP request', done => {
				prepareListResponse();

				this.watchForRequest(
					RequestMethod.Get,
					null,
					null,
					done
				);

				this.modelService.list();
			});


			prepareListResponse = () =>
				this.setMockResponseData(this.testData);


			it('should return Observable of correct list of objects',
					async(() => {
				prepareListResponse();
				
				this.modelService.list().subscribe((objects: T[]) => {
					this.testData.checkModelInstancesMatch(objects);
				});
			}));
			

			it('should cache the objects', async(() => {
				prepareListResponse();
				spyOn(this.modelService, 'updateCache').and.callThrough();
				testEachListedObject(checkObjectMatchesCachedProperties);
			}));


			testEachListedObject = (testFunc: (object: T) => void) => {
				this.modelService.list().subscribe((objects: T[]) => {
					for(let object of objects)
						testFunc(object);
				});
			};


			it('should refer to same instances as those in cache', 
					async(() => {
				prepareListResponse();
				testEachListedObject(checkObjectIsSameInstanceAsInCache);
			}));


			it('should refer to same linked objects as those in cache',
					async(() => {
				prepareListResponse();

				testEachListedObject(
					checkCachedCopiesOfLinkedObjectsHaveBeenRetrieved
				);
			}));


			it('should throw error on failure', 
				this.testRequestThrowsErrorOnFailure(() =>
					this.modelService.list()
				)
			);

		});



		// But isn't necessarily the same copy as in cache; just needs identical properties
		checkObjectMatchesCachedProperties = (object: T) => {
			const expectedProperties = object.toDict();
			
			expect(this.modelService.updateCache).toHaveBeenCalledWith(
				jasmine.objectContaining(expectedProperties)
			);
		};


		// In this case, must be the same copy
		checkObjectIsSameInstanceAsInCache = (object: Model) => {
			const cachedVersion = object.getCachedVersion();

			if(cachedVersion)
				// Unusual syntax, lest we hit a Jasmine bug
				expect(object === cachedVersion).toBeTruthy();
		};


		// Testing whether linked objects are actually consistent with (same instance as) their cached copies is difficult without mocking up a whole lot of different model services in detail. More a job for e2e? This, at least, checks that the cache has been accessed, and tests for genuine consistency where a real model service (this one!) is available
		checkCachedCopiesOfLinkedObjectsHaveBeenRetrieved = (
			instance: T
		) => {
			const linkedObjects =
				getLinkedObjectsFromModelInstance(instance);

			linkedObjects.forEach((linkedObject: Model) => {
				const getter = linkedObject.modelService.getFromCache;
				const isUsingMockService = isSpy(getter);

				if(isUsingMockService)
					expect(getter).toHaveBeenCalledWith(linkedObject.pk);
				else
					checkObjectIsSameInstanceAsInCache(linkedObject);
			});
		};



		describe('.create()', () => {

			const dataForCreation = initialTestData.toDictOfTSValues();

			let prepareCreationResponse: () => void;


			it('should send correct HTTP request', done => {
				prepareCreationResponse();

				this.watchForRequest(
					RequestMethod.Post,
					null,
					initialTestData,
					done
				);

				this.modelService.create(dataForCreation);
			});


			prepareCreationResponse = () =>
				this.setMockResponseData(initialTestData, 201);


			it('should return Observable of correct object', async(() => {
				prepareCreationResponse();

				this.modelService.create(dataForCreation)
					.subscribe(checkObjectIsValid);
			}));


			it('should cache the object', async(() => {
				prepareCreationResponse();
				
				checkObjectIsCachedAfterOperation(
					() => this.modelService.create(dataForCreation)
				);
			}));


			it('should return same instance as is in cache', async(() => {
				prepareCreationResponse();

				checkCachedInstanceIsReturnedByOperation(
					() => this.modelService.create(dataForCreation)
				);
			}));


			it('should throw error on failure', 
				this.testRequestThrowsErrorOnFailure(() =>
					this.modelService.create(dataForCreation)
				)
			);

		});



		// doOperation() should call some sort of CRUD function
		checkObjectIsCachedAfterOperation = (
			doOperation: () => Observable<T>
		) => {
			spyOn(this.modelService, 'updateCache').and.callThrough();
			doOperation()
				.do(checkCachedCopiesOfLinkedObjectsHaveBeenRetrieved)
				.subscribe(checkObjectMatchesCachedProperties);
		};


		// Makes sure we're returned the actual instance that's now in cache, rather than a carbon copy
		checkCachedInstanceIsReturnedByOperation = (
			doOperation: () => Observable<T>
		) => {
			doOperation().subscribe(checkObjectIsSameInstanceAsInCache);
		};



		// Suitable as an observer of .create() and .retrieve() operations
		checkObjectIsValid = (object: T) => {
			initialTestData.checkModelInstanceMatches(object);
		};



		describe('.lazyRetrieve()', () => {

			let object: T;
			let callLazyRetrieveAndCheckForCorrectReturnValue: () => void;


			beforeEach(() => {
				object = createModelInstance();
			});


			it('should return cached data if available', async(() => {
				spyOn(this.modelService, 'getFromCache')
					.and.returnValue(object);

				callLazyRetrieveAndCheckForCorrectReturnValue();

				expect(this.modelService.getFromCache)
					.toHaveBeenCalledWith(object.pk);
			}));


			it('should defer to .retrieve() in the '
					+ 'absence of cached data', async(() => {
				
				spyOn(this.modelService, 'retrieve')
					.and.returnValue(Observable.of(object));

				callLazyRetrieveAndCheckForCorrectReturnValue();

				expect(this.modelService.retrieve)
					.toHaveBeenCalledWith(object.pk);
			}));


			callLazyRetrieveAndCheckForCorrectReturnValue = () => {
				this.modelService.lazyRetrieve(object.pk).subscribe(
					(returnedObject: T) =>
						expect(returnedObject).toBe(object)
				);
			};

		});



		createModelInstance = (
			testData: ModelInstanceTestData<T> = initialTestData
		) => {
			const instance = testData.toModelInstance(this.modelService);
			stopLinkedObjectsFromStubbingThemselves(instance);
			return instance;
		};


		// After caching the properties of linked objects, our main object tries to reduce duplication by replacing these objects with their cached counterparts which, for testing purposes, will just be stubs. Here this is prevented.
		stopLinkedObjectsFromStubbingThemselves = (
			mainObject: Model | any
		) => {

			forEachProperty(mainObject, (key: string, value: any) => {
				if(value instanceof Model)
					stopModelInstanceFromStubbingItself(value);
			});
		};


		stopModelInstanceFromStubbingItself = (instance: Model) => {
			// Replace the object with its own self, rather than with the stub given by a mock service
			spyOn(instance, 'getCachedVersion').and.returnValue(instance);
		};

	

		describe('.retrieve()', () => {

			let prepareRetrievalResponse: () => void;


			it(`should send correct HTTP request`, done => {
				prepareRetrievalResponse();
				this.watchForRequest(RequestMethod.Get, pk, null, done);
				this.modelService.retrieve(pk);
			});


			prepareRetrievalResponse = () =>
				this.setMockResponseData(initialTestData);


			it('should return Observable of correct object', async(() => {
				prepareRetrievalResponse();

				this.modelService.retrieve(pk)
					.subscribe(checkObjectIsValid);
			}));


			it('should cache the object', async(() => {
				prepareRetrievalResponse();

				checkObjectIsCachedAfterOperation(
					() => this.modelService.retrieve(pk)
				);
			}));


			it('should return same instance as is in cache', async(() => {
				prepareRetrievalResponse();

				checkCachedInstanceIsReturnedByOperation(
					() => this.modelService.retrieve(pk)
				);
			}));


			it('should throw error on failure', 
				this.testRequestThrowsErrorOnFailure(() =>
					this.modelService.retrieve(pk)
				)
			);

		});



		describe('.update()', () => {

			const changedTestData = this.testData.instances[1];
			
			// Data to pass to .update(), before conversion into REST/server format
			const dataForUpdate =
				changedTestData.toDictOfWritableTSValues();

			let instance: T;

			let prepareUpdateResponse: () => void;
			let doUpdate: () => Observable<any>;


			beforeEach(() => {
				instance = initialTestData.toModelInstance();
				this.modelService.updateCache(instance);
			});


			it('should send correct HTTP request', done => {
				const expectedData =
					changedTestData.toDictOfWritableRestValues(0);

				this.watchForRequest(
					RequestMethod.Patch,
					pk,
					expectedData,
					done
				);

				doUpdate();
			});


			doUpdate = () =>
				this.modelService.update(pk, dataForUpdate);


			it('should emit Observable of updated data', done => {
				prepareUpdateResponse();

				doUpdate().subscribe((dataFromUpdate: any) => {
					changedTestData.checkObjectHasCorrectTSValues(
						dataFromUpdate
					);

					done();
				});
			});


			prepareUpdateResponse = () =>
				this.setMockResponseData(changedTestData);


			it('should update object with new properties', done => {
				prepareUpdateResponse();
				spyOn(instance, 'setProperties');

				doUpdate().subscribe((dataFromUpdate: any) => {
					expect(instance.setProperties)
						.toHaveBeenCalledWith(dataFromUpdate);

					done();
				});
			});


			it('should throw error on failure', 
				this.testRequestThrowsErrorOnFailure(() =>
					this.modelService.update(pk, dataForUpdate)
				)
			);


			it('should emit updated instance through .update$', done => {
				prepareUpdateResponse();

				this.modelService.update$.subscribe((updatedInstance: T) => {
					expect(updatedInstance).toBe(instance);
					done();
				});
				
				doUpdate().subscribe(null);
			});

		});


		describe('.destroy()', () => {

			let prepareDestructionResponse: () => void;
			let checkObjectIsNotCached: (pk: number | string) => void;


			it('should send correct HTTP request', done => {
				prepareDestructionResponse();
				this.watchForRequest(
					RequestMethod.Delete,
					pk,
					null,
					done
				);

				this.modelService.destroy(pk);
			});


			prepareDestructionResponse = () =>
				this.setMockResponse({status: 204});	// no data; success


			it('should emit empty Observable value on success', done => {
				const onNext = done, onError = fail;
				prepareDestructionResponse();
				this.modelService.destroy(pk).subscribe(onNext, onError);
			});


			it('should remove object from cache', async(() => {
				prepareDestructionResponse();

				this.modelService.destroy(pk).subscribe(() => {
					checkObjectIsNotCached(pk);
				});
			}));


			checkObjectIsNotCached = (pk: number | string) => {
				expect(
					this.modelService.getFromCache(pk)
				).toBeFalsy();
			};


			it('should throw error on failure', 
				this.testRequestThrowsErrorOnFailure(() =>
					this.modelService.destroy(pk)
				)
			);

		});



		describe('.updateCache()', () => {

			it('should add model instance to cache', () => {
				const object = createModelInstance();
				this.modelService.updateCache(object);

				const cachedObject = 
					this.modelService.getFromCache(object.pk);

				expect(cachedObject).toBe(object);
			});


			it('should tell model instance to cache its linked objects',
					() => {
				const object = createModelInstance();
				spyOn(object, 'cacheLinkedObjects');
				this.modelService.updateCache(object);

				expect(object.cacheLinkedObjects).toHaveBeenCalled();
			});


			it(`shouldn't add model instance stub to cache`, () => {
				const object = createModelInstance();
				object.isStub = true;
				this.modelService.updateCache(object);

				const cachedObject = 
					this.modelService.getFromCache(object.pk);

				expect(cachedObject).toBe(null);
			});


			it('should convert dictionary to model instance, and add to cache',
					() => {
				const dict = createModelDict();
				this.modelService.updateCache(dict);

				const cachedObject = this.modelService.getFromCache(
					dict.id || dict.key
				);
				
				const searchDepth = 0;	// Linked objects will only be mocks; don't check them here
				initialTestData.checkModelInstanceMatches(
					cachedObject,
					searchDepth
				);
			});


			it('should tell cached object to cache its own linked objects '
					+ 'in turn, when added as a dictionary', () => {
				const dict = createModelDict();
				const resultingObject = this.modelService.updateCache(dict);

				const linkedObjects =
					getDirectlyLinkedObjectsFromModelInstance(resultingObject);

				linkedObjects.forEach((linkedObject: Model) => {
					const mockLinkedObjectService = linkedObject.modelService;

					expect(mockLinkedObjectService.updateCache)
						.toHaveBeenCalledWith(linkedObject);
				});
			});


			describe('should update previous object with new properties, '
					+ 'when an object is added with the same PK', () => {

				const newTestData = this.testData.instances[1];
						
				let initialObject: T;
				let updateCachedObjectWith: (newObject: any) => T;

				let checkUndefinedValueDoesntOverwriteDefinedOne: (
					sourceObject: any
				) => void;

				let getFirstPropertyNameOfTestObjectExceptPK: () => string;
				
				let checkObjectHasLinkTo: (
					mainObject: T,
					linkedObject: Model
				) => void;


				beforeEach(() => {
					initialObject = createModelInstance();
					this.modelService.updateCache(initialObject);
				});


				describe('(new properties provided in a model instance)',
						() => {

					let newObject: T;

					
					beforeEach(() => {
						newObject = createModelInstance(newTestData);
					});


					it('', () => {
						updateCachedObjectWith(newObject);
				
						// initialObject (in cache) should now have taken on newObject's properties
						checkModelInstanceHasPropertiesOfOther(
							initialObject,
							newObject
						);
					});


					it(`, but shouldn't overwrite defined values with `
							+ 'undefined', () => {
						checkUndefinedValueDoesntOverwriteDefinedOne(
							newObject
						);
					});
				

					it(', and should return the previous (now-updated) '
							+ 'instance', () => {
						const returnedInstance = 
							updateCachedObjectWith(newObject);

						checkObjectIsSameInstanceAsInCache(returnedInstance);
					});


					it(', and should tell the now-updated instance to '
							+ 'cache its linked objects', () => {
						
						const linkedObjects =
							getDirectlyLinkedObjectsFromModelInstance(newObject);
								
						linkedObjects.forEach(
							(linkedObject: Model) =>
								spyOn(linkedObject, 'cache').and.callThrough()
						);

						updateCachedObjectWith(newObject);

						linkedObjects.forEach((linkedObject: Model) => {
							expect(linkedObject.cache).toHaveBeenCalled();
						});
					});

				});
				
				
				updateCachedObjectWith = (newObject: any) => {
					// Identical PK, so that service treats them as 'the same'
					newObject[initialObject.pkName] = initialObject.pk;
					return this.modelService.updateCache(newObject);
				};
				
				
				checkUndefinedValueDoesntOverwriteDefinedOne = (
					sourceObject: any	// from which to take new values
				) => {
					const undefinedPropertyName =
						getFirstPropertyNameOfTestObjectExceptPK();

					const valueBeforeUpdate = 
						initialObject[undefinedPropertyName];

					sourceObject[undefinedPropertyName] = undefined;
					updateCachedObjectWith(sourceObject);
					
					expect(initialObject[undefinedPropertyName])
						.toBe(valueBeforeUpdate);	// unchanged
				};


				getFirstPropertyNameOfTestObjectExceptPK = () =>
					newTestData.fieldTSNames[1];	// 0 will be PK


				checkObjectHasLinkTo = (
					mainObject: T,
					linkedObject: Model
				) => {
					const allLinkedObjects =
						getDirectlyLinkedObjectsFromModelInstance(mainObject);

					expect(allLinkedObjects).toContain(linkedObject);
				};

				
				describe('(new properties provided in a dictionary)', () => {

					let newProperties: any;
					let getLinkedObjectsFromDict: (dict: any) => Model[];


					beforeEach(() => {
						newProperties = createModelDict(newTestData);
					});


					it('', () => {
						updateCachedObjectWith(newProperties);
				
						// initialObject (in cache) should now have taken on newProperties's properties
						expect(initialObject).toEqual(
							jasmine.objectContaining(newProperties)
						);
					});


					it(`, but shouldn't overwrite defined values with `
							+ 'undefined', () => {
						checkUndefinedValueDoesntOverwriteDefinedOne(
							newProperties
						);
					});


					it(', and should return a cached instance with these '
							+ 'exact properties', () => {

						const returnedInstance =
							updateCachedObjectWith(newProperties);

						checkObjectIsSameInstanceAsInCache(returnedInstance);

						expect(returnedInstance).toEqual(
							jasmine.objectContaining(newProperties)
						);
					});


					it(', and should tell the now-updated instance to '
							+ 'cache its linked objects', () => {
						
						const linkedObjects =
							getLinkedObjectsFromDict(newProperties);
								
						for(let linkedObject of linkedObjects)
							spyOn(linkedObject, 'cache').and.callThrough();

						updateCachedObjectWith(newProperties);

						for(let linkedObject of linkedObjects)
							expect(linkedObject.cache).toHaveBeenCalled();
					});


					getLinkedObjectsFromDict = (dict: any) => {
						return filterObjectByPropertyValues(
							dict,
							(value: any) => value instanceof Model
						);
					};

				});
				
			});

		});



		describe('.getFromCache()', () => {

			it('should return null when object is not found', () => {
				const pk = 42;
				expect(this.modelService.getFromCache(pk))
					.toBe(null);
			});

		});



		createModelDict = (
			testData: ModelInstanceTestData<T> = initialTestData
		) => {
			const dict = testData.toDictOfTSValues();
			stopLinkedObjectsFromStubbingThemselves(dict);
			return dict;
		};


		getObjectFromCache = (pk: number | string) => {
			spyOn(this.modelService, 'retrieve');
			const object$ = this.modelService.lazyRetrieve(pk);
			
			// If .retrieve() is called, that means service is getting the object via HTTP and not from cache!
			expect(this.modelService.retrieve).not.toHaveBeenCalled();

			return object$;
		};


		describe('.createLocalModelInstance()', () => {

			let instance: T;


			describe(', if properties are given,', () => {

				let restData: any;


				beforeEach(() => {
					restData = initialTestData.toDictOfRestValues();

					instance = 
						this.modelService.createLocalModelInstance(restData);
				});


				it('should create object with this service as .modelService',
						() => {
					expect(instance.modelService).toBe(this.modelService);
				});


				it('should create object with all given properties', () => {
					checkObjectIsValid(instance);
				});

			});


			describe(', if only a PK is given,', () => {

				const testPK = 3;

				beforeEach(() => {
					instance =
						this.modelService.createLocalModelInstance(testPK);
				});


				it('should create object with correct PK', () => {
					expect(instance.pk).toBe(testPK);
				});


				it('should create object with .isStub === true', () => {
					expect(instance.isStub).toBe(true);
				});

			});

		});

	}


	protected get modelService(): ModelService<T> {
		return this.service as ModelService<T>;
	}


	// Takes a done() function from Jasmine. Would use async() and do without done(), but for some reason async() doesn't wait for the callback before completing the test, so we fall back on old methods instead.
	protected watchForRequest(
		requestMethod: RequestMethod,
		pkOrUrl?: string | number,
		data?: ModelInstanceTestData<T> | any,
		doneFunc?: () => void
	): void {

		this.mockHttpBackend.connections.subscribe((
			connection: MockConnection
		) => {
			expect(connection.request.method)
				.toBe(requestMethod);

			this.checkRequestUrlMatchesPKOrUrl(connection.request, pkOrUrl);

			if(data)
				this.checkRequestForData(
					connection.request,
					data
				);

			if(doneFunc)
				doneFunc();
		});

	}


	protected checkRequestUrlMatchesPKOrUrl(
		request: Request,
		pkOrUrl: string | number
	): void {

		const isCorrectUrl = 
			typeof pkOrUrl === 'string'
			&& request.url.includes(pkOrUrl);

		if(isCorrectUrl)
			return;

		const pk = pkOrUrl;
		const urlPattern = this.createUrlPattern(pk);
		expect(request.url).toMatch(urlPattern);
	}


	protected checkRequestForData(
		request: Request,
		expectedData: ModelInstanceTestData<T> | any
	): void {

		const requestDict = request.json();

		if(expectedData instanceof ModelInstanceTestData) {
			expectedData.checkObjectHasCorrectWritableRestValues(
				requestDict
			);
		} else {
			expect(requestDict).toEqual(
				jasmine.objectContaining(expectedData)
			);
		}
	}


	protected createUrlPattern(pk?: string | number): RegExp {
		const elements = [this.modelService.restEndpointName];
		if(pk != null) elements.push(pk.toString());

		return new RegExp(elements.join('\/') + '$');
	}


	protected setMockResponseData(
		data: any,
		status: number = 200
	): void {
		const jsonText = this.createJsonFromData(data);
		
		this.setMockResponse({
			body: jsonText,
			status: status,
		});
	}


	protected createJsonFromData(data: any): string {
		if(isTestData(data))
			return data.toJson();
			
		return JSON.stringify(data);
	}


	// callService() should wrap one of the service's methods, which will have been set up to return 403 (forbidden); the returned Observable is then tested for an error response
	protected testRequestThrowsErrorOnFailure(
		callService: () => Observable<any>
	): (done: any) => void {

		return done => {
			const testErrorMessage = 'Error message';
			const onNext = fail;

			const onError = (thrownErrorMessage: string) => {
				expect(thrownErrorMessage).toBe(testErrorMessage);
				done();
			};

			this.setMockResponseError(testErrorMessage, 403);
			callService().subscribe(onNext, onError);
		};
	}


	protected get testData(): ModelTestData<T> {
		this._testData = this._testData
			|| this.initTestData();

		return this._testData;
	}


	// Could return a reference to a dataset defined in testing/data.ts, or some kind of altered copy of one; this will be cached for later recall
	protected abstract initTestData(): ModelTestData<T>;

}