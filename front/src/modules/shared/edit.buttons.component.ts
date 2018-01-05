// Array of buttons that appears when user hovers over a chosen element. Visibility of the four available buttons is determined by whether their respective events (up, down, edit, delete) have been bound.


import {
	Component,
	Input,
	Output,
	EventEmitter,
} from '@angular/core';



export type ButtonVisibilityMask = {
	up?: boolean,
	down?: boolean,
	edit?: boolean,
	delete?: boolean,
};


export const allButtonNames = [
	'up',
	'down',
	'edit',
	'delete',
];



@Component({
	selector: 'edit-buttons',
	templateUrl: './edit.buttons.component.html',
	styleUrls: ['./edit.buttons.component.scss'],
})
export class EditButtonsComponent {

	@Input() placement: 'inside' | 'outside' | 'left'
		= 'inside';	// CSS class for main element

	@Output() up = new EventEmitter();
	@Output() down = new EventEmitter();
	@Output() edit = new EventEmitter();
	@Output() delete = new EventEmitter();

	private visibilityMask: ButtonVisibilityMask = {};


	@Input() set upVisible(val: boolean) {
		this.visibilityMask.up = val;
	}


	@Input() set downVisible(val: boolean) {
		this.visibilityMask.down = val;
	}


	@Input() set editVisible(val: boolean) {
		this.visibilityMask.edit = val;
	}


	@Input() set deleteVisible(val: boolean) {
		this.visibilityMask.delete = val;
	}


	get visibleButtonNames(): string[] {
		return allButtonNames.filter(
			(buttonName: string) => this.buttonIsVisible(buttonName)
		);
	}


	private buttonIsVisible(buttonName: string): boolean {
		const explicitVisibility = this.visibilityMask[buttonName];
		
		if(explicitVisibility == null)
			return this.outputIsBound(buttonName);

		return explicitVisibility;
	}


	private outputIsBound(buttonName: string): boolean {
		const output = this[buttonName];
		return output.observers.length > 0;
	}


	onClick(buttonName: string, event: Event): void {
		this[buttonName].emit();
		
		// If click bubbles up to window, it could interfere with other components' click detection
		event.stopPropagation();
	}

}