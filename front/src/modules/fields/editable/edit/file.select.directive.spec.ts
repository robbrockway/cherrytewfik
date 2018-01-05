import { Component } from '@angular/core';
import { TestModuleMetadata, async } from '@angular/core/testing';

import { FileSelectDirective } from './file.select.directive';
import { ComponentTest } from 'testing';



@Component({
	template: `
		<input type="file" (fileSelect)="onFileSelect($event)" />
	`,
})
class HostComponent {
	onFileSelect = jasmine.createSpy('onFileSelect');
}



class FileSelectDirectiveTest extends ComponentTest {

	constructor() {
		super(HostComponent, 'FileSelectDirective');
	}


	protected getModuleMetadata(): TestModuleMetadata {
		const metadata = super.getModuleMetadata();
		metadata.declarations.push(FileSelectDirective);
		return metadata;
	}


	protected defineTests(): void {
		super.defineTests();

		let inputElement: HTMLInputElement;


		beforeEach(() => {
			this.fixture.detectChanges();

			inputElement = this.getChildNativeElementByCss(
				'input'
			) as HTMLInputElement;
		});


		it('should emit FileList from input element, using fileSelect '
				+ 'event, when files are selected', async(() => {
			inputElement.dispatchEvent(new Event('change'));

			expect(this.component.onFileSelect)
				.toHaveBeenCalledWith(inputElement.files);
		}));

	}

}


new FileSelectDirectiveTest();
