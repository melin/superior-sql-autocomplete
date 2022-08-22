import { SqlAutoComplete } from '../src/SqlAutoComplete';

describe('Select 语句', () => {
    it('Select 关键词', () => {
        expect(new SqlAutoComplete().autocomplete("sel")).toContain("SELECT")
    });
});
