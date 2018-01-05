// Contains all the necessary data for setting the value of a model instance's field, whether formatted for REST/server or for TypeScript and this client app


export abstract class TestField {

	private _restName: string;


	constructor(
		public tsName: string,
		restName?: string
	) {
		this._restName = restName;
	}


	// Defaults to .tsName
	get restName(): string {
		return this._restName || this.tsName;
	}


	set restName(name: string) {
		this._restName = name;
	}


	// linkDepth controls the degree to which linked objects should be included; for simple values (id, name, etc) this is irrelevant
	abstract getTSValue(linkDepth?: number): any;


	abstract getRestValue(linkDepth?: number): any;


	// Use these when checking values, rather than a straight comparison with values returned by the two methods above, as a specific type of loose comparison might be necessary; this is left to subclasses
	abstract checkTSValueIs(value: any, expectedLinkDepth?: number): void;


	abstract checkRestValueIs(value: any, expectedLinkDepth?: number): void;

}