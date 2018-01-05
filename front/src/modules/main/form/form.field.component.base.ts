// For FormFieldComponent and LoginFormFieldComponent

import {
	Input,
	Output,
	EventEmitter,
	ViewChild,
	ElementRef,
} from '@angular/core';

import { FormField } from './form';



export abstract class FormFieldComponentBase {

	@Input() field: FormField;
	@Output() input = new EventEmitter<Event>();	// Reemission of input event from input box
	@Output() enter = new EventEmitter();	// for when enter is pressed

	@ViewChild('inputBox') inputBox: ElementRef;


	ngAfterViewInit(): void {
		this.field.focus$.subscribe(() => this.focus());
	}


	private focus(): void {
		this.inputBox.nativeElement.focus();
	}


	onInput(event: Event): void {
		this.input.emit(event);
	}


	onEnter(): void {
		this.enter.emit();
	}

}