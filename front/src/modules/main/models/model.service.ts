import { Type, Injector } from '@angular/core';

import {
	Http,
	Response,
	RequestOptionsArgs,
	Headers,
} from '@angular/http';

import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/throw';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/catch';

import { Model } from './model';

import {
	FieldDescriptor,
	WritingCapability,
} from './field-descriptors';

import {
	getStaticMember,
	isInstance,
	isPKType,
	getFirstItemWhere,
	isArray,
	forEachProperty,
	copyObjectProperties,
	objectHasPropertyOfType,
	arrayContains,
} from 'utils';

import { apiRoot } from 'settings';



export abstract class ModelService<T extends Model> {

	protected createModelInstanceFromResponse:
		(response: Response) => T;
	
	protected createModelInstanceListFromResponse:
		(response: Response) => T[];

	cache: T[] = [];

	private updateSubject = new Subject<T>();
	update$ = this.updateSubject.asObservable();	// public face, read-only
	
	
	constructor(
		public modelType: Type<T>,
		protected http: Http,
		protected injector: Injector
	) {
		// Some methods are defined here rather than out in the class so that 'this' remains bound, even when function is passed as an argument

		this.createModelInstanceFromResponse = (
			response: Response
		) => {
			const rawData = response.json();
			return this.createLocalModelInstance(rawData);
		};

		this.createModelInstanceFromResponse =
			this.createModelInstanceFromResponse.bind(this);	


		this.createModelInstanceListFromResponse = (
			response: Response
		) => {
			const rawData = response.json();
			return rawData.map(
				(dict: any) => this.createLocalModelInstance(dict)
			);
		};

		this.createModelInstanceListFromResponse =
			this.createModelInstanceListFromResponse.bind(this);
	
	}


	// 'restData' should be a dictionary fresh from server, which is converted here to the app's format; could also be a PK alone, in which case a stub object is created. 'Local' means not necessarily stored on server.
	createLocalModelInstance(restData: any): T {
		if(isPKType(restData))
			return this.createModelInstanceStub(restData);

		const tsData = this.getDictOfTSData(restData);
		
		return new this.modelType(
			this,
			tsData
		);
	}


	// Creates an object with only its PK, and no other properties, set
	protected createModelInstanceStub(pk: number | string): T {
		const defaultProperties = this.getDictOfTSData({});
		const isStub = true;
		const stub = new this.modelType(this, defaultProperties, isStub);
		stub.pk = pk;
		return stub;
	}


	protected getDictOfTSData(restData: any): any {
		const tsData = {};

		for(let fieldDescriptor of this.fieldDescriptors) {
			tsData[fieldDescriptor.tsName] = 
				this.getTSValue(fieldDescriptor, restData);
		}

		return tsData;
	}


	private getTSValue(
		fieldDescriptor: FieldDescriptor,
		restData: JSON
	): any {

		return fieldDescriptor.getTSValue(
			restData[fieldDescriptor.restName],
			this.injector
		);
	}


	lazyList(): Observable<T[]> {
		if(!this.cache.length)
			return this.list();

		const cacheCopy = Array.from(this.cache);
		return Observable.of(cacheCopy);
	}


	list(): Observable<T[]> {
		return this.http.get(this.createUrl()).catch(
			this.rethrowResponseErrorAsString
		).map(
			this.createModelInstanceListFromResponse
		).map((objects: T[]) => 
			this.cacheArray(objects)
		);
	}


	protected createUrl(
		pk?: number | string,
		suffix?: string
	): string {

		let url = `${apiRoot}/${this.restEndpointName}`;

		if(pk != null)
			url += `/${pk}`;

		if(suffix)
			url += suffix;

		return url;
	}


	protected rethrowResponseErrorAsString(
		response: Response
	): Observable<string> {

		const errorMessage = response.json()['detail'];
		return Observable.throw(errorMessage);
	}


	private cacheArray(objects: T[]): T[] {
		return objects.map((object: T) => object.cache() as T);
	}


	// Adds object to cache if it isn't there already; updates it if it is. All of these updateCache...() methods then return the instance of the object that is now in the cache, to avoid duplicate copies.
	updateCache(objectOrDict: T | any): T {
		let cachedInstance: T;
		
		if(isInstance(objectOrDict, this.modelType))
			return this.updateCacheWithModelInstance(objectOrDict as T);
		
		return this.updateCacheWithDict(objectOrDict);
	}


	private updateCacheWithModelInstance(instance: T): T {
		// Stubs have no useful information beyond a PK, so needn't be cached and may even do harm by overwriting certain existing properties
		if(this.cacheContains(instance))
			return instance;

		if(instance.isStub)
			return instance.getCachedVersion() as T;

		const existingObject = this.getFromCache(instance.pk);
		if(existingObject) {
			return this.updateCachedObjectWithModelInstance(
				existingObject,
				instance
			);
		}
		
		// Doesn't already exist; just use the copy provided
		this.cache.push(instance);
		instance.cacheLinkedObjects();
		return instance;
	}


