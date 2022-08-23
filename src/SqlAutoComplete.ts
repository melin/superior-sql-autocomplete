import {
    CommonTokenStream,
    ANTLRErrorListener,
    Token,
    ConsoleErrorListener,
    CharStreams
} from "antlr4ts";
import { PredictionMode } from "antlr4ts/atn";

import { CodeCompletionCore } from "antlr4-c3";
import {Lexer} from "antlr4ts/Lexer";
import {Parser} from "antlr4ts/Parser";
import { CaseChangingStream } from "./models/CaseChangingStream";
import { SimpleSQLTokenizer } from "./models/SimpleSQLTokenizer";
import { AutocompleteOption } from "./models/AutocompleteOption";
import { SparkSqlLexer } from "./spark/SparkSqlLexer";
import { SparkSqlParser } from "./spark/SparkSqlParser";
import { AutocompleteOptionType } from "./models/AutocompleteOptionType";

export class SqlAutoComplete {
    tableNames: string[] = [];
    columnNames: string[] = [];

    constructor(tableNames?: string[], columnNames?: string[]) {
        if (tableNames !== null && tableNames !== undefined) {
            this.tableNames.push(...tableNames);
        }
        if (columnNames !== null && columnNames !== undefined) {
            this.columnNames.push(...columnNames);
        }
    }

    autocomplete(sqlScript: string, atIndex?: number): AutocompleteOption[] {
        const tokens = this._getTokens(sqlScript);
        const parser = this._getParser(tokens);
        const core = new CodeCompletionCore(parser);

        const preferredRulesTable = [SparkSqlParser.RULE_multipartIdentifier, SparkSqlParser.RULE_tableIdentifier]
        const preferredRulesColumn = [SparkSqlParser.RULE_identifier]
        const preferredRuleOptions = [preferredRulesTable, preferredRulesColumn];

        const ignoreTokens = [
            SparkSqlParser.DOT,
            SparkSqlParser.COMMA,
            SparkSqlParser.LEFT_PAREN,
            SparkSqlParser.RIGHT_PAREN
        ];
        core.ignoredTokens = new Set(ignoreTokens);
        let indexToAutocomplete = sqlScript.length;
        if (atIndex !== null && atIndex !== undefined) {
            indexToAutocomplete = atIndex;
        }
        const simpleSQLTokenizer = new SimpleSQLTokenizer(sqlScript, true);
        const allTokens = new CommonTokenStream(simpleSQLTokenizer);
        const tokenIndex = this._getTokenIndexAt(allTokens.getTokens(), sqlScript, indexToAutocomplete);
        if (tokenIndex === null) {
            return null;
        }
        const token: any = allTokens.getTokens()[tokenIndex];
        const tokenString = this._getTokenString(token, sqlScript, indexToAutocomplete);
        tokens.fill(); // Needed for CoreCompletionCore to process correctly, see: https://github.com/mike-lischke/antlr4-c3/issues/42
        const autocompleteOptions: AutocompleteOption[] = [];

        let isTableCandidatePosition = false;
        let isColumnCandidatePosition = false;
        for (const preferredRules of preferredRuleOptions) {
            core.preferredRules = new Set(preferredRules);
            const candidates = core.collectCandidates(tokenIndex);
            for (const candidateToken of candidates.tokens) {
                let candidateTokenValue = parser.vocabulary.getDisplayName(candidateToken[0]);

                if (candidateTokenValue.startsWith("'") && candidateTokenValue.endsWith("'")) {
                    candidateTokenValue = candidateTokenValue.substring(1, candidateTokenValue.length - 1);
                }

                let followOnTokens = candidateToken[1];
                for (const followOnToken of followOnTokens) {
                    let followOnTokenValue = parser.vocabulary.getDisplayName(followOnToken);
                    if (followOnTokenValue.startsWith("'") && followOnTokenValue.endsWith("'")) {
                        followOnTokenValue = followOnTokenValue.substring(1, followOnTokenValue.length - 1);
                    }
                    if (!(followOnTokenValue.length === 1 && /[^\w\s]/.test(followOnTokenValue))) {
                        candidateTokenValue += ' ';
                    }
                    candidateTokenValue += followOnTokenValue;
                }

                if (tokenString.length === 0 || (candidateTokenValue.startsWith(tokenString.toUpperCase()))) {
                    autocompleteOptions.push(new AutocompleteOption(candidateTokenValue, AutocompleteOptionType.KEYWORD));
                }
            }

            for (const rule of candidates.rules) {
                if (preferredRulesTable.includes(rule[0])) {
                    isTableCandidatePosition = true;
                }
                if (preferredRulesColumn.includes(rule[0])) {
                    isColumnCandidatePosition = true;
                }
            }
        }

        if (isTableCandidatePosition) {
            for (const tableName of this.tableNames) {
                if (tableName.toUpperCase().startsWith(tokenString.toUpperCase())) {
                    autocompleteOptions.unshift(new AutocompleteOption(tableName, AutocompleteOptionType.TABLE));
                }
            }
            if (autocompleteOptions.length === 0 || autocompleteOptions[0].optionType !== AutocompleteOptionType.TABLE) {
                // If none of the table options match, still identify this as a potential table location
                autocompleteOptions.unshift(new AutocompleteOption(null, AutocompleteOptionType.TABLE));
            }
        }
        if (isColumnCandidatePosition) {
            for (const columnName of this.columnNames) {
                if (columnName.toUpperCase().startsWith(tokenString.toUpperCase())) {
                    autocompleteOptions.unshift(new AutocompleteOption(columnName, AutocompleteOptionType.COLUMN));
                }
            }
            if (autocompleteOptions.length === 0 || autocompleteOptions[0].optionType !== AutocompleteOptionType.COLUMN) {
                // If none of the column options match, still identify this as a potential column location
                autocompleteOptions.unshift(new AutocompleteOption(null, AutocompleteOptionType.COLUMN));
            }
        }

        return autocompleteOptions
    }

