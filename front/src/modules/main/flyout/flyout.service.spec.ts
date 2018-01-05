import { FlyoutService } from './flyout.service';



describe('FlyoutService', () => {

	it('should emit key through .focus$ when passed to .focus()',
			done => {

		const service = new FlyoutService();
		const key = 'key';

		service.focus$.subscribe((emittedKey: string) => {
			expect(emittedKey).toBe(key);
			done();
		});

		service.focus(key);
	});

});