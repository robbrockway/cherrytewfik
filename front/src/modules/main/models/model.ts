// Base class for all data models retrieved from server. Could represent a stub, i.e. an object with only its PK set, to stand in for a full, not-yet-downloaded object when linked to by another object

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/do';

import {
	FieldDescriptor,
	ObjectFieldDescriptor,
} from './field-descriptors';

import { ModelService } from './model.service';

import {
	getStaticMember,
	isInstance,
	isArray,
	removeFromArray,
	getFirstItemWhere,
	flatten2DArray,
	mergeSetAIntoSetB,
	trueForAny,
} from 'utils';



export abstract class Model {

	static fieldDescriptors: FieldDescriptor[] = [];
	static pkName: string = 'id';

	deleting = false;


	constructor(
		public modelService: ModelService<Model>,
		properties: any = {},
		public isStub = false
	) {

		for(let propertyName of Object.keys(properties))
			this[propertyName] = properties[propertyName];
	}


	get pk(): string | number {
		return this[this.pkName];
	}


	set pk(pk: string | number) {
		this[this.pkName] = pk;
	}


	get pkName(): string {
		return getStaticMember(this, 'pkName');
	}


	// Convenience method for checking that at least one of several fields is set
	hasValueForOneOf(...fieldNames: string[]): boolean {
		return fieldNames.reduce(
			(previousVerdict: boolean, fieldName: string) =>
				previousVerdict || !!this[fieldName],
			false
		);
	}


	update(data: any): Observable<any> {
		return this.modelService.update(this.pk, data);
	}


	// Stub, for overriding in subclass
	protected onUpdate(updatedData: any): void {}


	delete(): Observable<any> {
		const onDelete = () => {
			this.onDelete();
			this.removeAllReverseLinks();
		};

		const onComplete = () => this.deleting = false;

		this.deleting = true;

		return this.modelService.destroy(this.pk)
			.do(onDelete)
			.finally(onComplete);
	}


	protected onDelete(): void {}


	protected removeAllReverseLinks(): void {
		for(let fieldDescriptor of this.fieldDescriptors)
			this.removeReverseLink(fieldDescriptor);
	}


	private get fieldDescriptors(): FieldDescriptor[] {
		return getStaticMember(this, 'fieldDescriptors');
	}
	

	// If field refers to a linked object, here we destroy the target object's reference back to this one
	private removeReverseLink(fieldDescriptor: FieldDescriptor): void {
		const correspondingTSName =
			this.getCorrespondingTSName(fieldDescriptor);

		if(!correspondingTSName)
			return;

		const linkedObjectOrArray =
			this[fieldDescriptor.tsName] as Model | Model[];

		if(linkedObjectOrArray) {
			this.removeReferencesFrom(
				linkedObjectOrArray,
				correspondingTSName
			);
		}
	}


	private getCorrespondingTSName(
		fieldDescriptor: FieldDescriptor
	): string {
		if(!(fieldDescriptor instanceof ObjectFieldDescriptor))
			return null;

		const objectFieldDescriptor =
			fieldDescriptor as ObjectFieldDescriptor<any>;

		return objectFieldDescriptor.correspondingTSName;
	}


	// Calls .addReferenceTo() on single object, or all in list, to get rid of links back to this object
	private removeReferencesFrom(
		linkedObjectOrArray: Model | Model[],
		correspondingTSName: string
	): void {
		
		this.performReferenceOperationOnLinkedObjects(
			linkedObjectOrArray,
			(linkedObject: Model) =>
				linkedObject.removeReferenceTo(this, correspondingTSName)
		);
	}


	// Runs callback on a single linked object or, if a list is given, all of them
	private performReferenceOperationOnLinkedObjects(
		linkedObjectOrArray: Model | Model[],
		doOperation: (linkedObject: Model) => void
	): void {

		const doOperationIfModelInstanceIsGenuine = (object: any) => {
			if(object instanceof Model)
				doOperation(object);
		};

		if(isArray(linkedObjectOrArray)) {
			const array = linkedObjectOrArray as Model[];
			for(let linkedObject of array)
				doOperationIfModelInstanceIsGenuine(linkedObject);
		} else {
			const linkedObject = linkedObjectOrArray
			doOperationIfModelInstanceIsGenuine(linkedObject);
		}
	}
	

