// Base class for component consisting solely of a contenteditable element, which emits 'valueChange' when blurred or when enter is pressed, and emits 'cancel' when escape is pressed

import {
	ViewChild,
	ElementRef,
	ChangeDetectorRef,
} from '@angular/core';

import { TypedEditComponent } from './typed.edit.component';



export abstract class PlainEditComponent<T> extends TypedEditComponent<T> {

	@ViewChild('textBox') textBox: ElementRef;

	allowLinebreaks: boolean = false;
	
	// Will stay empty if prompt is currently visible, as opposed to .boxContents which would contain the prompt message
	displayedValue: string;


	constructor(protected changeDetector: ChangeDetectorRef) {
		super();
	}


	ngAfterContentInit(): void {
		this.boxContents = this.internalValueToString(this.value);
	}


	// Render value for display on screen
	protected abstract internalValueToString(value: T): string;


	ngAfterViewInit(): void {
		this.selectAll();
	}


	private selectAll(): void {
		const selection = window.getSelection();
		selection.removeAllRanges();
		selection.addRange(this.completeSelectionRange);
	}


	// Covering the text box's entire contents
	private get completeSelectionRange(): Range {
		const range = document.createRange();
		range.selectNodeContents(this.textBox.nativeElement);
		return range;
	}


	get showingPrompt(): boolean {
		return !this.displayedValue;
	}


	get boxContents(): string {
		return this.displayedValue || this.promptMessage;
	}


	private get promptMessage(): string {
		return `Add ${this.label}`;
	}


	set boxContents(value: string) {
		this.displayedValue = value;
	}


	onKeyDown(event: KeyboardEvent): void {
		if(!this.shouldAllowKeyDown(event))
			event.preventDefault();
	}


	protected shouldAllowKeyDown(event: KeyboardEvent): boolean {
		return !this.isAboutToRubOutPromptMessage(event);
	}


	private isAboutToRubOutPromptMessage(event: KeyboardEvent): boolean {
		return this.showingPrompt &&
			(event.key === 'Backspace' || event.key === 'Delete');
	}


	private get cursorIsInFinalPosition(): boolean {
		const selection = window.getSelection();
		const range = selection.getRangeAt(0);
		return range.endOffset >= this.boxContents.length;
	}


	onKeyPress(event: KeyboardEvent): void {
		if(!this.shouldAllowKeyPress(event)) {
			event.preventDefault();
		} else {
			// Prompt text is selected; key event goes through, and replaces prompt text with new character
			this.selectAllIfShowingPrompt(); 
		}
	}


	protected shouldAllowKeyPress(event: KeyboardEvent): boolean {
		return event.key !== 'Enter' || this.shouldAllowLinebreak(event);
	}


	private selectAllIfShowingPrompt(): void {
		// Make sure prompt is actually displayed, not just waiting
		this.changeDetector.detectChanges();

		if(this.showingPrompt)
			this.selectAll();
	}


	// Already assumes key is Enter
	protected shouldAllowLinebreak(event: KeyboardEvent): boolean {
		return this.allowLinebreaks && event.shiftKey;
	}


	onEnterKeyUp(event: KeyboardEvent): void {
		if(!this.shouldAllowLinebreak(event))
			this.save();	// Don't save if we just want to create a new line
	}


	private save(): void {
		this.textBox.nativeElement.blur();
	}


	onInput(newContents: string): void {
		if(!newContents) {
			this.changeDetector.detectChanges();	// Box is empty; show prompt
			this.selectAll();
		}
	}


	onBlur(): void {
		const value = this.stringToInternalValue(this.displayedValue);
		this.valueChange.emit(value);
	}


	protected abstract stringToInternalValue(string: string): T;

}