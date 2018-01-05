import { async } from '@angular/core/testing';

import { LoadScreenService } from './load.screen.service';



describe('LoadScreenService', () => {

	let service: LoadScreenService;


	beforeEach(() => {
		service = new LoadScreenService();
	});


	it('.show() should emit true through stream', async(() => {
		service.visibility$.subscribe(
			(visible: boolean) => expect(visible).toBe(true)
		);

		service.show();
	}));


	it('.hide() should emit false through stream', async(() => {
		service.visibility$.subscribe(
			(visible: boolean) => expect(visible).toBe(false)
		);

		service.hide();
	}));

});