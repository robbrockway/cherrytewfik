/// <reference path="../index.ts" />
import { Component } from '@angular/core';

import {
	async,
	fakeAsync,
	tick,
	flushMicrotasks,
} from '@angular/core/testing';

import { SpinComponent } from './spin.component';
import { SpinLabeller } from './spin.labeller';
import { HostedComponentTest } from 'testing';



@Component({
	template: `
		<spin [(value)]="value"
			(valueChange)="onValueChange($event)"
			[min]="min"
			[max]="max"
			[labeller]="labeller"
			[labelWhenNull]="labelWhenNull"
		></spin>
	`,
})
class HostComponent {
	value: number;
	onValueChange = jasmine.createSpy('onValueChange');
	min: number;
	max: number;
	labeller: SpinLabeller;
	labelWhenNull: string;
	nullable: boolean;
}



class SpinComponentTest extends HostedComponentTest {

	constructor() {
		super(SpinComponent, HostComponent);
	}


	protected defineTests(): void {
		super.defineTests();

		const min = 0, max = 10, initialValue = 5;
		const labelWhenNull = 'spinner';
		const delayBeforeRapidCycle = 500;
		const safeDelay = 375;	// for a bit, but not for so long that we start cycling
		const substantialDelay = 1000;

		let checkTextIsDisplayed: (text: string) => void;
		let createMockSpinLabeller: () => SpinLabeller;
		let setValue: (value: number) => void;
		let mouseDown: (direction: SpinComponent.Direction) => void;
		let expectValue: () => any;
		
		let triggerMouseEvent: (
			eventType: string,
			direction: SpinComponent.Direction,
			metadata?: any
		) => void;

		let getButtonSelector: (direction: SpinComponent.Direction) => string;
		let clearTimers: () => void;
		let mouseUp: () => void;
		let clickOnLabelElement: () => void;
		let expectNumValueChanges: () => any;

		let pressAndHoldForAWhile: (
			direction: SpinComponent.Direction
		) => void;

		let checkSpinnerHasCycled: (
			direction: SpinComponent.Direction
		) => void;
		
		let countCyclesFromScratch: () => void;
		let resetCycleCounter: () => void;
		let checkSpinnerHasNotCycled: () => void;
		let mouseOut: (direction: SpinComponent.Direction) => void;
		let mouseOverWhilstHeld: (direction: SpinComponent.Direction) => void;
		let mouseOver: (direction: SpinComponent.Direction) => void;


		beforeEach(() => {
			Object.assign(
				this.hostComponent, 
				{
					min, 
					max, 
					value: initialValue, 
					labelWhenNull,
					nullable: true,
				}
			);

			this.fixture.detectChanges();
		});


		it('should show value', () => {
			checkTextIsDisplayed(initialValue.toString());
		});


		checkTextIsDisplayed = (text: string) =>
			this.checkChildTextContentIs('.label', text);


		it('should show labelWhenNull, if value is null', () => {
			setValue(null);
			checkTextIsDisplayed(labelWhenNull);
		});


		it('should show label supplied by labeller, if one exists', () => {
			const labeller = createMockSpinLabeller();
			this.hostComponent.labeller = labeller;
			this.fixture.detectChanges();

			for(let value = min; value <= max; value++) {
				setValue(value);
				const expectedLabel = labeller.getLabel(value);
				checkTextIsDisplayed(expectedLabel);
			}
		});


		createMockSpinLabeller = () => {
			return {
				getLabel: (value: number) => 'value: ' + value,
			};
		};


		it(`should give label 'faint' class, if value is null`, () => {
			setValue(null);
			this.expectChildNativeElement('.label.faint').toBeTruthy();
		});


		it('should still show value, if zero (not null)', () => {
			setValue(0);
			checkTextIsDisplayed('0');
		});


		it(`shouldn't give label 'faint' class, if value is not null`,
				() => {
			this.expectChildNativeElement('.label.faint').toBeFalsy();
		});


		setValue = (value: number) => {
			this.hostComponent.value = value;
			this.fixture.detectChanges();
		};


		it(`should increase value when 'up' is clicked`, fakeAsync(() => {
			mouseDown(SpinComponent.Direction.Up);
			expectValue().toBe(initialValue + 1);
			clearTimers();
		}));


		mouseDown = (direction: SpinComponent.Direction) =>
			triggerMouseEvent('mousedown', direction);


		expectValue = () => expect(this.hostComponent.value);


		triggerMouseEvent = (
			eventType: string,
			direction: SpinComponent.Direction,
			metadata?: any
		) => {
			const buttonSelector = getButtonSelector(direction);
			const button = this.getChildNativeElementByCss(buttonSelector);
			const event = new MouseEvent(eventType, metadata);
			button.dispatchEvent(event);
			flushMicrotasks();
		};


		getButtonSelector = (direction: SpinComponent.Direction) => {
			switch(direction) {
			case SpinComponent.Direction.Up:
				return 'a:first-child';
			case SpinComponent.Direction.Down:
				return 'a:last-child';
			}
		};


		clearTimers = () => mouseUp();


		mouseUp = () => {
			window.dispatchEvent(new MouseEvent('mouseup'));
			flushMicrotasks();
		};


		it(`should decrease value when 'down' is clicked`,
				fakeAsync(() => {
			mouseDown(SpinComponent.Direction.Down);
			expectValue().toBe(initialValue - 1);
			clearTimers();
		}));


		it(`should set value to min when 'up' is clicked from max`,
				fakeAsync(() => {
			setValue(max);
			mouseDown(SpinComponent.Direction.Up);
			expectValue().toBe(min);
			clearTimers();
		}));


		it(`should set value to max when 'down' is clicked from min`,
				fakeAsync(() => {
			setValue(min);
			mouseDown(SpinComponent.Direction.Down);
			expectValue().toBe(max);
			clearTimers();
		}));


		describe(', if nullable,', () => {

			beforeEach(() => clickOnLabelElement());


			it('should make value null, when value is clicked', 
					async(() => {
				expectValue().toBe(null);
			}));


			it('should restore previous value, when label is clicked '
					+ 'while value is null', async(() => {
				clickOnLabelElement();	// back to how it was
				expectValue().toBe(initialValue);
			}));


			this.describeForBothDirections(
					'should increment value as if it had never been '
						+ 'annulled, if clicked',
					(direction: SpinComponent.Direction) => {
				mouseDown(direction);
				expectValue().toBe(initialValue + direction);
				clearTimers();
			});

		});


		clickOnLabelElement = () => {
			const labelElement = 
				this.getChildNativeElementByCss('.label');

			labelElement.click();
			this.fixture.detectChanges();
		};


		it(`shouldn't make value null on click, if not nullable`,
				async(() => {
			this.hostComponent.labelWhenNull = null;
			this.fixture.detectChanges();
			clickOnLabelElement();
			expectValue().toBe(initialValue);
		}));


		this.describeForBothDirections(
				'should change value when button is initially pressed '
					+ 'and held, then keep it constant for a while,',
				(direction: SpinComponent.Direction) => {
			mouseDown(direction);
			tick(safeDelay);
			expectValue().toBe(initialValue + direction);
			expectNumValueChanges().toBe(1);
			clearTimers();
		});


		expectNumValueChanges = () =>
			expect(this.hostComponent.onValueChange.calls.count());


		this.describeForBothDirections(
				'should start cycling rapidly through values, after a '
					+ 'short delay, when button is held',
				(direction: SpinComponent.Direction) => {
			pressAndHoldForAWhile(direction);
			checkSpinnerHasCycled(direction);
			clearTimers();
		});


		pressAndHoldForAWhile = (direction: SpinComponent.Direction) => {
			mouseDown(direction);
			tick(substantialDelay);
		};


		checkSpinnerHasCycled = (direction: SpinComponent.Direction) => {
			expectNumValueChanges().toBeGreaterThan(5);

			const permittedValueDifferences = [
				direction,	// -1 or 1
				(min - max) * direction,	// reset, once we hit min or max
			];

			let previousValue: number;

			for(let call of this.hostComponent.onValueChange.calls) {
				const value = call.args[0];

				if(previousValue) {
					const valueDifference = value - previousValue;
					
					expect(permittedValueDifferences)
						.toContain(valueDifference);
				}
				
				previousValue = value;
			}
		};


		this.describeForBothDirections(
				'should stop cycling when button is released,',
				(direction: SpinComponent.Direction) => {
			pressAndHoldForAWhile(direction);
			mouseUp();
			countCyclesFromScratch();
			checkSpinnerHasNotCycled();
		});


		countCyclesFromScratch = () => {
			resetCycleCounter();
			tick(substantialDelay);
		};


		resetCycleCounter = () =>
			this.hostComponent.onValueChange.calls.reset();


		checkSpinnerHasNotCycled = () =>
			expect(this.hostComponent.onValueChange)
				.not.toHaveBeenCalled();


		this.describeForBothDirections(
				'should stop cycling when mouse leaves button',
				(direction: SpinComponent.Direction) => {
			pressAndHoldForAWhile(direction);
			mouseOut(direction);
			countCyclesFromScratch();
			checkSpinnerHasNotCycled();
		});


		mouseOut = (direction: SpinComponent.Direction) =>
			triggerMouseEvent('mouseout', direction);


		mouseOverWhilstHeld = (direction: SpinComponent.Direction) => {
			const withLeftButton = {buttons: 1};
			triggerMouseEvent('mouseover', direction, withLeftButton);
		};


		this.describeForBothDirections(
				'should resume cycling when mouse re-enters arrow button '
					+ 'while still held', 
				(direction: SpinComponent.Direction) => {
			pressAndHoldForAWhile(direction);
			mouseOut(direction);
			mouseOverWhilstHeld(direction);
			countCyclesFromScratch();
			checkSpinnerHasCycled(direction);
			clearTimers();
		});


		this.describeForBothDirections(
				'should start cycling in opposite direction when mouse '
				+ 'enters other button while still held',
				(direction: SpinComponent.Direction) => {
			const oppositeDirection = -direction;
			pressAndHoldForAWhile(direction);
			mouseOut(direction);
			mouseOverWhilstHeld(oppositeDirection);
			countCyclesFromScratch();
			checkSpinnerHasCycled(oppositeDirection);
			clearTimers();
		});


		this.describeForBothDirections(
				`shouldn't resume cycling at all after mouse is released`,
				(direction: SpinComponent.Direction) => {
			pressAndHoldForAWhile(direction);
			mouseOut(direction);
			mouseUp();
			mouseOver(direction);
			countCyclesFromScratch();
			checkSpinnerHasNotCycled();
		});


		mouseOver = (direction: SpinComponent.Direction) =>
			triggerMouseEvent('mouseover', direction);

	}


	// Several tests need to run twice, for up button and for down
	private describeForBothDirections(
		description: string,
		runTest: (direction: SpinComponent.Direction) => void
	): void {

		describe(description, () => {

			it(`on 'up'`, fakeAsync(() => {
				runTest(SpinComponent.Direction.Up);
			}));


			it(`on 'down'`, fakeAsync(() => {
				runTest(SpinComponent.Direction.Down);
			}));

		});

	}

}


new SpinComponentTest();