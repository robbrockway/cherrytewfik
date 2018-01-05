// For testing subclasses of EditComponentBase


export abstract class EditHostComponent<T> {
	value: T;
	label: string;
	onValueChange = jasmine.createSpy('onValueChange');
	onCancel = jasmine.createSpy('onCancel');
}
