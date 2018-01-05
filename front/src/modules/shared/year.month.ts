// Date class for use by pieces. Stores optional month and compulsory year values.


export const longMonthNames = [
	null,	// 0th month
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
	'July',
	'August',
	'September',
	'October',
	'November',
	'December',
];


export const shortMonthNames = [
	null,
	'Jan',
	'Feb',
	'Mar',
	'Apr',
	'May',
	'Jun',
	'Jul',
	'Aug',
	'Sep',
	'Oct',
	'Nov',
	'Dec',
];



export class YearMonth {

	constructor(
		public year: number,
		public month?: number	// 1 = January
	) {}


	toString(): string {
		let parts = [this.year.toString()];

		if(this.month)
			parts.unshift(this.monthString);

		return parts.join(' ');
	}


	protected get monthString(): string {
		return longMonthNames[this.month];
	}


	copy(): YearMonth {
		return new YearMonth(this.year, this.month);
	}

}