	// e.g. get rid of a linked Piece from Category.pieces ('pieces' as second arg)
	removeReferenceTo(linkedObject: Model, propertyName: string): void {
		const propertyValue = this[propertyName];

		if(isArray(propertyValue))
			removeFromArray(propertyValue, linkedObject)
		else
			this[propertyName] = null;
	}


	// Fails silently if no service; an uncached object isn't the end of the world. Returns the newly-cached version of this object (might be a different instance)
	cache(): Model {
		if(this.modelService)
			return this.modelService.updateCache(this);

		return this;
	}


	cacheLinkedObjects(): void {
		for(let fieldDescriptor of this.fieldDescriptors)
			this.cacheField(fieldDescriptor);
	}


	// If field refers to one or more linked objects, adds these objects (and, in turn, all of their as-yet-uncached linked objects) to cache
	private cacheField(fieldDescriptor: FieldDescriptor): void {
		const propertyName = fieldDescriptor.tsName;
		const propertyValue = this[propertyName];

		if(propertyValue instanceof Model) {
			const linkedObject = propertyValue as Model;
			this[propertyName] = linkedObject.cache();
		} else if(isArray(propertyValue)) {
			this.cacheArrayOfLinkedObjects(propertyValue);
		}
	}


	private cacheArrayOfLinkedObjects(array: Model[]): void {
		array.forEach((linkedObject: Model, index: number) => {
			array[index] = linkedObject.cache();
		});
	}


	getCachedVersion(): Model {
		return this.modelService.getFromCache(this.pk);
	}


	// Ignores undefined values; caches any linked objects
	setProperties(dict: any): void {
		for(let fieldDescriptor of this.fieldDescriptors) {
			const key = fieldDescriptor.tsName;
			const newValue = dict[key];

			if(newValue !== undefined) {
				this.removeReverseLink(fieldDescriptor);
				this[key] = newValue;
				this.cacheField(fieldDescriptor);
				this.addReverseLink(fieldDescriptor);
			}
		}
	}


	// Like .removeReverseLink(), will add a reference back to this object from the linked one if this field does refer to a linked object
	private addReverseLink(fieldDescriptor: FieldDescriptor): void {
		const correspondingTSName =
			this.getCorrespondingTSName(fieldDescriptor);

		if(!correspondingTSName)
			return;

		const linkedObjectOrArray =
			this[fieldDescriptor.tsName] as Model | Model[];

		if(linkedObjectOrArray) {
			this.addReferencesFrom(
				linkedObjectOrArray,
				correspondingTSName
			);
		}
	}


	private addReferencesFrom(
		linkedObjectOrArray: Model[] | Model,
		correspondingTSName: string
	): void {
		
		this.performReferenceOperationOnLinkedObjects(
			linkedObjectOrArray,
			(linkedObject: Model) =>
				linkedObject.addReferenceTo(this, correspondingTSName)
		);
	}


	addReferenceTo(linkedObject: Model, propertyName: string): void {
		const propertyValue = this[propertyName];

		if(isArray(propertyValue))
			addToArrayIfHasUniquePK(propertyValue, linkedObject);
		else
			this[propertyName] = linkedObject;
	}


	// All fields' values, unaltered, in a dictionary. This is a shallow operation, i.e. values that are also model instances are not themselves converted to dictionaries.
	toDict(): any {
		const dict = {};

		const fieldDescriptors =
			getStaticMember(this, 'fieldDescriptors');

		for(let fieldDescriptor of fieldDescriptors) {
			const propertyName = fieldDescriptor.tsName;
			dict[propertyName] = this[propertyName];
		}

		return dict;
	}

}



function addToArrayIfHasUniquePK<T extends Model>(
	array: T[],
	newObject: T
): void {
	if(!trueForAny(
		array, 
		(object: T) => object.pk === newObject.pk
	))
		array.push(newObject);
}