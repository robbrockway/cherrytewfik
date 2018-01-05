import { YearMonthFieldDescriptor } from './year.month';
import { YearMonth } from 'modules/shared';



type Dataset = {month: number, year: number, restValue: string};


const testData: Dataset[] = [
	{month: 7, year: 2013, restValue: '2013-07'},
	{month: 11, year: 1997, restValue: '1997-11'},
	{month: null, year: 2017, restValue: '2017-null'},
];



describe('YearMonthFieldDescriptor', () => {

	let fieldDescriptor: YearMonthFieldDescriptor;

	let checkConversionToTSValue: (
		restValue: string,
		expectedYear: number,
		expectedMonth: number
	) => void;

	let checkConversionToRestValue: (
		year: number,
		month: number,
		expectedRestValue: string
	) => void;

	let checkTSValueStaysUnchanged: (value: YearMonth) => void;


	beforeEach(() => {
		fieldDescriptor = new YearMonthFieldDescriptor('date');
	});


	it('should convert to correct tsValues', () => {
		for(let dataset of testData) {
			checkConversionToTSValue(
				dataset.restValue,
				dataset.year,
				dataset.month
			);
		}
	});


	checkConversionToTSValue = (
		restValue: string,
		expectedYear: number,
		expectedMonth: number
	) => {
		const tsValue = fieldDescriptor.getTSValue(restValue, null);
		expect(tsValue instanceof YearMonth).toBeTruthy();
		expect(tsValue.year).toBe(expectedYear);
		expect(tsValue.month).toBe(expectedMonth);
	};


	it('should convert to correct restValues', () => {
		for(let dataset of testData) {
			checkConversionToRestValue(
				dataset.year,
				dataset.month,
				dataset.restValue
			);
		}
	});


	checkConversionToRestValue = (
		year: number,
		month: number,
		expectedRestValue: string
	) => {
		const yearMonth = new YearMonth(year, month);
		const actualRestValue = fieldDescriptor.getRestValue(yearMonth);
		expect(actualRestValue).toBe(expectedRestValue);
	};


	it('should convert null tsValue to null restValue', () => {
		checkTSValueStaysUnchanged(null);
	});


	checkTSValueStaysUnchanged = (value: YearMonth) => {
		expect(
			fieldDescriptor.getRestValue(value)
		).toBe(value as any);
	};


	it('should convert undefined tsValue to undefined restValue', () => {
		checkTSValueStaysUnchanged(undefined);
	});

});