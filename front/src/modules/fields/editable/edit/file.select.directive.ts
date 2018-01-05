// Supplies a fileSelect event to input elements, which emits the new FileList when files are selected

import {
	Directive,
	HostListener,
	Output,
	EventEmitter,
	ElementRef,
} from '@angular/core';



@Directive({
	selector: 'input[fileSelect]',
})
export class FileSelectDirective {

	@Output() fileSelect = new EventEmitter<FileList>();


	constructor(private elementRef: ElementRef) {}


	@HostListener('change')
	onChange(): void {
		this.fileSelect.emit(this.fileList);
	}


	private get fileList(): FileList {
		const inputElement = this.elementRef.nativeElement;
		return inputElement.files;
	}

}