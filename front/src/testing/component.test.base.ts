// ComponentTest cuts out much of the usual boilerplate in testing components. Write a subclass, put your Jasmine it() definitions inside defineTests(), and construct an instance; the test runner will do the rest.


import {
	TestBed,
	ComponentFixture,
	TestModuleMetadata,
	async,
} from '@angular/core/testing';

import { Type, DebugElement } from '@angular/core';

import { TestWithModule } from './test.with.module';

import {
	checkChildTextContentIs,
	checkChildHtmlContentIs,
	getChildBoundingRectByCss,
	getChildNativeElementByCss,
	getChildDebugElementByCss,
	getAllChildNativeElementsByCss,
	getAllChildDebugElementsByCss,
	getChildComponentByCss,
	getChildDirective,
	getChildDirectiveDebugElement,
	getAllChildDirectivesOfType,
	expectChildDirective,
	expectChildNativeElement,
	setChildInputValues,
	setChildInputValue,
} from './utils';



// List of globally-defined functions to be added, as members, to ComponentTest; each will have its first ('root') argument bound to this.fixture
const utilityMethodsToAdd = [
	checkChildTextContentIs,
	checkChildHtmlContentIs,
	getChildBoundingRectByCss,
	getChildNativeElementByCss,
	getChildDebugElementByCss,
	getAllChildNativeElementsByCss,
	getAllChildDebugElementsByCss,
	getChildComponentByCss,
	getChildDirective,
	getChildDirectiveDebugElement,
	getAllChildDirectivesOfType,
	expectChildDirective,
	expectChildNativeElement,
	setChildInputValues,
	setChildInputValue,
];



export abstract class ComponentTest extends TestWithModule {

	protected fixture: ComponentFixture<any>;
	protected component: any;


	constructor(
		protected componentType: Type<any>,
		protected testName: string = componentType.name,
	) {
		super(testName);

		for(let method of utilityMethodsToAdd)
			this.addUtilityMethod(method);
	}


	// Adds one of the many helper functions from ./utils.ts to this object. When calling the resulting function, first argument ('root') should be omitted, as it is assumed to be this.fixture.
	private addUtilityMethod(method: Function): void {
		this[method.name] =	this.curryUtilityMethod(method);
	}


	private curryUtilityMethod(method: Function): Function {
		return (...args: any[]) => 
			method.bind(this, this.fixture)(...args);
	}


	protected defineTests(): void {
		super.defineTests();

		beforeEach(async(() => {
			TestBed.compileComponents();

			this.fixture = TestBed.createComponent(
				this.componentType
			);

			this.component = this.fixture.debugElement.componentInstance;
		}));


		it('should initialise', () => {
			expect(this.component).toBeTruthy();
		});
	}


	// Combines the necessary component declaration with any .extraModuleMetadata
	protected getModuleMetadata(): TestModuleMetadata {
		return {
			declarations: [this.componentType],
		};
	}


	protected get rootElement(): DebugElement {
		return this.fixture.debugElement;
	}

}



// Declarations of utility methods, to keep the TypeScript compiler happy
export interface ComponentTest {

	checkChildTextContentIs(
		cssSelector: string,
		expectedContent: string
	): void;

	checkChildHtmlContentIs(
		cssSelector: string,
		expectedContent: string
	): void;

	getChildDebugElementByCss(cssSelector: string): DebugElement;
	getAllChildDebugElementsByCss(cssSelector: string): DebugElement[];
	getChildBoundingRectByCss(cssSelector: string): ClientRect;
	getChildNativeElementByCss(cssSelector: string): HTMLElement;
	getAllChildNativeElementsByCss(cssSelector: string): HTMLElement[];
	getChildComponentByCss(cssSelector: string): any;
	getChildDirective(type: Type<any>): any;
	getChildDirectiveDebugElement(Type: Type<any>): DebugElement;
	getAllChildDirectivesOfType(type: Type<any>): any[];
	expectChildDirective(type: Type<any>): any;
	expectChildNativeElement(cssSelector: string): any;
	setChildInputValues(dict: any): void;
	setChildInputValue(cssSelector: string, value: any): void;

}

