import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';

import { Model } from './model';
import { ModelService } from './model.service';



export abstract class ReorderableModelService<T extends Model>
		extends ModelService<T> {

	reorder(objectsInNewOrder: T[]): Observable<T[]> {
		const requestBody = this.createReorderRequestBody(
			objectsInNewOrder
		);

		return this.http.put(this.createUrl(), requestBody).catch(
			this.rethrowResponseErrorAsString
		).map(
			this.createModelInstanceListFromResponse
		);
	}


	private createReorderRequestBody(objectsInNewOrder: T[]): string {
		const pks = objectsInNewOrder.map(
			(object: T) => object.pk
		);

		const wholeDict = {
			reorder: pks,
		};

		return JSON.stringify(wholeDict);
	}

}