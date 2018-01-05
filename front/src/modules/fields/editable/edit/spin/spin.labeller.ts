// A SpinLabeller provides labels for display on a SpinComponent, in place of raw numerical values.



export interface SpinLabeller {
	getLabel(value: number): string;
}


// Straight mapping of numbers to strings, by way of a table
export class MapSpinLabeller implements SpinLabeller {

	constructor(public table: string[]) {}


	getLabel(value: number): string {
		return this.table[value];
	}

}