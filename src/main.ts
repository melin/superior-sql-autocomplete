import { SparkSqlLexer } from "./spark/SparkSqlLexer";
import { SparkSqlParser } from "./spark/SparkSqlParser";
import { CommonTokenStream, ANTLRInputStream, ConsoleErrorListener } from "antlr4ts";
import { PredictionMode } from "antlr4ts/atn";

import { CodeCompletionCore } from "antlr4-c3";
import { CaseChangingStream } from "./models/CaseChangingStream";
import { SimpleSQLTokenizer } from "./models/SimpleSQLTokenizer";
import { Utils } from "./models/Utils";

const message: string = "Hello World";
document.body.innerHTML = `${message}`;

const sqlScript = "sel";
const chars = new ANTLRInputStream(sqlScript);
const caseChangingCharStream = new CaseChangingStream(chars, true);
let lexer = new SparkSqlLexer(caseChangingCharStream);
let tokens = new CommonTokenStream(lexer);

const preferredRulesTable = [SparkSqlParser.RULE_multipartIdentifierList, SparkSqlParser.RULE_tableIdentifier]
const preferredRulesColumn = []
const preferredRuleOptions = [preferredRulesTable, preferredRulesColumn];

let parser = new SparkSqlParser(tokens);
parser.removeErrorListener(ConsoleErrorListener.INSTANCE);
parser.interpreter.setPredictionMode(PredictionMode.LL);
let tree = parser.singleStatement()
let core = new CodeCompletionCore(parser);

const simpleSQLTokenizer = new SimpleSQLTokenizer(sqlScript, true);
const allTokens = new CommonTokenStream(simpleSQLTokenizer);
const indexToAutocomplete = sqlScript.length;
const tokenIndex = Utils.getTokenIndexAt(allTokens.getTokens(), sqlScript, indexToAutocomplete);
if (tokenIndex === null) {
  console.info("tokenIndex is null")
}

const token: any = allTokens.getTokens()[tokenIndex];
const tokenString = Utils.getTokenString(token, sqlScript, indexToAutocomplete);
tokens.fill(); 

const candidates = core.collectCandidates(tokenIndex);
console.info("====" + tokenString)

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
        console.info(candidateTokenValue)
    }
}

