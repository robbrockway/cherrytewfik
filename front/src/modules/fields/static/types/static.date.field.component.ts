// Base class for StaticMonthYearFieldComponent and StaticRangeDateFieldComponent

import { TypedStaticFieldComponent }
	from '../typed.static.field.component';



export abstract class StaticDateFieldComponent<T>
		extends TypedStaticFieldComponent<T> {

	renderedValue: string;

	// For change detection
	private oldDate: T;
	private oldDateProperties: any = {};


	ngDoCheck(): void {
		if(this.dateHasChanged)
			this.updateRenderedValue();
	}


	private get dateHasChanged(): boolean {
		if(this.dateObjectHasChanged)
			return true;

		if(!this.value)
			return false;	// Date may have recently become null, but that's left up to the built-in change detector

		let verdict = false;

		for(let key of this.propertyNamesToTrack) {
			const propertyValue = this.value[key];

			if(propertyValue !== this.oldDateProperties[key]) {
				this.oldDateProperties[key] = propertyValue;
				verdict = true;
			}
		}

		return verdict;
	}


	// Should return a list of properties of T, e.g. ['year', 'month'] for YearMonth
	protected abstract get propertyNamesToTrack(): string[];


	// As opposed to the properties within the date object
	private get dateObjectHasChanged(): boolean {
		if(this.value === this.oldDate)
			return false;

		this.oldDate = this.value;
		
		if(this.value)
			this.recordOldDateProperties();
		
		return true;
	}


	private updateRenderedValue(): void {
		this.renderedValue =
			this.value ? this.value.toString() : '';
		
		this.load.emit();
	}


	// For comparison, so future changes can be tracked
	private recordOldDateProperties(): void {
		for(let key of this.propertyNamesToTrack)
			this.oldDateProperties[key] = this.value[key];
	}

}