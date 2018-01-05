// Base class for SingleObjectFieldDescriptor and MultiObjectFieldDescriptor, i.e. fields that contain links to other objects

import { Type, Injector } from '@angular/core';

import { Model } from '../model';
import { ModelService } from '../model.service';

import {
	FieldDescriptor,
	WritingCapability,
} from './base';



export abstract class ObjectFieldDescriptor<T extends Model>
		extends FieldDescriptor {

	constructor(
		protected modelServiceType: Type<ModelService<T>>,
		tsName: string,
		restName?: string,
		writingCapability?: WritingCapability,
		public correspondingTSName?: string	// tsName of property on the target object that refers back to this object
	) {
		super(tsName, restName, writingCapability);
	}

}
