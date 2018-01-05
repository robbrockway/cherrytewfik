// Spin (up/down) control. Can optionally be assigned a SpinLabeller instance, to provide labels for values rather than just raw numbers (e.g. DaySpinLabeller could turn 23 into 'Monday 23rd', or MonthSpinLabeller could turn 11 into 'Nov').


import {
	Component,
	Input,
	Output,
	EventEmitter,
	HostListener,
} from '@angular/core';

import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/timer';
import 'rxjs/add/observable/interval';

import { SpinLabeller } from './spin.labeller';
import { mainButtonIsHeld } from 'utils';



const initialHoldDelay = 500; // Time after click-hold that rapid cycling begins
const cycleTime = 50;	// Time between each change of value, while rapidly cycling



@Component({
	selector: 'spin',
	templateUrl: './spin.component.html',
	styleUrls: ['./spin.component.scss'],
})
export class SpinComponent {

	Direction = SpinComponent.Direction;	// for template

	@Input() min = 1;
	@Input() max = 31;
	@Input() value: number;
	@Output() valueChange = new EventEmitter<number>();
	@Input() defaultValue: number;
	@Input() labeller: SpinLabeller;
	@Input() labelWhenNull: string;

	private previousValue: number;	// kept while value is null, for restoration
	private timerSubscription: Subscription;


	private ngOnInit(): void {
		this.previousValue = this.defaultValue || this.min;
	}


	get displayedText(): string {
		return this.value !== null ? 
			this.labelForValue : this.labelWhenNull;
	}


	private get labelForValue(): string {
		return this.labeller ?
			this.labeller.getLabel(this.value) : this.value.toString();
	}


	// Can't be nullified if no stand-in label is available
	get nullable(): boolean {
		return !!this.labelWhenNull;
	}


	onMouseDown(
		direction: SpinComponent.Direction,
		event: MouseEvent
	): void {
		event.preventDefault();		// Prevent drag and drop of arrow icon
		this.increment(direction);
		this.startCyclingAfterDelay(direction);
	}


	private increment(amount: number): void {
		const baseValue =
			this.value === null ? this.previousValue : this.value;

		let newValue = baseValue + amount;

		if(newValue < this.min)
			newValue = this.max;

		if(newValue > this.max)
			newValue = this.min;

		this.valueChange.emit(newValue);
	}


	private startCyclingAfterDelay(
		direction: SpinComponent.Direction
	): void {
		this.stopCycling();	// in case we're already subscribed

		this.timerSubscription = Observable.timer(
			initialHoldDelay,
			cycleTime
		).subscribe(
			() => this.increment(direction)
		);
	}


	private stopCycling(): void {
		if(this.timerSubscription)
			this.timerSubscription.unsubscribe();
	}


	@HostListener('window:mouseup')
	onMouseUp(): void {
		this.stopCycling();
	}


	onMouseOut(): void {
		this.stopCycling();
	}


	onMouseOver(
		direction: SpinComponent.Direction,
		event: MouseEvent
	): void {
		if(mainButtonIsHeld(event))
			this.startCycling(direction);
	}


	private startCycling(direction: SpinComponent.Direction): void {
		this.stopCycling();

		this.timerSubscription = Observable.interval(cycleTime).subscribe(
			() => this.increment(direction)
		);
	}


	private onLabelClick(): void {
		if(this.value !== null)
			this.nullifyValue();
		else
			this.restoreValue();
	}


	private nullifyValue(): void {
		this.previousValue = this.value;
		this.valueChange.emit(null);
	}


	private restoreValue(): void {
		this.valueChange.emit(this.previousValue);
	}


	ngOnDestroy(): void {
		this.stopCycling();
	}

}



export module SpinComponent {

	export enum Direction {
		Up = 1,
		Down = -1,
	}

}