import { TestModuleMetadata, async } from '@angular/core/testing';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';

import {
	Piece,
	PieceService,
	TableString,
	TableStringService,
} from 'modules/main/models';

import { HomeView } from './home.view';
import { ViewTest } from 'modules/shared/view.test.base';

import {
	MockPieceTickerDirective,
	MockFieldDirective,
	MockSlowLoadingDirective,
	testPieceData,
	mergeModuleMetadata,
} from 'testing';



class HomeViewTest extends ViewTest {

	private pieceList: Piece[];

	private stringTable = {
		bio: new TableString(null,
			{key: 'bio', value: 'Biography biography'}
		),

		statement: new TableString(null,
			{key: 'statement', value: `Artist's statement`}
		),
	};


	constructor() {
		super(HomeView);
	}


	protected getModuleMetadata(): TestModuleMetadata {
		const defaultMetadata = super.getModuleMetadata();

		const extraMetadata = {
			declarations: [
				MockPieceTickerDirective,
				MockFieldDirective,
			],

			providers: [
				{
					provide: PieceService,
					useFactory: this.createMockPieceService,
				},

				{
					provide: TableStringService,
					useFactory: this.createMockTableStringService,
				},
			],
		};

		return mergeModuleMetadata(defaultMetadata, extraMetadata);
	}


	private createMockPieceService = () => {
		this.pieceList = testPieceData.toListOfModelInstances();

		return {
			lazyList: () => Observable.of(this.pieceList),
		};
	};


	private createMockTableStringService = () => {
		return {
			dict: () => Observable.of(this.stringTable),
		};
	};


	protected defineTests(): void {
		super.defineTests();


		let checkMockFieldComponentHasCorrectParams: (
			fieldIndex: number,
			expectedTableString: TableString
		) => void;


		beforeEach(() => {
			this.fixture.detectChanges();
		});


		it('should show two PieceTickerComponents', () => {
			expect(this.mockPieceTickerComponents.length)
				.toBe(2);
		});

		
		it('should pass complete list of pieces to both '
				+ 'PieceTickerComponents', () => {
			for(
				let mockPieceTickerComponent
				of this.mockPieceTickerComponents
			) {
				expect(mockPieceTickerComponent.pieces)
					.toBe(this.pieceList);
			}
		});


		it(`shouldn't emit load event before both `
				+ 'PieceTickerComponents have loaded', async(() => {

			const firstMockPieceTickerComponent =
				this.getChildDirective(MockPieceTickerDirective);

			firstMockPieceTickerComponent.load.emit();
			
			expect(this.mockLoadScreenService.show).not.toHaveBeenCalled();
		}));


		it(`should show artist's statement with first FieldComponent`,
				() => {
			checkMockFieldComponentHasCorrectParams(
				0,
				this.stringTable.statement
			);
		});


		checkMockFieldComponentHasCorrectParams = (
			fieldIndex: number,
			expectedTableString: TableString
		) => {
			const mockFieldComponent =
				this.mockFieldComponents[fieldIndex];

			expect(mockFieldComponent.object)
				.toBe(expectedTableString);

			expect(mockFieldComponent.propertyName).toBe('value');
			expect(mockFieldComponent.type).toBe('multiline');
		};


		it('should show biography with second FieldComponent', () => {
			checkMockFieldComponentHasCorrectParams(
				1,
				this.stringTable.bio
			);
		});


		it('should give correct labels to FieldComponents', () => {
			const components = this.mockFieldComponents;
			expect(components[0].label).toBe(`artist's statement`);
			expect(components[1].label).toBe('biography');
		});

	}


	protected get mockPieceTickerComponents(): MockPieceTickerDirective[] {
		return this.getAllChildDirectivesOfType(MockPieceTickerDirective);
	}


	protected get mockFieldComponents(): MockFieldDirective[] {
		return this.getAllChildDirectivesOfType(MockFieldDirective);
	}


	protected triggerLoadScreenHide(): void {
		for(
			let mockSubcomponent
			of this.allMockSubcomponents
		) {
			mockSubcomponent.load.emit();
		}
	}


	protected get allMockSubcomponents(): MockSlowLoadingDirective[] {
		const array: MockSlowLoadingDirective[] = [];

		array.push(
			...this.mockPieceTickerComponents,
			...this.mockFieldComponents
		);
		
		return array;
	}

}


new HomeViewTest();
