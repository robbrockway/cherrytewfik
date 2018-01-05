import {
	TestModuleMetadata,
	TestBed,
	async,
	fakeAsync,
	flushMicrotasks,
	tick,
} from '@angular/core/testing';

import {
	NotificationComponent,
	NOTIFICATION_TIME,
} from './notification.component';

import { NotificationService } from './notification.service';

import {
	ComponentTest,
	mergeModuleMetadata,
} from 'testing';



const testMessage = 'Test message';



class NotificationComponentTest extends ComponentTest {

	private service: NotificationService;


	constructor() {
		super(NotificationComponent);
	}


	protected getModuleMetadata(): TestModuleMetadata {
		const defaultMetadata = super.getModuleMetadata();
		const extraMetadata = {providers: [NotificationService]};
		return mergeModuleMetadata(defaultMetadata, extraMetadata);
	}


	protected defineTests(): void {
		super.defineTests();

		let isVisible: () => boolean;


		beforeEach(() => {
			this.service = TestBed.get(NotificationService);
		});


		it('should hide notification box at first', () => {
			this.fixture.detectChanges();
			expect(isVisible()).toBeFalsy();
		});


		isVisible = () => {
			const notificationBox = this.getChildDebugElementByCss(
				'.notification'
			);

			return notificationBox.classes.visible;
		};


		it('should show notification box on request', async(() => {
			this.service.show(testMessage);
			
			this.fixture.whenStable().then(() => {
				this.fixture.detectChanges();
				expect(isVisible()).toBeTruthy();
			});
		}));


		it('should show correct message', async(() => {
			this.service.show(testMessage);
			
			this.fixture.whenStable().then(() => {
				this.fixture.detectChanges();

				this.checkChildTextContentIs(
					'.notification',
					testMessage
				);
			});
		}));


		it('should fade out after designated time', fakeAsync(() => {
			this.service.show(testMessage);
			flushMicrotasks();

			const paddedNotificationTime 
				= NOTIFICATION_TIME + 1000;

			tick(paddedNotificationTime);
			this.fixture.detectChanges();
			expect(isVisible()).toBeFalsy();
		}));

	}

}


new NotificationComponentTest();

