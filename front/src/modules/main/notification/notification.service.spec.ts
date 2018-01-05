import { async } from '@angular/core/testing';

import { NotificationService } from './notification.service';



describe('NotificationService', () => {

	let service: NotificationService;


	beforeEach(() => {
		service = new NotificationService();
	});


	it('should be able to register handler', () => {
		service.registerHandler((message: string) => {});
	});


	it('.show() should pass message to handler', async(() => {
		const testMessage = 'Test message';
		
		service.registerHandler((message: string) => {
			expect(message).toBe(testMessage);
		});

		service.show(testMessage);
	}));

});