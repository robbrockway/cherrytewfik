import { TestModuleMetadata, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import {
	Dialogue,
	DialogueService,
 } from './dialogue.service';

import { DialogueComponent } from './dialogue.component';

import {
	MockFormDirective,
	MockOkCancelDirective,
	testDialogue,
	testFormDialogue,
	ComponentTest,
	mergeModuleMetadata,
} from 'testing';



class DialogueComponentTest extends ComponentTest {

	constructor() {
		super(DialogueComponent);
	}


	protected getModuleMetadata(): TestModuleMetadata {
		const defaultMetadata = super.getModuleMetadata();

		const extraMetadata = {
			imports: [FormsModule],

			declarations: [
				MockFormDirective,
				MockOkCancelDirective,
			],

			providers: [DialogueService],
		};

		return mergeModuleMetadata(defaultMetadata, extraMetadata);
	}


	protected defineTests(): void {
		super.defineTests();

		let service: DialogueService;

		let shroudIsVisible: () => boolean;

		let showDialogue: (
			dialogue?: Dialogue,
			onOk?: (response: any) => void,
			onCancel?: () => void
		) => void;

		let pressButton: (name: string) => void;


		beforeEach(() => {
			service = TestBed.get(DialogueService);
		});


		it('should hide the shroud at first', () => {
			this.fixture.detectChanges();
			expect(shroudIsVisible()).toBeFalsy();
		});


		shroudIsVisible = () => {
			const shroud = this.getChildDebugElementByCss('.shroud');
			return shroud.classes.visible;
		};


		it('should show dialogue on request', () => {
			showDialogue();
			expect(shroudIsVisible()).toBeTruthy();
		});


		showDialogue = (
			dialogue = testDialogue,
			onOk?: () => void,
			onCancel?: () => void
		) => {
			service.show(dialogue, onOk, onCancel);
			this.fixture.detectChanges();
		};


		it('should show dialogue heading', () => {
			showDialogue();
			this.checkChildTextContentIs('h1', testDialogue.heading);
		});


		it('should show dialogue message', () => {
			showDialogue();
			this.checkChildTextContentIs('p', testDialogue.message);
		});


		it('should pass form, if one is supplied, to FormComponent', () => {
			showDialogue(testFormDialogue);

			const mockFormComponent =
				this.getChildDirective(MockFormDirective);

			expect(mockFormComponent.form).toBe(testFormDialogue.form);
		});


		it('should omit FormComponent if no form is supplied', () => {
			showDialogue();

			const mockFormComponent =
				this.getChildDirective(MockFormDirective);

			expect(mockFormComponent).toBeFalsy();
		});


		it('should pass correct labels to OkCancelComponent', () => {
			showDialogue();

			const mockOkCancelComponent = 
				this.getChildDirective(MockOkCancelDirective);

			expect(mockOkCancelComponent.okLabel)
				.toBe(testDialogue.buttonLabels.ok);

			expect(mockOkCancelComponent.cancelLabel)
				.toBe(testDialogue.buttonLabels.cancel);
		});


		it('should call onOk() when OK is pressed', done => {
			const onOk = done;
			showDialogue(testDialogue, onOk);

			const mockOkCancelComponent = this.getChildDirective(MockOkCancelDirective);
			mockOkCancelComponent.ok.emit();
		});


		it('should call onCancel() when Cancel is pressed', done => {
			const onCancel = done;
			showDialogue(testDialogue, null, onCancel);

			const mockOkCancelComponent = 
				this.getChildDirective(MockOkCancelDirective);

			mockOkCancelComponent.cancel.emit();
		});


		describe('should close', () => {

			let mockOkCancelComponent: MockOkCancelDirective;


			beforeEach(() => {
				showDialogue();

				mockOkCancelComponent = 
					this.getChildDirective(MockOkCancelDirective);
			});


			it('when OK is pressed', () => {
				mockOkCancelComponent.ok.emit();
			});


			it('when Cancel is pressed', () => {
				mockOkCancelComponent.cancel.emit();
			});


			afterEach(() => {
				this.fixture.detectChanges();
				expect(shroudIsVisible()).toBeFalsy();
			});

		});
	}

}


new DialogueComponentTest();
