import { Component } from '@angular/core';
import { TestModuleMetadata, async } from '@angular/core/testing';

import { ImageEditComponent } from './image.edit.component';

import { EditHostComponent } from '../edit.component.test.base';

import { TypedEditComponentTestBase }
	from './typed.edit.component.test.base';

import { MockFileSelectDirective, clickOnWindow } from 'testing';



type ImageFieldType = File | string;



@Component({
	template: `		
		<image-edit
			[(value)]="value"
			(valueChange)="onValueChange($event)"
			(cancel)="onCancel()"
			[label]="label"
		></image-edit>
	`,
})
class HostComponent extends EditHostComponent<ImageFieldType> {}



class ImageEditComponentTest
		extends TypedEditComponentTestBase<ImageFieldType> {

	constructor() {
		super(ImageEditComponent, HostComponent);
	}


	protected getModuleMetadata(): TestModuleMetadata {
		const metadata = super.getModuleMetadata();
		metadata.declarations.push(MockFileSelectDirective);
		return metadata;
	}


	protected defineTests(): void {
		super.defineTests();

		let inputElement: HTMLInputElement;
		let mockFileSelectDirective: MockFileSelectDirective;

		let ngAfterViewInit: () => void;

		let spyOnInitialInputClick: () => void;
		let saveNgAfterViewInitMethod: () => void;
		let insertClickSpyBeforeViewInitHook: () => void;
		let selectMockFile: (filename: string) => void;
		let createMockFileList: (file: File) => FileList;
		let expectErrorMessage: () => any;
		let getEmittedValue: () => File;



		beforeEach(() => {
			spyOnInitialInputClick();

			this.fixture.detectChanges();
		
			mockFileSelectDirective =
				this.getChildDirective(MockFileSelectDirective);
		});


		spyOnInitialInputClick = () => {
			saveNgAfterViewInitMethod();

			// Slip spy in, when input element has been created but not yet opened
			spyOn(this.hostedComponent, 'ngAfterViewInit')
				.and.callFake(insertClickSpyBeforeViewInitHook);
		};


		saveNgAfterViewInitMethod = () => {
			const method = this.hostedComponent.ngAfterViewInit;
			ngAfterViewInit = method.bind(this.hostedComponent);
		};


		insertClickSpyBeforeViewInitHook = () => {
			inputElement = this.getChildNativeElementByCss(
				'input'
			) as HTMLInputElement;

			spyOn(inputElement, 'click');

			// Call the method that this one is replacing
			ngAfterViewInit();
		};


		it('should open file selector, on loading', () => {
			expect(inputElement.click).toHaveBeenCalled();
		});


		it('should show error message if file has wrong extension',
				async(() => {
			const badFilenames = 
				['image.tiff', 'notanimage.html', 'badbadbad.exe'];

			for(let filename of badFilenames) {
				selectMockFile(filename);
				expectErrorMessage().toContain('format');
			}
		}));


		selectMockFile = (filename: string) => {
			const file = new File([], filename);
			const fileList = createMockFileList(file);
			mockFileSelectDirective.fileSelect.emit(fileList);
			this.fixture.detectChanges();
		};


		// Some TS sleight of hand
		createMockFileList = (file: File) =>
			[file] as any as FileList;


		expectErrorMessage = () => {
			const errorMessage =
				this.getChildNativeElementByCss('.error');

			return expect(errorMessage.textContent);
		};


		it('should hide error message when file selector is reopened',
				async(() => {
			selectMockFile('invalid.file');
			const tryAgainLink = this.getChildNativeElementByCss('a');
			tryAgainLink.click();
			this.fixture.detectChanges();
		}));


		it('should emit File object through valueChange, once selected',
				async(() => {
			const filename = 'file.jpg';
			selectMockFile(filename);
			const emittedFile = getEmittedValue();
			expect(emittedFile.name).toBe(filename);
		}));


		getEmittedValue = () => {
			const call = 
				this.hostComponent.onValueChange
					.calls.mostRecent();

			return call.args[0];
		};


		it('should emit cancel when window is clicked', async(() => {
			clickOnWindow();
			expect(this.hostComponent.onCancel).toHaveBeenCalled();
		}));
		
	}

}


new ImageEditComponentTest();
