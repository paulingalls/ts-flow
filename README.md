# TS-Flow

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Overview

TS-Flow is a TypeScript-based workflow automation system that enables developers to create powerful, event-driven
workflows with minimal code. Built around a core event bus and using an IoC (Inversion of Control) container pattern,
TS-Flow makes it easy to connect various services and APIs into cohesive workflows defined in JSON.

## Features

- **JSON-Defined Workflows**: Define complex workflows in JSON without writing custom code
- **Event-Driven Architecture**: Components communicate through events, enabling loose coupling
- **Modular Design**: Add new capabilities by creating new node types
- **Extensible Plugin System**: Integrate with various APIs and services through pluggable components
- **Built-in Components**: Support for AI (OpenAI), Web APIs, Slack, Reddit, BlueSky, and more
- **Human-in-the-Loop**: Create workflows that involve human interaction and decision points

## Core Concepts

### Workflow

A workflow is the top-level container that defines a sequence of interconnected nodes. Each workflow is defined in a
JSON file and can be loaded and executed at runtime.

### Nodes

Nodes are the building blocks of a workflow. Each node performs a specific function and can communicate with other nodes
through events. There are three main types of nodes:

- **Trigger**: Starts a workflow based on external events (cron schedule, Slack interaction, web request)
- **QueryEngine**: Processes data or performs operations (API calls, data transformations, AI operations)
- **Endpoint**: Exposes functionality via HTTP endpoints

### Event Bus

The event bus is the communication backbone of TS-Flow. Nodes publish and subscribe to events, creating a loosely
coupled system where components can be added, removed, or modified without breaking the entire workflow.

## Available Components

TS-Flow includes several built-in components:

### Triggers

- **CronTrigger**: Starts workflows on a schedule
- **SlackHomePageTrigger**: Displays interactive UI in Slack and responds to user input

### Query Engines

- **AI Engines**:

  - **OpenAIChatEngine**: Generate text using ChatGPT models
  - **OpenAIImageEngine**: Generate images
  - **OpenAIWhisperEngine**: Transcribe audio
  - **OpenAIEmbeddingEngine**: Create embeddings for text

- **Web & API Engines**:

  - **HttpGetQueryEngine**: Make HTTP GET requests
  - **HttpPostQueryEngine**: Make HTTP POST requests
  - **PuppeteerQueryWebEngine**: Scrape web content

- **Social Media Engines**:

  - **SlackBlocksOnlyQueryEngine**: Send messages to Slack
  - **SlackYesNoQueryEngine**: Get yes/no responses from users in Slack
  - **RedditPostQueryEngine**: Post to Reddit
  - **BlueSkyLinkPostingEngine**: Post to BlueSky

- **Transformations**:
  - **UrlEncodeTransform**: URL encode data
  - **DeleteTransform**: Remove data from the payload
  - **IncrementTransform**: Increment numeric values

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/ts-flow.git
cd ts-flow

# Install dependencies
npm install

# Build the project
npm run build
```

### Creating a Simple Workflow

1. Create a JSON file defining your workflow:

```json
{
  "id": "hello-world",
  "type": "Workflow",
  "config": {
    "name": "Hello World Workflow",
    "description": "A simple workflow that says hello on a schedule",
    "nodes": [
      {
        "id": "hello-world-trigger",
        "type": "Trigger",
        "config": {
          "triggerType": "CronTrigger",
          "triggerId": "hello-world-cron",
          "triggerConfig": {
            "cron": "* * * * *",
            "payload": {
              "message": "Hello, World!"
            },
            "triggerOnStart": "true",
            "outputEventName": "helloEvent"
          }
        }
      },
      {
        "id": "hello-world-slack",
        "type": "QueryEngine",
        "config": {
          "inputEventName": "helloEvent",
          "engineType": "SlackBlocksOnlyQueryEngine",
          "engineId": "slack-hello",
          "engineConfig": {
            "channel": "test-channel",
            "userPrompt": "Hello from TS-Flow!",
            "outputEventName": "messageSent",
            "blocks": [
              {
                "type": "section",
                "text": {
                  "type": "mrkdwn",
                  "text": "*${message}*"
                }
              }
            ]
          }
        }
      }
    ]
  }
}
```

2. Create an index.ts file to load and run your workflow:

```typescript
import { bootstrap, IContainer, JSONObject, WebServer } from "@ts-flow/core";
import path from "path";
import helloWorld from "./hello-world.json";
import dotenv from "dotenv";

dotenv.config();

// Define paths to the node modules you want to use
const paths: string[] = [];
paths.push(
  path.join(__dirname, "..", "node_modules", "@ts-flow", "slack", "dist"),
);
paths.push(
  path.join(__dirname, "..", "node_modules", "@ts-flow", "cron", "dist"),
);

// Bootstrap the application
void bootstrap(paths, (container: IContainer) => {
  // Add your workflow to the container
  container.createInstance(
    helloWorld.id,
    helloWorld.type,
    helloWorld.config as unknown as JSONObject,
  );

  // Start the web server
  const webServer = container.getInstance("WebServer") as WebServer;
  webServer.startServer();
});
```

## Example Workflows

The repository includes several example workflows that demonstrate how to use TS-Flow for various use cases:

### NewsFlash

A workflow triggered from a Slack app homepage that finds news articles about a specific topic and sends summaries to
Slack.

Key features:

- User input via Slack interface
- Web scraping with Puppeteer
- AI summarization with OpenAI
- Pagination of results

### Pod2X

A workflow that processes podcast audio and creates social media posts based on the content.

Key features:

- File uploads through a web form
- Audio processing
- AI-generated social media content

### TicketRemind

A workflow that finds Jira tickets that haven't been updated recently and sends reminders to Slack.

Key features:

- Scheduled execution with Cron
- API integration with Jira
- Formatted Slack messages with user information

## Creating Custom Components

You can extend TS-Flow by creating custom node types:

1. Create a new class that implements the appropriate interface
2. Use the `@ContainerNode` decorator to register your class with the container
3. Implement the required methods
4. Add your custom component to your workflow JSON

Example of a custom QueryEngine:

```typescript
import {
  ContainerNode,
  IContainer,
  IQueryEngine,
  JSONObject,
} from "@ts-flow/core";

@ContainerNode({
  type: "QueryEngine",
  name: "MyCustomEngine",
})
export class MyCustomEngine implements IQueryEngine {
  private config: any;

  constructor(
    private id: string,
    private container: IContainer,
    config: JSONObject,
  ) {
    this.config = config;
  }

  public getId(): string {
    return this.id;
  }

  public async execute(
    data: JSONObject,
    callback: (eventName: string, result: JSONObject) => void,
  ): Promise<void> {
    // Implement your custom logic here

    // When done, call the callback with the result
    callback(this.config.outputEventName, { result: "Success!" });
  }
}
```

## Tips for Working with TS-Flow

1. **Use data paths wisely**: The `engineDataRoot` property lets you extract specific parts of the payload for
   processing
2. **Chain events**: Connect nodes by matching `outputEventName` to `inputEventName`
3. **Template interpolation**: Use `${variable}` syntax to insert dynamic values in strings
4. **Environment variables**: Store sensitive information like API keys in environment variables

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
