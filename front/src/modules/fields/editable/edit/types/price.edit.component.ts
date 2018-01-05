// Takes and emits a numerical value, which is displayed as a string, to 2dp

import { Component, ChangeDetectorRef } from '@angular/core';

import { PlainEditComponent } from './plain.edit.component';
import { isDigit, comesFromNonCharacterKey } from 'utils';



@Component({
	selector: 'price-edit',
	templateUrl: './plain.edit.component.html',
})
export class PriceEditComponent extends PlainEditComponent<number> {

	constructor(changeDetector: ChangeDetectorRef) {
		super(changeDetector);
	}


	protected internalValueToString(internalValue: number): string {
		if(!internalValue)
			return null;

		return internalValue.toFixed(2);
	}


	protected stringToInternalValue(string: string): number {
		return +string || null;
	}


	protected shouldAllowKeyPress(event: KeyboardEvent): boolean {
		return super.shouldAllowKeyPress(event)
			&& (
				isDigit(event.key)
				|| this.isFirstDecimalPoint(event.key)
			)
			&& !this.isAboutToAddExcessDecimalPlace
		
			|| comesFromNonCharacterKey(event);
	}


	private isFirstDecimalPoint(character: string): boolean {
		return character === '.' && !this.displayedValue.match(/\./);
	}


	private get isAboutToAddExcessDecimalPlace(): boolean {
		return this.numDigitsAfterDecimalPoint >= 2 &&
			this.cursorIsAfterDecimalPoint;
	}


	private get numDigitsAfterDecimalPoint(): number {
		if(!this.displayedValue)
			return 0;

		const contentsAfterPoint = this.displayedValue.split('.')[1];
		if(!contentsAfterPoint)
			return 0;

		return contentsAfterPoint.length;
	}

	
	private get cursorIsAfterDecimalPoint(): boolean {
		const decimalPointPosition = this.displayedValue.indexOf('.');

		return decimalPointPosition !== -1	// has point
			&& this.cursorPosition > decimalPointPosition;
	}


	private get cursorPosition(): number {
		const selection = window.getSelection();
		const range = selection.getRangeAt(0);
		if(!range) return null;
		return range.startOffset;
	}


	onInput(newContents: string): void {
		super.onInput(newContents);
		
		let cleanContents =	this.removeIllegalCharacters(newContents);

		cleanContents =
			this.renderToTwoDecimalPlaces(cleanContents);

		if(cleanContents !== newContents) {
			// Register the dirty text
			this.changeDetector.detectChanges();

			// so that this change will definitely be detected (else: cleanContents could be identical to prior .boxContents value; unclean contents are still displayed thanks to direct user input; clean .boxContents is not detected)
			this.boxContents = cleanContents;
		}
	}


	private removeIllegalCharacters(string: string): string {
		return string.replace(/[^0-9\.]/g, '');
	}


	private renderToTwoDecimalPlaces(string: string): string {
		const parts = string.split('.');

		if(parts.length <= 1)
			return string;	// No points

		const prePoint = parts.shift();
		let postPoint = parts.join('');	// everything after first point, with other points stripped
		postPoint = postPoint.slice(0, 2);

		return prePoint + '.' + postPoint;
	}

}
