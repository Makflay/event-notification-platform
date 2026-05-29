# Event Notification Platform

Event Notification Platform is a microservice-based backend system built with NestJS, RabbitMQ, and Telegram Bot API.

The project is designed to demonstrate reliable event delivery, asynchronous message processing, and notification sending through Telegram.

## Architecture Overview

The system consists of three main services:

- **Producer Service** — publishes events to RabbitMQ.
- **Consumer Service** — consumes and processes events from RabbitMQ.
- **Telegram Notifier Service** — sends notifications to users through Telegram Bot API.

Services communicate asynchronously through RabbitMQ using JSON-serialized messages.

## Key Requirements

The project is planned with the following technical requirements:

- Microservice architecture with NestJS
- RabbitMQ as a message broker
- Telegram Bot API integration
- UUID-based idempotency for event processing
- JSON message serialization
- Publisher confirms for reliable message publishing
- Retry mechanisms for failed operations
- ACK/NACK message handling
- Logging for successful and failed message processing
- Docker-based environment
- Swagger API documentation
- Jest unit and e2e tests
- SOLID principles
- Clean Architecture approach

## Project Status

The project is currently in the initial setup stage.

Core services, infrastructure, and implementation details will be added incrementally.
