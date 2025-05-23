import {
  ContainerNode,
  getValueForKeyword,
  IContainer,
  IQueryEngine,
  JSONObject,
  keywordReplacement,
  NodeBase,
} from "@ts-flow/core";
import pg from "pg";

@ContainerNode
export class PGInsertQueryEngine extends NodeBase implements IQueryEngine {
  private readonly connectionString: string;
  private readonly sqlInsertTemplate: string;
  private readonly sqlValuesTemplate: Array<string>;
  private readonly outputEventName: string;
  private client: pg.Client | null;

  constructor(id: string, container: IContainer, config: JSONObject) {
    super(id, container, config);
    this.connectionString = config["connectionString"] as string;
    this.sqlInsertTemplate = config["sqlInsertTemplate"] as string;
    this.sqlValuesTemplate = config["sqlValuesTemplate"] as Array<string>;
    this.outputEventName = config["outputEventName"] as string;
    this.client = null;
  }

  async execute(
    data: JSONObject,
    completeCallback: (completeEventName: string, result: JSONObject) => void,
  ): Promise<void> {
    console.log("executing query for node", this.id);

    if (this.client === null) {
      const connectionString = keywordReplacement(this.connectionString, data);
      this.client = new pg.Client({ connectionString });
      await this.client.connect();
    }

    try {
      if (data instanceof Array) {
        for (const item of data) {
          const sqlInsert = keywordReplacement(
            this.sqlInsertTemplate,
            item as JSONObject,
          );
          const values = this.sqlValuesTemplate.map((key) => {
            return getValueForKeyword(key, item as JSONObject);
          });
          await this.client.query(sqlInsert, values);
        }
      } else {
        const sqlInsert = keywordReplacement(this.sqlInsertTemplate, data);
        await this.client.query(sqlInsert);
      }

      completeCallback(this.outputEventName, data);
    } catch (err) {
      console.error("error running query", err);
      return;
    }
  }
}
