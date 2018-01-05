import { 
	Component,
	DebugElement,
} from '@angular/core';

import { fakeAsync } from '@angular/core/testing';
import { OkCancelComponent } from './ok.cancel.component';
import { HostedComponentTest } from 'testing';



@Component({
	template: `
		<ok-cancel
			[okLabel]="okLabel"
			[cancelLabel]="cancelLabel"
			(ok)="onOk()"
			(cancel)="onCancel()"
		></ok-cancel>
	`
})
class HostComponent {
	okLabel: string;
	cancelLabel: string;
	onOk(): void {}
	onCancel(): void {}
}



const okLabel = 'OK';
const cancelLabel = 'Cancel';



class OkCancelComponentTest extends HostedComponentTest {

	constructor() {
		super(
			OkCancelComponent,
			HostComponent
		);
	}


	protected defineTests(): void {
		super.defineTests();

		let setCancelLabel: (label: string) => void;
		let getNumButtons: () => number;
		let getAllButtons: () => DebugElement[];

		let checkButtonLabelIs: 
			(buttonIndex: number, expectedLabel: string) => void;

		let getButtonByIndex: (index: number) => HTMLButtonElement;
		let setOkLabel: (label: string) => void;


		it(`should just display Cancel if that's the only label given`, () => {
			setCancelLabel(cancelLabel);
	
			expect(getNumButtons()).toBe(1);
			checkButtonLabelIs(0, cancelLabel);
		});


		setCancelLabel = (label: string) => {
			this.hostComponent.cancelLabel = label;
			this.fixture.detectChanges();
		};


		getNumButtons = () => getAllButtons().length;


		getAllButtons = () => this.getAllChildDebugElementsByCss('button');


		checkButtonLabelIs = (buttonIndex: number, expectedLabel: string) => {
			const button = getButtonByIndex(buttonIndex);
			expect(button.textContent.trim()).toBe(expectedLabel.trim());
		};


		getButtonByIndex = (index: number) => {
			const buttons = getAllButtons();
			return buttons[index].nativeElement as HTMLButtonElement;
		};


		it(`should just display OK if that's the only label given`, () => {
			setOkLabel(okLabel);

			expect(getNumButtons()).toBe(1);
			checkButtonLabelIs(0, okLabel);
		});


		setOkLabel = (label: string) => {
			this.hostComponent.okLabel = label;
			this.fixture.detectChanges();
		};


		it('should display OK and Cancel if both labels are given', () => {
			setOkLabel(okLabel);
			setCancelLabel(cancelLabel);

			expect(getNumButtons()).toBe(2);

			checkButtonLabelIs(0, okLabel);
			checkButtonLabelIs(1, cancelLabel);
		});
	

		it(`should emit 'ok' when OK button is pressed`, fakeAsync(() => {
			spyOn(this.hostComponent, 'onOk');
		
			setOkLabel(okLabel);
			const okButton = getButtonByIndex(0);
			okButton.click();

			expect(this.hostComponent.onOk).toHaveBeenCalled();
		}));


		it(`should emit 'cancel' when Cancel button is pressed`, fakeAsync(() => {
			spyOn(this.hostComponent, 'onCancel');

			setCancelLabel(cancelLabel);
			const cancelButton = getButtonByIndex(0);
			cancelButton.click();

			expect(this.hostComponent.onCancel).toHaveBeenCalled();
		}));

	}

}


new OkCancelComponentTest();

