import { hello } from "./sub";
import { SparkSqlLexer } from "./spark/SparkSqlLexer";
import { SparkSqlParser } from "./spark/SparkSqlParser";
import { CommonTokenStream, ANTLRInputStream, ConsoleErrorListener } from "antlr4ts";
import { CodeCompletionCore } from "antlr4-c3";
import { CaseChangingStream } from "./models/CaseChangingStream";

const message: string = "Hello World";

hello(message);

const chars = new ANTLRInputStream("select * ");
const caseChangingCharStream = new CaseChangingStream(chars, true);
let lexer = new SparkSqlLexer(caseChangingCharStream);
lexer.removeErrorListener(ConsoleErrorListener.INSTANCE);
let tokens = new CommonTokenStream(lexer);

let parser = new SparkSqlParser(tokens);
parser.addErrorListener(ConsoleErrorListener.INSTANCE);
let tree = parser.singleStatement()

let core = new CodeCompletionCore(parser);
let candidates = core.collectCandidates(0);
console.info(candidates)