import { Component, DebugElement, Type } from '@angular/core';

import {
	TestBed,
	ComponentFixture,
	async,
} from '@angular/core/testing';

import { By } from '@angular/platform-browser';

import { 
	allButtonNames,
	ButtonVisibilityMask,
	EditButtonsComponent,
} from './edit.buttons.component';



// Multiple host components are necessary to test event binding and its effect on button visibility
abstract class HostComponentBase {

	placement: string;
	visibilityMask: ButtonVisibilityMask = {};
	onClick = jasmine.createSpy('onClick');


	static createTemplate(...buttonsToBind: string[]): string {
		const bindings = buttonsToBind.map((buttonName: string) =>
			`(${buttonName})="onClick('${buttonName}')"`
		).join('\n');

		return `
			<edit-buttons
				[upVisible]="visibilityMask.up"
				[downVisible]="visibilityMask.down"
				[editVisible]="visibilityMask.edit"
				[deleteVisible]="visibilityMask.delete"
				[placement]="placement"
				${bindings}
			></edit-buttons>
		`;
	}

}



@Component({
	template: HostComponentBase.createTemplate(),
})
class GenericHostComponent extends HostComponentBase {}



@Component({
	template: HostComponentBase.createTemplate('edit', 'delete'),
})
class EditDeleteHostComponent extends HostComponentBase {}



@Component({
	template: HostComponentBase.createTemplate('up', 'down', 'delete'),
})
class UpDownDeleteHostComponent extends HostComponentBase {}



describe('EditButtonsComponent', () => {

	let fixture: ComponentFixture<HostComponentBase>;
	let hostComponent: HostComponentBase;

	let getMainElement: () => HTMLElement;
	let initHostComponent: (type: Type<HostComponentBase>) => void;
	let getButtons: () => DebugElement[];
	let checkForButtons: (...buttonNames: string[]) => void;


	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [
				GenericHostComponent,
				EditDeleteHostComponent,
				UpDownDeleteHostComponent,
				EditButtonsComponent,
			],
		}).compileComponents();
	}));


	it('should create the component', () => {
		initHostComponent(GenericHostComponent);
		expect(hostComponent).toBeTruthy();
	});


	initHostComponent = (type: Type<HostComponentBase>) => {
		fixture = TestBed.createComponent(type);
		hostComponent = fixture.debugElement.componentInstance;
	};


	it(`should assign 'placement' input value to main element's CSS class`,
			() => {
		initHostComponent(GenericHostComponent);

		for(let placement of ['inside', 'outside', 'left']) {
			hostComponent.placement = placement;
			fixture.detectChanges();
			const mainElement = getMainElement();
			expect(mainElement.classList).toContain(placement);
		}
	});


	getMainElement = () => {
		const debugElement = 
			fixture.debugElement.query(By.css('.editButtons'));

		return debugElement.nativeElement;
	};


	describe(
		'should show correct combination of buttons '
		+ 'when their respective events are bound:', 
			() => {

		it('edit/delete', () => {
			initHostComponent(EditDeleteHostComponent);
			checkForButtons('edit', 'delete');
		});


		it('up/down/delete', () => {
			initHostComponent(UpDownDeleteHostComponent);
			checkForButtons('up', 'down', 'delete');
		});

	});


	describe('should emit the correct event signals:', () => {

		let testEventSignals: (...buttonNames: string[]) => void;


		it('edit/delete', async(() => {
			initHostComponent(EditDeleteHostComponent);
			testEventSignals('edit', 'delete');
		}));


		testEventSignals = (...buttonNames: string[]) => {
			const buttons = getButtons();
			
			buttonNames.forEach((buttonName: string, index: number) => {
				const button = buttons[index];
				button.nativeElement.click();

				expect(hostComponent.onClick)
					.toHaveBeenCalledWith(buttonName);
			});
		};


		it('up/down/delete', async(() => {
			initHostComponent(UpDownDeleteHostComponent);
			testEventSignals('up', 'down', 'delete');
		}));

	});


	getButtons = () => {
		fixture.detectChanges();
		return fixture.debugElement.queryAll(By.css('img'));
	};


	checkForButtons = (...buttonNames: string[]) => {
		const buttons = getButtons();
		expect(buttons.length).toBe(buttonNames.length);

		buttons.forEach((button: DebugElement, index: number) => {
			const buttonName = buttonNames[index];
			const buttonImageFilename = button.nativeElement.src;
			expect(buttonImageFilename).toContain(buttonName);
		});
	};


	it('should show unbound buttons when requested explicitly', () => {
		initHostComponent(GenericHostComponent);
		
		for(let buttonName of allButtonNames)
			hostComponent.visibilityMask[buttonName] = true;
		
		fixture.detectChanges();
		checkForButtons(...allButtonNames);
	});


	it('should hide bound buttons when requested explicitly', () => {
		initHostComponent(UpDownDeleteHostComponent);

		for(let buttonName of allButtonNames)
			hostComponent.visibilityMask[buttonName] = false;

		fixture.detectChanges();
		checkForButtons();	// no args, i.e. make sure there are no buttons
	});


	it('should stop click events from bubbling up to window',
			async(() => {
		initHostComponent(EditDeleteHostComponent);
		
		const windowSpy = jasmine.createSpy('onClick');
		window.addEventListener('click', windowSpy);

		for(let button of getButtons()) {
			windowSpy.calls.reset();
			button.nativeElement.click();
			expect(windowSpy).not.toHaveBeenCalled();
		}
	}));

});