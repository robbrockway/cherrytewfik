import { YearMonth } from './year.month';



describe('YearMonth', () => {

	describe('.toString()', () => {

		let expectDateString: (
			year: number,
			month?: number
		) => any;


		it('should convert month/year date to month/year string', () => {
			expectDateString(2017, 11).toBe('November 2017');
			expectDateString(1993, 1).toBe('January 1993');
			expectDateString(2535, 7).toBe('July 2535');
		});


		expectDateString = (
			year: number,
			month?: number
		) => {
			const date = new YearMonth(year, month);
			return expect(date.toString());
		};


		it('should convert pure year to pure year string', () => {
			expectDateString(2017).toBe('2017');
			expectDateString(1993).toBe('1993');
		});

	});


	describe('.copy()', () => {

		const original = new YearMonth(2017, 12);
		const copy = original.copy();


		it('should return different instance from original', () => {
			expect(copy).not.toBe(original);
		});


		it('should return instance with same year and month', () => {
			expect(copy.year).toBe(original.year);
			expect(copy.month).toBe(original.month);
		});

	});

});
