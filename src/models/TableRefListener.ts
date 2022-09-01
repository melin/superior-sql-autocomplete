import {SparkSqlParserListener} from "../spark/SparkSqlParserListener";
import {TableNameContext} from "../spark/SparkSqlParser";

export class TableRefListener implements SparkSqlParserListener {
    enterTableName(ctx: TableNameContext): void {
        console.log(`Function start line number ${ctx._start.startIndex}`)
        console.info(ctx.multipartIdentifier()._parts[0].identifier().strictIdentifier().text)
    }

}