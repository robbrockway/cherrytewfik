import { PieceNavigatorButton } from './piece.navigator.button';



const buttonParamsList = [
	{
		index: PieceNavigatorButton.Index.Previous,
		label: 'Previous',
		filename: 'previous.svg'
	},

	{
		index: PieceNavigatorButton.Index.Random,
		label: 'Random',
		filename: 'random.svg'
	},

	{
		index: PieceNavigatorButton.Index.Next,
		label: 'Next',
		filename: 'next.svg'
	},
];



describe('PieceNavigatorButton', () => {

	let testAllButtonTypes: (
		testFunc: (button: PieceNavigatorButton) => void,
		enabled?: boolean
	) => void;


	it('should give correct .enabledSrc', () => {
		testAllButtonTypes((button: PieceNavigatorButton) =>
			expect(button.enabledSrc)
				.toBe(`images/buttons/piece-navigator/${button.filename}`)
		);
	});


	// Runs the provided test function on a few buttons with different parameters
	testAllButtonTypes = (
		testFunc: (button: PieceNavigatorButton) => void,
		enabled: boolean = true
	) => {

		for(let params of buttonParamsList) {
			const button = new PieceNavigatorButton(
				params.index,
				params.label,
				params.filename,
				enabled
			);

			testFunc(button);
		}
	};


	it('should give correct .disabledSrc', () => {
		testAllButtonTypes((button: PieceNavigatorButton) =>
			expect(button.disabledSrc).toBe(
				`images/buttons/piece-navigator/grey/${button.filename}`
			)
		);
	});


	it('should use .enabledSrc as main .src when enabled', () => {
		testAllButtonTypes(
			(button: PieceNavigatorButton) =>
				expect(button.src).toBe(button.disabledSrc),
			false
		);
	});


	it('should use .disabledSrc as main .src when disabled', () => {
		testAllButtonTypes(
			(button: PieceNavigatorButton) =>
				expect(button.src).toBe(button.enabledSrc),
			true
		);
	});

});