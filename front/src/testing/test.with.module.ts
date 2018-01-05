// Base class for any tests (of components, or services) that require bootstrapping of a test module


import {
	TestBed,
	TestModuleMetadata,
} from '@angular/core/testing';



export abstract class TestWithModule {
	
	constructor(testName: string) {
		describe(testName, () => this.defineTests());
	}


	// Should return data for initialising test module (declarations, providers etc)
	protected abstract getModuleMetadata(): TestModuleMetadata;


	protected defineTests(): void {

		beforeEach(() => {
			const moduleMetadata = this.getModuleMetadata();
			TestBed.configureTestingModule(moduleMetadata);
		});

	}

}



// Useful if a child class of TestWithModule specifies some metadata, then a grandchild class wants to add some
export function mergeModuleMetadata(
	a: TestModuleMetadata,
	b: TestModuleMetadata
): TestModuleMetadata {

	const metadata = copyModuleMetadata(a);

	// Add in b
	for(let key of Object.keys(b)) {
		const currentList = metadata[key];
		const bList = b[key];

		if(currentList)
			currentList.push(...bList);
		else
			metadata[key] = Array.from(bList);
	}

	return metadata;

}


export function copyModuleMetadata(
	original: TestModuleMetadata
): TestModuleMetadata {

	const result = {};

	for(let key of Object.keys(original))
		result[key] = Array.from(original[key]);

	return result;
}