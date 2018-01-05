import { Component } from '@angular/core';
import { TestModuleMetadata } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { Category, Piece } from 'modules/main/models';

import { StaticCategoryLinkFieldComponent }
	from './static.category.link.field.component';

import { TypedStaticFieldHostComponent }
	from '../typed.static.field.component.test.base';

import { FastLoadingStaticFieldComponentTest }
	from '../fast.loading.static.field.component.test.base';

import { mergeModuleMetadata } from 'testing';



@Component({
	template: `
		<static-category-link-field
			[object]="object"
			[propertyName]="propertyName"
			(load)="onLoad()"
		></static-category-link-field>
	`,
})
class HostComponent extends TypedStaticFieldHostComponent {}



class StaticCategoryLinkFieldComponentTest 
		extends FastLoadingStaticFieldComponentTest {

	constructor() {
		super(
			StaticCategoryLinkFieldComponent,
			HostComponent
		);
	}


	protected getModuleMetadata(): TestModuleMetadata {
		const defaultMetadata = super.getModuleMetadata();

		const extraMetadata = {
			imports: [RouterTestingModule],
		};

		return mergeModuleMetadata(defaultMetadata, extraMetadata);
	}


	protected defineTests(): void {
		super.defineTests();


		describe('should show link', () => {

			let category: Category;


			beforeEach(() => {
				category = this.testPiece.category;
				this.setComponentParams(this.testObject, 'category');
			});


			it(`with category's name`, () => {
				this.checkChildTextContentIs('a', category.name);
			});


			it(`with 'Untitled category' label, if category has no name`,
					() => {
				category.name = '';
				this.fixture.detectChanges();
				this.checkChildTextContentIs('a', 'Untitled category');
			});


			it(`with category's router link`, () => {
				const link = this.getChildDebugElementByCss('a');

				expect(link.attributes['ng-reflect-router-link'])
					.toBe(category.routerLink);
			});

		});
	}

}


new StaticCategoryLinkFieldComponentTest();