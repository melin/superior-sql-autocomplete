import { SqlAutoComplete } from '../src/SqlAutoComplete';
import {AutocompleteOption} from "../src/models/AutocompleteOption";
import {AutocompleteOptionType} from "../src/models/AutocompleteOptionType";

describe('Select 语句', () => {
    it('Select 关键词', () => {
        expect(new SqlAutoComplete().autocomplete("sel")).toContainEqual(
            new AutocompleteOption("SELECT", AutocompleteOptionType.KEYWORD))
    });

    it('From 关键词', () => {
        expect(new SqlAutoComplete().autocomplete("select * fr")).toContainEqual(
            new AutocompleteOption("FROM", AutocompleteOptionType.KEYWORD))
    });

    it('tableName', () => {
        const tableNames = ["hello", "demo_tbl_one"]
        expect(new SqlAutoComplete(tableNames, [])
            .autocomplete("select * from demo_")).toContainEqual(
            new AutocompleteOption("demo_tbl_one", AutocompleteOptionType.TABLE))
    });

    it('columnName', () => {
        const tableNames = ["hello", "demo_tbl_one"]
        const columnNames = ["name", "address"]
        expect(new SqlAutoComplete(tableNames, columnNames)
            .autocomplete("select na from demo_tbl_one", 9)).toContainEqual(
            new AutocompleteOption("demo_tbl_one", AutocompleteOptionType.TABLE))
    });
});
