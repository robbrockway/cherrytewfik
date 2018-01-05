import { Component } from '@angular/core';
import { TestModuleMetadata, async } from '@angular/core/testing';

import { YearMonth, shortMonthNames } from 'modules/shared';

import { YearMonthEditComponent }
	from './year.month.edit.component';

import { EditHostComponent } from '../edit.component.test.base';

import { TypedEditComponentTestBase }
	from './typed.edit.component.test.base';

import { SpinLabeller, MapSpinLabeller } from '../spin';

import {
	HostedComponentTest,
	MockSpinDirective,
	clickOnWindow,
} from 'testing';

import { getCurrentYear } from 'utils';



@Component({
	template: `
		<year-month-edit
			[(value)]="value"
			(valueChange)="onValueChange($event)"
			(cancel)="onCancel()"
			[label]="label"
		></year-month-edit>
	`,
})
class HostComponent extends EditHostComponent<YearMonth> {}



type SpinComponentParams = {
	min: number,
	max: number,
	labelWhenNull: string,
};



class YearMonthEditComponentTest
		extends TypedEditComponentTestBase<YearMonth> {

	private yearMonth: YearMonth;


	constructor() {
		super(YearMonthEditComponent, HostComponent);
	}


	protected getModuleMetadata(): TestModuleMetadata {
		const metadata = super.getModuleMetadata();
		metadata.declarations.push(MockSpinDirective);
		return metadata;
	}


	protected defineTests(): void {
		super.defineTests();

		let setSpinnerValues: (yearMonth: YearMonth) => void;

		let checkYearMonthInstancesAreEqual: (
			a: YearMonth,
			b: YearMonth
		) => void;


		beforeEach(() => {
			this.yearMonth = new YearMonth(1989, 9);
			this.hostComponent.value = this.yearMonth;
			this.fixture.detectChanges();
		});


		describe(`'s first SpinComponent`, () => {

			const componentIndex = 0;

			const expectedParams = {
				min: 1,
				max: 12,
				labelWhenNull: 'month',
			};


			this.defineTestsForSpinComponent(
				componentIndex,
				'month',
				expectedParams,
			);


			it('should use short month names as labels', () => {
				let mockSpinComponent =
					this.getMockSpinComponent(componentIndex);

				const labeller = mockSpinComponent.labeller as MapSpinLabeller;
				expect(labeller.table).toBe(shortMonthNames);
			});

		});


		describe(`'s second SpinComponent`, () => {

			const componentIndex = 1;

			const expectedParams = {
				min: 1970,
				max: 2070,
				labelWhenNull: 'year',
			};
			

			this.defineTestsForSpinComponent(
				componentIndex,
				'year',
				expectedParams
			);


			it('should have no labeller', () => {
				const mockSpinComponent = 
					this.getMockSpinComponent(componentIndex);

				expect(mockSpinComponent.labeller).toBeFalsy();
			});


			it('should have current year as default value', () => {
				const mockSpinComponent = 
					this.getMockSpinComponent(componentIndex);

				expect(mockSpinComponent.defaultValue)
					.toBe(getCurrentYear());
			});

		});


		describe(', if value is null,', () => {

			beforeEach(() => {
				this.hostComponent.value = null;
				this.fixture.detectChanges();
			});


			it('should pass null values to both SpinComponents', () => {
				const bothMockSpinComponents =
					this.getAllChildDirectivesOfType(MockSpinDirective);

				for(let spinner of bothMockSpinComponents)
					expect(spinner.value).toBe(null);
			});

		});


		it('should stop clicks inside the component from bubbling up to '
				+ 'window', async(() => {
			const windowSpy = jasmine.createSpy('onClick');
			window.addEventListener('click', windowSpy);
			
			const componentDiv =
				this.getChildNativeElementByCss('.yearMonthEdit');

			componentDiv.dispatchEvent(
				new MouseEvent('click', {bubbles: true})
			);
			
			expect(windowSpy).not.toHaveBeenCalled();
		}));


		describe('should emit valueChange with new value', () => {

			const newYearMonth = new YearMonth(2012, 11);


			beforeEach(async(() => {
				setSpinnerValues(newYearMonth);
			}));


			it('when window is clicked, outside component', async(() => {
				clickOnWindow();
			}));


			it('when enter is pressed', async(() => {
				window.dispatchEvent(
					new KeyboardEvent('keyup', {key: 'Enter'})
				);
			}));


			afterEach(() => {
				checkYearMonthInstancesAreEqual(
					this.hostComponent.value,
					newYearMonth
				);
			});

		});


		setSpinnerValues = (yearMonth: YearMonth) => {
			const spinners =
				this.getAllChildDirectivesOfType(MockSpinDirective);

			const monthSpinner = spinners[0], yearSpinner = spinners[1];
			monthSpinner.valueChange.emit(yearMonth.month);
			yearSpinner.valueChange.emit(yearMonth.year);
		};


		checkYearMonthInstancesAreEqual = (
			a: YearMonth,
			b: YearMonth
		) => {
			expect(a.year).toEqual(b.year);
			expect(a.month).toEqual(b.month);
		};

	}


	private defineTestsForSpinComponent(
		componentIndex: number,
		unit: 'year' | 'month',
		expectedParams: SpinComponentParams,
	): void {

		const newValue = expectedParams.min;	// definitely within range
	
		let mockSpinComponent: MockSpinDirective;


		beforeEach(() => {
			mockSpinComponent = 
				this.getMockSpinComponent(componentIndex);
		});


		it('should have correct parameters', () => {
			expect(mockSpinComponent).toEqual(
				jasmine.objectContaining(expectedParams)
			);
		});


		it(`should have date's .${unit} as value`, () => {
			expect(mockSpinComponent.value).toBe(this.yearMonth[unit]);
		});


		it(`should update date's .${unit} when main component saves, `
				+ 'after SpinComponent.valueChange is emitted',
				async(() => {
			mockSpinComponent.valueChange.emit(newValue);
			this.triggerSave();
			expect(this.hostComponent.value[unit]).toBe(newValue);
		}));


		it(`shouldn't alter date object directly, before main component `
				+ 'saves', async(() => {
			const initialValue = this.hostComponent.value[unit];
			mockSpinComponent.valueChange.emit(newValue);
			expect(this.hostComponent.value[unit]).toBe(initialValue);
		}));

	}


	private getMockSpinComponent(index: number): MockSpinDirective {
		const allMockSpinComponents =
			this.getAllChildDirectivesOfType(MockSpinDirective);

		return allMockSpinComponents[index];
	}


	private triggerSave(): void {
		clickOnWindow();
	}

}


new YearMonthEditComponentTest();