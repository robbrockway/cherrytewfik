import { Component, Input, Output, EventEmitter } from '@angular/core';



@Component({
	selector: 'ok-cancel',
	templateUrl: 'ok.cancel.component.html',
	styles: ['ok.cancel.component.scss'],
})
export class OkCancelComponent {

	@Input() okLabel: string;
	@Input() cancelLabel: string;

	@Output() ok = new EventEmitter();
	@Output() cancel = new EventEmitter();


	onOk(): void {
		this.ok.emit();
	}


	onCancel(): void {
		this.cancel.emit();
	}

}