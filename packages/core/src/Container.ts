import fs from 'fs';
import path from 'path';

export type JSONValue =
  | string
  | number
  | boolean
  | { [x: string]: JSONValue }
  | Array<JSONValue>;

export interface JSONObject {
  [name: string] : JSONValue;
}

export interface ContainerNode {
  getId(): string;
}

export class NodeBase implements ContainerNode {
  constructor(protected id: string, protected container: IContainer, protected config: JSONObject) {}

  getId(): string {
    return this.id;
  };
}

export interface IContainer {
  getInstance(id: string): NodeBase;
  getInstances(): ReadonlyArray<NodeBase>;
  getNodeNames(): ReadonlyArray<string>;
  createInstance(id: string, type: string, config: JSONObject): NodeBase | null;
}

export function ContainerNode(originalClass: typeof NodeBase, context: ClassDecoratorContext) {
  console.log('setting up container', context);
  if (context.name && context.kind === 'class') {
    mainContainer.addNode(originalClass, context.name);
  }
}

export async function bootstrap(additionalNodePaths: string[], initFunction: (container: IContainer) => void) {
  const coreNodePath = path.join(__dirname, 'coreNodes');
  console.log('about to load core nodes at location', coreNodePath)
  await mainContainer.loadNodes(coreNodePath);
  for (const nodePath of additionalNodePaths) {
    await mainContainer.loadNodes(nodePath);
  }
  initFunction(mainContainer);
}


class Container implements IContainer {
  private instances: Record<string, NodeBase> = {};
  private nodes: Record<string, typeof NodeBase> = {};

  addNode(node: typeof NodeBase, name: string) {
    this.nodes[name] = node;
  }

  getInstance(id: string): NodeBase {
    return this.instances[id];
  }

  getInstances(): ReadonlyArray<NodeBase> {
    return Object.values(this.instances);
  }

  getNodeNames(): ReadonlyArray<string> {
    return Object.keys(this.nodes);
  }

  createInstance(id: string, type: string, config: JSONObject): NodeBase | null {
    const existingInstance = this.getInstance(id);
    if (existingInstance) {
      return existingInstance;
    }

    const node: typeof NodeBase = this.nodes[type];
    if (node) {
      const instance = new node(id, this, config);
      this.instances[id] = instance;
      return instance;
    }

    return null;
  }

  async loadNodes(nodeDirectoryPath: string) {
    console.log('loading', nodeDirectoryPath);
    const files: string[] = fs.readdirSync(nodeDirectoryPath);
    console.log('files', files);
    for (const file of files) {
      if (file.endsWith('.js') || file.endsWith('.cjs')) {
        const filePath = path.join(nodeDirectoryPath, file);
        console.log('trying to inmport file:', file, filePath);
        await import(filePath);
      }
    }
  }
}

const mainContainer: Container = new Container();

