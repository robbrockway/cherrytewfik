// For editing YearMonth date values, using two SpinComponents

import {
	Component,
	SimpleChanges,
	HostListener,
} from '@angular/core';

import { YearMonth, shortMonthNames } from 'modules/shared';
import { TypedEditComponent } from './typed.edit.component';
import { MapSpinLabeller } from '../spin';
import { getCurrentYear } from 'utils';



@Component({
	selector: 'year-month-edit',
	templateUrl: './year.month.edit.component.html',
	styleUrls: ['./year.month.edit.component.scss'],
})
export class YearMonthEditComponent extends TypedEditComponent<YearMonth> {

	monthLabeller = new MapSpinLabeller(shortMonthNames);
	prospectiveValue: YearMonth;
	defaultYear = getCurrentYear();


	private ngOnChanges(changes: SimpleChanges): void {
		if(changes.value)
			this.copyValueForProspective();
	}


	// prospectiveValue still needs to be an object, even if value given is null
	private copyValueForProspective(): void {
		this.prospectiveValue = this.value ? 
			this.value.copy() : new YearMonth(null, null);
	}


	// Stops event from bubbling up to the window, which should only receive clicks outside the component
	onClickInside(event: Event): void {
		event.stopPropagation();
	}


	@HostListener('window:click')
	onClickOutside(): void {
		this.save();
	}


	private save(): void {
		const finalValue = this.prospectiveValueIsUseable ? 
			this.prospectiveValue : null;

		this.valueChange.emit(finalValue);
	}


	@HostListener('window:keyup.enter')
	onEnter(): void {
		this.save();
	}


	// If date doesn't have year set, it's invalid (null month, however, is allowed)
	private get prospectiveValueIsUseable(): boolean {
		return !!(
			this.prospectiveValue && this.prospectiveValue.year
		);
	}

}