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

## API Usage Examples

### Producer: Publish System Test Event

Publishes a test event to RabbitMQ.

```bash
curl -X POST http://localhost:3000/events \
  -H "Content-Type: application/json" \
  -d '{"type":"system.test.event","payload":{"message":"Hello from producer"}}'
```

Successful response:

```json
{
  "eventId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "published"
}
```

### Producer: Publish Telegram Notification Event

Publishes an event that can be processed later as a Telegram notification.

```bash
curl -X POST http://localhost:3000/events \
  -H "Content-Type: application/json" \
  -d '{"type":"telegram.notification.created","payload":{"title":"New notification","message":"Hello from RabbitMQ","metadata":{"source":"producer","priority":"normal"}}}'
```

Successful response:

```json
{
  "eventId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "published"
}
```

### Telegram Notifier: Send Notification Manually

Sends a Telegram notification directly through the temporary HTTP endpoint.

```bash
curl -X POST http://localhost:3002/notifications/telegram \
  -H "Content-Type: application/json" \
  -d '{"title":"Manual notification","message":"Hello from telegram-notifier","metadata":{"source":"manual-test"}}'
```

Successful response:

```json
{
  "status": "sent",
  "provider": "telegram"
}
```

### Validation Error Example

Request with unsupported event type:

```bash
curl -X POST http://localhost:3000/events \
  -H "Content-Type: application/json" \
  -d '{"type":"unknown.event","payload":{"message":"Invalid event"}}'
```

Example error response:

```json
{
  "message": [
    "type must be one of the following values: telegram.notification.created, system.test.event"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

### Telegram Error Example

If the Telegram bot token or chat id is invalid, the Telegram notifier can return an error response.

Example:

```json
{
  "message": "Telegram chat id is invalid",
  "error": "Bad Request",
  "statusCode": 400
}
```
