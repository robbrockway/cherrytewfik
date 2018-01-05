// A FieldDescriptor handles conversion between API-generated REST data and formats more amenable to our client app. The base class does no conversion – just returns things literally – and subclasses handle various data types.

// tsName could be 'lastUpdated'; restName could be 'last_updated' as the API currently follows Python conventions.

import { Injector } from '@angular/core';



// Some fields' values cannot be written directly to server (e.g. Category.pieces must be altered by way of each Piece.category instead).
export enum WritingCapability {
	CannotWriteToServer,
	CanWriteToServer,
};



export class FieldDescriptor {

	private _restName: string;


	constructor(
		public tsName: string,
		restName?: string,
		public writingCapability: WritingCapability
			= WritingCapability.CanWriteToServer
	) {
		this._restName = restName;
	}


	get restName(): string {
		return this._restName || this.tsName;
	}


	set restName(restName: string) {
		this._restName = restName;
	}


	// Some subclasses (e.g. ObjectFieldDescriptor) have to pass services to the objects they create, so an injector is required
	getTSValue(restValue: any, injector: Injector): any {
		return restValue;
	}


	getRestValue(tsValue: any): any {
		return tsValue;
	}


	get canWriteToServer(): boolean {
		return this.writingCapability ===
			WritingCapability.CanWriteToServer;
	}


	set canWriteToServer(canWriteToServer: boolean) {
		this.writingCapability = canWriteToServer ? 
			WritingCapability.CanWriteToServer :
			WritingCapability.CannotWriteToServer;
	}

}



export class RestConversionError extends Error {

	constructor() {
		super('Cannot convert model instance back into REST data');
	}

}

