# AI Flow

## Overview

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

AI Flow is a TypeScript-based extensible workflow system designed for use in Node.js environments. It facilitates asynchronous interactions between users, data, and AI, all driven by JSON-based workflows. At its core, this project employs an Inversion of Control (IoC) container, which workflow nodes can register with. The `@ContainerNode` decorator provides access to all the essential elements of the system.

## Features

- **Extensible Workflows**: Easily create and extend workflows to suit your needs.
- **Asynchronous Interactions**: Support for asynchronous interactions between users, data, and AI.
- **JSON-Driven**: Define your workflows using JSON.
- **Inversion of Control**: Leverage the IoC container to manage dependencies and components.
- **Examples**: Explore various workflow examples included in the project.

## Examples

This project includes several examples to help you get started:

- **NewsFlash**: Simple workflow triggered from a slack app homepage that finds news articles about a specific topic and slacks a summary of each
- **Pod2X**: Simple workflow triggered from a web form where you select an mp3 file for a podcast and in return receive 3 sample tweets
- **TicketRemind**: Workflow that finds Jira tickets in a particular project that have not been updated recently and sends them to slack. 

You can run these examples by executing the corresponding TypeScript files.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you have questions or need assistance, please open an issue on the GitHub repository.
