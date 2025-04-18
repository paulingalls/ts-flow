import {
  ContainerNode,
  IContainer,
  IQueryEngine,
  JSONObject,
  keywordReplacement,
  NodeBase,
} from "@ts-flow/core";
import pg from "pg";

@ContainerNode
export class PGSelectQueryEngine extends NodeBase implements IQueryEngine {
  private readonly connectionString: string;
  private readonly sqlSelectTemplate: string;
  private readonly outputEventName: string;
  private readonly outputProperty: string;
  private client: pg.Client | null;

  constructor(id: string, container: IContainer, config: JSONObject) {
    super(id, container, config);
    this.connectionString = config["connectionString"] as string;
    this.sqlSelectTemplate = config["sqlSelectTemplate"] as string;
    this.outputEventName = config["outputEventName"] as string;
    this.outputProperty = config["outputProperty"] as string;
    this.client = null;
  }

  async execute(
    payload: JSONObject,
    completeCallback: (completeEventName: string, result: JSONObject) => void,
  ): Promise<void> {
    if (this.client === null) {
      const connectionString = keywordReplacement(
        this.connectionString,
        payload,
      );
      this.client = new pg.Client({ connectionString: connectionString });
      await this.client.connect();
    }

    const sqlSelect = keywordReplacement(this.sqlSelectTemplate, payload);
    try {
      const res = await this.client.query(sqlSelect);
      if (this.outputProperty) {
        payload[this.outputProperty] = res.rows;
      } else {
        payload = { ...payload, ...res.rows } as unknown as JSONObject;
      }
      completeCallback(this.outputEventName, payload);
    } catch (err) {
      console.error("error running query", err);
      return;
    }
  }
}