    _getTokens(sqlScript: string, errorListeners?: ANTLRErrorListener<any>[]): CommonTokenStream {
        const chars = CharStreams.fromString(sqlScript)
        const caseChangingCharStream = new CaseChangingStream(chars, true);
        let lexer: Lexer = new SparkSqlLexer(caseChangingCharStream);
        if (errorListeners !== null && errorListeners !== undefined) {
            lexer.removeErrorListener(ConsoleErrorListener.INSTANCE);
            for (const listener of errorListeners) {
                lexer.addErrorListener(listener);
            }
        }
        return new CommonTokenStream(lexer);
    }

    _getParser(tokens: CommonTokenStream, errorListeners?: ANTLRErrorListener<any>[]): Parser {
        let parser: Parser = new SparkSqlParser(tokens);
        if (errorListeners !== null && errorListeners !== undefined) {
            parser.removeErrorListener(ConsoleErrorListener.INSTANCE);
            for (const listener of errorListeners) {
                parser.addErrorListener(listener);
            }
        }

        parser.interpreter.setPredictionMode(PredictionMode.LL);
        return parser;
    }

    _getTokenIndexAt(tokens: any[], fullString: string, offset: number): number {
        if (tokens.length === 0) {
            return null;
        }
        let i: number = 0
        let lastNonEOFToken: number = null;
        while (i < tokens.length) {
            const token = tokens[i];
            if (token.type !== Token.EOF) {
                lastNonEOFToken = i;
            }
            if (token.start > offset) {
                if (i === 0) {
                    return null;
                }
                return i - 1;
            }
            i++;
        }
        // If we didn't find the token above and the last
        // character in the autocomplete is whitespace,
        // start autocompleting for the next token
        if (/\s$/.test(fullString)) {
            return i - 1;
        }
        return lastNonEOFToken;
    }

    _getTokenString(token: any, fullString: string, offset: number): string {
        if (token !== null && token.type !== Token.EOF) {
            let stop = token.stop;
            if (offset < stop) {
                stop = offset;
            }
            return fullString.substring(token.start, stop + 1);
        }
        return '';
    }
}