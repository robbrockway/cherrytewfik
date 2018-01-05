// Emits a whole File object, rather than just a filename, through valueChange.

import {
	Component,
	ViewChild,
	ElementRef,
	HostListener,
} from '@angular/core';

import { TypedEditComponent } from './typed.edit.component';
import { isValidImage } from 'utils';



const errorMessages = {
	invalidFormat: 'Image must be of JPEG or PNG format',
};



@Component({
	selector: 'image-edit',
	templateUrl: './image.edit.component.html',
	styleUrls: ['./image.edit.component.scss'],
})
export class ImageEditComponent extends TypedEditComponent<string | File> {

	@ViewChild('fileSelector') fileSelector: ElementRef;

	errorMessage: string;


	ngAfterViewInit(): void {
		this.showFileDialogue();
	}


	private showFileDialogue(): void {
		this.fileSelector.nativeElement.click();
	}


	onFileSelect(fileList: FileList): void {
		const file = fileList[0];

		if(isValidImage(file))
			this.valueChange.emit(file);
		else
			this.errorMessage = errorMessages.invalidFormat;
	}


	// After error
	selectAgain(): void {
		this.errorMessage = '';
		this.showFileDialogue();
	}


	@HostListener('window:click')
	onWindowClick(): void {
		this.cancel.emit();
	}

}