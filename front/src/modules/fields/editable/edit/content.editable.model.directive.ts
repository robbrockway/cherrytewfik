// Two-way data binding for HTML elements with contenteditable="true"

import {
	Directive,
	ElementRef,
	HostListener,
	Input,
	Output,
	EventEmitter,
} from '@angular/core';



@Directive({
	selector: '[contenteditableModel]',
})
export class ContentEditableModelDirective {

	@Input('contenteditableModel') value: string;

	@Output('contenteditableModelChange')
	private valueChange = new EventEmitter<string>();


	constructor(private elementRef: ElementRef) {}


	ngOnChanges() {
		this.updateView();
	}


	private updateView(): void {
		if(this.innerHTML !== this.value)
			this.innerHTML = this.value;	// Only update if necessary, as this will reset the cursor position
	}


	@HostListener('input')
	@HostListener('textinput')
	onInput(): void {
		const content = this.innerText.trim();
		
		if(!content)
			this.innerHTML = '';	// Get rid of stray <br> tags, etc

		this.valueChange.emit(this.innerHTML);
	}


	// IE sometimes (e.g. on backspace) doesn't fire input or textinput events, so input should be caught here instead
	@HostListener('keyup')
	onKeyUp(): void {
		if(this.innerHTML !== this.value)
			this.onInput();
	}


	private get nativeElement(): HTMLElement {
		return this.elementRef.nativeElement;
	}


	private get innerText(): string {
		return this.nativeElement.innerText;
	}


	private set innerHTML(innerHTML: string) {
		this.nativeElement.innerHTML = innerHTML;
	}


	private get innerHTML(): string {
		return this.nativeElement.innerHTML;
	}

}