import { MapSpinLabeller } from './spin.labeller';



describe('MapSpinLabeller', () => {

	const labels = ['zero', 'one', 'two', 'three'];


	it('should return the array item with same index as the supplied value',
			() => {
		const labeller = new MapSpinLabeller(labels);
		
		for(let i = 0; i < labels.length; i++)
			expect(labeller.getLabel(i)).toBe(labels[i]);
	});

});