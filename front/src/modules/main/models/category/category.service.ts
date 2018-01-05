import { Injectable, Injector } from '@angular/core';
import { Http } from '@angular/http';

import { Subject } from 'rxjs/Subject';

import { Category } from './category';
import { ReorderableModelService } from '../reorderable.model.service';



@Injectable()
export class CategoryService extends ReorderableModelService<Category> {

	constructor(http: Http, injector: Injector) {
		super(Category, http, injector);
	}


	get restEndpointName(): string {
		return 'category';
	}

}