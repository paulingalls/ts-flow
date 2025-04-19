import {
    ContainerNode,
    IContainer,
    IQueryEngine,
    JSONObject,
    NodeBase,
    JSONValue,
} from "@ts-flow/core";

@ContainerNode
export class LoopTransform extends NodeBase implements IQueryEngine {
    private readonly outputEventName: string;
    private readonly dataTarget: string;

    constructor(id: string, container: IContainer, config: JSONObject) {
        super(id, container, config);
        this.outputEventName = config["outputEventName"] as string;
        this.dataTarget = config["dataTarget"] as string;
    }

    execute(
        data: JSONObject,
        completeCallback: (completeEventName: string, result: JSONObject) => void,
    ): Promise<void> {
        const targetData = data[this.dataTarget];

        if (!Array.isArray(targetData)) {
            throw new Error(`Target data at '${this.dataTarget}' is not an array`);
        }

        targetData.forEach((item: JSONValue) => {
            completeCallback(this.outputEventName, item as JSONObject);
        });

        return Promise.resolve();
    }
} 