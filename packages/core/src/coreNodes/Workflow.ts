import { NodeBase, ContainerNode, IContainer, JSONObject } from "../Container";

export type WorkflowNodeDefinition = {
  id: string;
  type: string;
  config: JSONObject;
};

export type WorkflowDefinition = {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNodeDefinition[];
};


@ContainerNode
export class Workflow extends NodeBase {
  private name: string = '';
  private description: string = '';
  private nodes: NodeBase[] = [];

  constructor(id: string, container: IContainer, config: JSONObject) {
    super(id, container, config);

    this.name = config['name'] as string;
    this.description = config['description'] as string;
    const nodes: WorkflowNodeDefinition[] = config['nodes'] as [];
    nodes.forEach((node: WorkflowNodeDefinition) => {
      const newNode = this.container.createInstance(node.id, node.type, node.config);
      if (newNode) {
        this.nodes.push(newNode);
      }
    })
  }
}