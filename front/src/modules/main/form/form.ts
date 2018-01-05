import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';



export class FormField {

	focus$: Observable<any>;	// Emits when .focus() is called
	protected focusObserver: Observer<any>;

	value$: Observable<string>;	// Emits each new value when changed
	protected valueObserver: Observer<string>;

	private _error: string = '';
	private _value: string = '';


	constructor(
		public name: string,
		public label: string,
		value: string = '',
		public htmlInputType: string = 'text'
	) {
		this._value = value;

		for(let streamName of ['focus', 'value'])
			this.initStream(streamName);
	}


	// Constructs an Observable and its Observer, as instance variables; 'name' will produce name$ (Observable) and nameObserver
	private initStream(name: string): void {
		const observableName = name + '$';
		const observerName = name + 'Observer';

		this[observableName] = 
				Observable.create((observer: Observer<any>) => {
			this[observerName] = observer;
		});
	}


	get error(): string {
		return this._error;
	}


	set error(error: string) {
		this._error = error;

		if(error)
			this.onError();
	}


	private onError(): void {
		this._value = '';
		this.focus();
	}


	get value(): string {
		return this._value;
	}


	set value(value: string) {
		this._value = value;

		if(this.valueObserver)
			this.valueObserver.next(value);

		this._error = '';
	}


	focus(): void {
		if(this.focusObserver)
			this.focusObserver.next(null);
	}


	clear(): void {
		this.value = null;
	}

}



export class Form {
	
	fields: FormField[][] = [];


	constructor(
		public name: string,
		...fieldRows: (FormField | FormField[])[]	// Will display a sub-list of fields side-by-side
	) {
	
		for(let row of fieldRows) {
			if(row instanceof FormField)
				this.fields.push([row]);
			else
				this.fields.push(row);
		}
	}


	rowHasOnlyOneField(rowIndex: number): boolean {
		return this.fields[rowIndex].length == 1;
	}


	hasAnyMultiFieldRows(): boolean {
		return this.fields.some(row => row.length > 1);
	}

}
