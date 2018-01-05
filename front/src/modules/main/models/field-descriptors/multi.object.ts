// Reference to a list of instances of another model from an instance of the current one, e.g. to the Pieces contained in a Category.

import { Type, Injector } from '@angular/core';

import { Model } from '../model';
import { ModelService } from '../model.service';
import { ObjectFieldDescriptor } from './object';

import {
	WritingCapability,
	RestConversionError,
} from './base';



export class MultiObjectFieldDescriptor<T extends Model>
		extends ObjectFieldDescriptor<T> {

	constructor(
		modelServiceType: Type<ModelService<T>>,
		tsName: string,
		restName?: string,
		writingCapability: WritingCapability
			= WritingCapability.CannotWriteToServer,
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


	getTSValue(restValue: any[], injector: Injector): T[] {
		if(!restValue)
			return [];
	
		const modelService = injector.get(this.modelServiceType);
		
		return restValue.map(
			(restDict: any) =>
				modelService.createLocalModelInstance(restDict)
		);
	}


	getRestValue(tsValue: T[]): any[] {
		// On server, these one-to-many relationships are invariably managed from the 'many' end, i.e. by each object in the multi-object list rather than by the object hosting the list – so no writing this field back to server.
		throw new RestConversionError();
	}

}