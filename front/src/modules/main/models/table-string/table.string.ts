// String from the server's general string table (e.g. biography, artist's statement)

import { TableStringService } from './table.string.service';
import { Model } from '../model';

import { FieldDescriptor, StringFieldDescriptor }
	from '../field-descriptors';



export interface TableString {
	key: string;
	value: string;
}



export class TableString extends Model {

	static fieldDescriptors: FieldDescriptor[] = [
		new StringFieldDescriptor('key'),
		new StringFieldDescriptor('value'),
	];

	static pkName = 'key'; 	// Strings have string-formatted keys, not number-formatted IDs


	constructor(
		tableStringService: TableStringService,
		properties?: any,
		isStub?: boolean
	) {
		super(tableStringService, properties, isStub);
	}

}