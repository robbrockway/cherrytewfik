import {
	TestModuleMetadata,
	async,
	fakeAsync,
	flushMicrotasks,
	TestBed,
} from '@angular/core/testing';

import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';

import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';

import { AppComponent } from './app.component';
import { CategoryService } from './models';
import { LoadScreenService } from './load-screen';
import { WindowService } from './window.service';

import {
	MockCategoryListDirective,
	MockDialogueDirective,
	MockNotificationDirective,
	MockLoadScreenDirective,
	MockLoginDirective,
	MockStickyNavBarDirective,
	MockScrollToTopOnNavigationDirective,
	ComponentTest,
	mergeModuleMetadata,
	testCategoryData,
} from 'testing';



class AppComponentTest extends ComponentTest {

	private mockLoadScreenService: any;


	constructor() {
		super(AppComponent);
	}


	protected getModuleMetadata(): TestModuleMetadata {
		const defaultMetadata = super.getModuleMetadata();

		this.mockLoadScreenService = this.createMockLoadScreenService();

		const extraMetadata = {
			providers: [
				{
					provide: CategoryService,
					useFactory: this.createMockCategoryService,
				},

				{
					provide: LoadScreenService,
					useValue: this.mockLoadScreenService,
				},

				{
					provide: WindowService,
					useFactory: this.createMockWindowService,
				},
			],

			declarations: [
				MockDialogueDirective,
				MockNotificationDirective,
				MockCategoryListDirective,
				MockLoadScreenDirective,
				MockLoginDirective,
				MockStickyNavBarDirective,
				MockScrollToTopOnNavigationDirective,
			],

			imports: [
				RouterTestingModule,
				FormsModule,
			],
		};

		return mergeModuleMetadata(defaultMetadata, extraMetadata);
	}


	private createMockCategoryService = () => {
		const categories = testCategoryData.toListOfModelInstances();
		return {list: () => Observable.of(categories)};
	};


	private createMockLoadScreenService(): any {
		return {visibility$: new Subject<boolean>()};
	}


	private createMockWindowService = () => {
		return jasmine.createSpyObj('WindowService', ['emitState']);
	};


	protected defineTests(): void {
		super.defineTests();

		let loadScreenIsVisible: () => boolean;
		let setLoadScreenVisibility: (visible: boolean) => void;


		beforeEach(() => {
			this.fixture.detectChanges();
		});


		it('should tell WindowService to emit its state, on initialisation',
				() => {
			const mockWindowService = TestBed.get(WindowService);
			expect(mockWindowService.emitState).toHaveBeenCalled();
		});


		it('should supply categories to CategoryListComponent', () => {
			const mockCategoryListComponent = 
				this.getChildDirective(MockCategoryListDirective);

			const categories = mockCategoryListComponent.objects;
			testCategoryData.checkModelInstancesMatch(categories);
		});


		it('should show load screen at first', () => {
			expect(loadScreenIsVisible()).toBe(true);
		});


		loadScreenIsVisible = () => {
			const mockLoadScreenComponent =
				this.getChildDirective(MockLoadScreenDirective);

			return mockLoadScreenComponent.visible;
		};


		it('should hide load screen after receiving hide message',
				fakeAsync(() => {
			setLoadScreenVisibility(false);
			expect(loadScreenIsVisible()).toBe(false);
		}));


		setLoadScreenVisibility = (visible: boolean) => {
			this.mockLoadScreenService.visibility$.next(visible);
			flushMicrotasks();
			this.fixture.detectChanges();
		}


		it('should hide initial load screen, if existent, after receiving '
				+ `'hide' message`, fakeAsync(() => {
			// Initial load screen exists outside Angular, as a native HTML element
			const initialLoadScreen = document.createElement('div');
			initialLoadScreen.className = 'initialLoadScreen visible';
			document.body.appendChild(initialLoadScreen);

			setLoadScreenVisibility(false);
			expect(initialLoadScreen.className).toBe('initialLoadScreen');
		}));


		it(`should show load screen again after receiving 'show' message`,
				fakeAsync(() => {
			setLoadScreenVisibility(false);
			setLoadScreenVisibility(true);
			expect(loadScreenIsVisible()).toBe(true);
		}));


		it('should include login component', () => {
			this.expectChildDirective(MockLoginDirective).toBeTruthy();
		});


		it(`should change nav bar's CSS class when StickyNavBarDirective `
				+ 'says so', async(() => {
			const className = 'claaaass';

			const mockStickyNavBarDirective =
				this.getChildDirective(MockStickyNavBarDirective);

			mockStickyNavBarDirective.classChange.emit(className);
			this.fixture.detectChanges();

			const navSelector = 'nav.' + className;
			this.expectChildNativeElement(navSelector).toBeTruthy();
		}));

	}

}


new AppComponentTest();
