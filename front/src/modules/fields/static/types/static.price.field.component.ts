import { Component } from '@angular/core';

import { FastLoadingStaticFieldComponent }
	from '../fast.loading.static.field.component';



@Component({
	selector: 'static-price-field',
	templateUrl: './plain.static.field.component.html',
})
export class StaticPriceFieldComponent 
		extends FastLoadingStaticFieldComponent<number> {

	get renderedValue(): string {
		if(!this.object)
			return '';

		const numValue = this.object[this.propertyName];

		if(!numValue)
			return '';

		return numValue.toFixed(2);	// two decimal places
	}

}
