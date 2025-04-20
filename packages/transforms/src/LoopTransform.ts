import {
    ContainerNode,
    IContainer,
    IEventListener,
    JSONObject,
    NodeBase,
    JSONValue,
    EventBus,
    getJSONObjectFromPath,
} from "@ts-flow/core";

@ContainerNode
export class LoopTransform extends NodeBase implements IEventListener {
    private readonly inputEventName: string;
    private readonly outputEventName: string;
    private readonly dataTarget: string;

    constructor(id: string, container: IContainer, config: JSONObject) {
        super(id, container, config);
        this.inputEventName = config["inputEventName"] as string;
        this.outputEventName = config["outputEventName"] as string;
        this.dataTarget = config["dataTarget"] as string;

        if (!this.inputEventName || !this.outputEventName) {
            throw new Error("inputEventName and outputEventName are required for AggregatorNode");
        }

        const eventBus = this.container.getInstance("EventBus") as EventBus;
        eventBus.addListener(this.inputEventName, this);
    }

    eventTriggered(payload: JSONObject): Promise<void> {
        const targetData = getJSONObjectFromPath(this.dataTarget, payload);

        if (!Array.isArray(targetData)) {
            throw new Error(`Target data at '${this.dataTarget}' is not an array`);
        }

        const eventBus = this.container.getInstance("EventBus") as EventBus;
        targetData.forEach((item: JSONValue) => {
            eventBus.sendEvent(this.outputEventName, item as JSONObject);
        });

        return Promise.resolve();
    }
} 