	private cacheContains(instance: T): boolean {
		return arrayContains(this.cache, instance);
	}


	private updateCachedObjectWithModelInstance(
		existingObject: T,
		newObject: T
	): T {
		const newProperties = newObject.toDict();
		existingObject.setProperties(newProperties);
		return existingObject;
	}


	private updateCacheWithDict(dict: any): T {
		const pk = dict.id || dict.key;
		const existingObject = this.getFromCache(pk);

		if(existingObject)
			return this.updateCachedObjectWithDict(existingObject, dict);

		return this.appendToCacheFromDict(dict);
	}


	private updateCachedObjectWithDict(
		existingObject: T,
		dict: any
	): T {
		existingObject.setProperties(dict);
		return existingObject;
	}


	private appendToCacheFromDict(dict: any): T {
		const instance = new this.modelType(this, dict);
		this.cache.push(instance);
		instance.cacheLinkedObjects();
		return instance;
	}


	create(data: any): Observable<T> {
		const url = this.createUrl();
		const restData = this.getDictOfRestData(data);

		const response$ = this.http.post(url, restData).catch(
			this.rethrowResponseErrorAsString
		);

		return this.createModelInstanceStream(response$);
	}


	protected createModelInstanceStream(
		response$: Observable<Response | string>
	): Observable<T> {

		const object$ = response$.map(
			this.createModelInstanceFromResponse
		);

		return this.updateCacheWithStreamedObject(object$);
	}


	// Ensures the cache will be updated with whatever object is returned by the stream
	protected updateCacheWithStreamedObject(
		object$: Observable<any>
	): Observable<any> {

		return object$.map((object: any) => {
			let modelInstance: Model;
			
			if(object instanceof Model) {
				modelInstance = object as Model;
			} else {
				modelInstance =
					this.createLocalModelInstance(object);
			}

			return modelInstance.cache();
		});
	}


	// Converts a dictionary, as passed to .create() or .update(), into a server-friendly format
	protected getDictOfRestData(tsData: any): any {
		const restData = {};

		for(let fieldDescriptor of this.fieldDescriptors) {

			if(fieldDescriptor.writingCapability === 
					WritingCapability.CanWriteToServer) {

				restData[fieldDescriptor.restName] =
					this.getRestValue(fieldDescriptor, tsData);
			}
		}

		return restData;
	}


	private getRestValue(
		fieldDescriptor: FieldDescriptor,
		tsData: any
	): any {

		return fieldDescriptor.getRestValue(
			tsData[fieldDescriptor.tsName]
		);
	}


	// Retrieves from cache if available, else from server
	lazyRetrieve(pk: number | string): Observable<T> {
		const cachedObject = this.getFromCache(pk);

		if(cachedObject)
			return Observable.of(cachedObject);
		
		return this.retrieve(pk);
	}


	getFromCache(pk: number | string): T {
		return getFirstItemWhere(
			this.cache,
			(object: T) => object.pk === pk
		) || null;
	}


	retrieve(pk: number | string): Observable<T> {
		const response$ = this.http.get(this.createUrl(pk)).catch(
			this.rethrowResponseErrorAsString
		);

		return this.createModelInstanceStream(response$);
	}


	update(pk: number | string, data: any): Observable<any> {
		const url = this.createUrl(pk);
		const restData = this.getDictOfRestData(data);

		// Files can't be sent through a usual JSON request, so a special method must be used
		const response$ = objectHasPropertyOfType(restData, File) ?
			this.updateWithFormData(url, restData) :
			this.http.patch(url, restData);

		return response$.catch(
			this.rethrowResponseErrorAsString
		).map(
			(response: Response) => 
				this.getDictOfTSData(response.json())
		).do((updatedData: any) => {
			const existingObject = this.getFromCache(pk);
			existingObject.setProperties(updatedData);
			this.updateSubject.next(existingObject);	// Emit through .update$
		});
	}


	// Triggers a PATCH request using multipart/form-data
	private updateWithFormData(
		url: string,
		restData: any
	): Observable<Response> {

		const formData = new FormData();

		forEachProperty(
			restData,
			(key: string, value: any) => {
				if(value !== undefined)
					formData.append(key, value);
			},
		);

		return this.http.patch(url, formData);
	}


	destroy(pk: number | string): Observable<any> {
		return this.http.delete(this.createUrl(pk)).catch(
			this.rethrowResponseErrorAsString
		).do(
			() => this.removeFromCache(pk)
		);
	}


	protected removeFromCache(pk: string | number): void {
		const item = this.getFromCache(pk);
		if(!item)
			return;

		const indexInCache = this.cache.indexOf(item);
		this.cache.splice(indexInCache, 1);
	}


	get fieldDescriptors(): FieldDescriptor[] {
		return getStaticMember(
			this.modelType,
			'fieldDescriptors'
		);
	}


	// Should return a directory name for use in URLs, e.g. 'piece', 'category'
	abstract get restEndpointName(): string;

}

