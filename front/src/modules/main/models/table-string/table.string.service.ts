import { Injectable, Injector } from '@angular/core';
import { Http } from '@angular/http';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

import { TableString } from './table.string';
import { ModelService } from '../model.service';



export type StringTable = {[key: string]: TableString};



@Injectable()
export class TableStringService extends ModelService<TableString> {

	constructor(injector: Injector, http: Http) {
		super(TableString, http, injector);
	}


	// Use [API root]/string
	get restEndpointName(): string {
		return 'string';
	}


	// Returns an Observable of {[key]: TableString} pairs
	dict(): Observable<StringTable> {
		return this.lazyList().map(getDictFromListOfInstances);
	}

}


function getDictFromListOfInstances(
	tableStrings: TableString[]
): StringTable {
	const initialValue = {} as StringTable;

	return tableStrings.reduce((
		accumulator: StringTable,
		currentTableString: TableString
	) => {
		accumulator[currentTableString.key] = currentTableString;
		return accumulator;
	}, initialValue);
}