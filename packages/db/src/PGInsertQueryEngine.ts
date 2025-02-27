import {
  ContainerNode,
  getJSONObjectFromPath,
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
  private readonly dataRoot: string;
  private readonly outputEventName: string;
  private client: pg.Client | null;

  constructor(id: string, container: IContainer, config: JSONObject) {
    super(id, container, config);
    this.connectionString = config["connectionString"] as string;
    this.sqlInsertTemplate = config["sqlInsertTemplate"] as string;
    this.sqlValuesTemplate = config["sqlValuesTemplate"] as Array<string>;
    this.outputEventName = config["outputEventName"] as string;
    this.dataRoot = config["dataRoot"] as string;
    this.client = null;
  }

  async execute(
    payload: JSONObject,
    completeCallback: (completeEventName: string, result: JSONObject) => void,
  ): Promise<void> {
    console.log("executing query for node", this.id);

    if (this.client === null) {
      const connectionString = keywordReplacement(
        this.connectionString,
        payload,
      );
      this.client = new pg.Client({ connectionString });
      await this.client.connect();
    }

    try {
      const data = getJSONObjectFromPath(this.dataRoot, payload);
      if (data instanceof Array) {
        for (const item of data) {
          const sqlInsert = keywordReplacement(
            this.sqlInsertTemplate,
            item as JSONObject,
          );
          const values = this.sqlValuesTemplate.map((key) => {
            const value = (item as JSONObject)[key];
            if (value instanceof Array) {
              return JSON.stringify(value);
            }
            return value;
          });
          await this.client.query(sqlInsert, values);
        }
      } else {
        const sqlInsert = keywordReplacement(this.sqlInsertTemplate, data);
        await this.client.query(sqlInsert);
      }

      completeCallback(this.outputEventName, payload);
    } catch (err) {
      console.error("error running query", err);
      return;
    }
  }
}
