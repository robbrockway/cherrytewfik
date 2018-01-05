// Reference to an instance of another model by an instance of the current one, e.g. to the parent Category of a Piece. Equivalent to Django's ForeignKey.

import { Type, Injector } from '@angular/core';

import { Model } from '../model';
import { ModelService } from '../model.service';
import { ObjectFieldDescriptor } from './object';
import { WritingCapability } from './base';



export class SingleObjectFieldDescriptor<T extends Model> 
		extends ObjectFieldDescriptor<T> {

	constructor(
		modelServiceType: Type<ModelService<T>>,
		tsName: string,
		restName?: string,
		writingCapability?: WritingCapability,
		correspondingTSName?: string
	) {
		super(
			modelServiceType,
			tsName,
			restName,
			writingCapability,
			correspondingTSName
		);
	}


	getTSValue(restValue: any, injector: Injector): T {
		if(!restValue)
			return restValue as T;

		const modelService = injector.get(this.modelServiceType);
		return modelService.createLocalModelInstance(restValue);
	}


	getRestValue(tsValue: T): number | string {
		if(!tsValue)
			return tsValue as any;

		// Only a PK is needed by server for writing
		return tsValue.pk;
	}

}
