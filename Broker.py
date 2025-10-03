#!/usr/bin/env python3
"""
Simple asyncio WebSocket Pub/Sub Broker
- Clients connect via WebSocket
- JSON messages:
  Subscribe: {"action":"subscribe","topic":"foo"}
  Unsubscribe: {"action":"unsubscribe","topic":"foo"}
  Publish: {"action":"publish","topic":"foo","data": {...}}
  Ping: {"action":"ping"}
Broker forwards published messages to all currently subscribed clients.
"""

import asyncio
import json
import logging
from collections import defaultdict
import websockets

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

# topic -> set of websocket connections
TOPIC_SUBSCRIBERS = defaultdict(set)

# connection -> set of topics subscribed
CLIENT_TOPICS = defaultdict(set)

# simple optional token-based auth map (token -> username)
VALID_TOKENS = {"devtoken": "devuser"}  # extend in production


async def handle_client(ws, path):
    addr = ws.remote_address
    logging.info("Client connected: %s", addr)
    try:
        # Optionally require auth as first message:
        # Expect: {"action":"auth","token":"..."}
        auth_ok = False
        try:
            msg_raw = await asyncio.wait_for(ws.recv(), timeout=10)
            msg = json.loads(msg_raw)
            if msg.get("action") == "auth":
                token = msg.get("token")
                if token in VALID_TOKENS:
                    auth_ok = True
                    await ws.send(json.dumps({"status": "ok", "msg": f"auth_ok:{VALID_TOKENS[token]}"}))
                    logging.info("Client %s authenticated as %s", addr, VALID_TOKENS[token])
                else:
                    await ws.send(json.dumps({"status": "error", "msg": "invalid_token"}))
                    await ws.close()
                    return
            else:
                # If no auth required, treat that message as first non-auth message
                # Put it back into inbox style by processing below
                msg = msg  # already parsed
                # allow unauthenticated sessions by default
                auth_ok = True
                await process_message(ws, msg)
        except asyncio.TimeoutError:
            # no auth message within timeout; allow connection (or close if you want strict auth)
            logging.info("Auth timeout; proceeding without auth for %s", addr)
            auth_ok = True

        # main receive loop
        async for raw in ws:
            try:
                msg = json.loads(raw)
            except Exception:
                logging.warning("Invalid JSON from %s: %s", addr, raw)
                await ws.send(json.dumps({"status": "error", "msg": "invalid_json"}))
                continue
            await process_message(ws, msg)
    except websockets.ConnectionClosed:
        logging.info("Connection closed: %s", addr)
    finally:
        # cleanup subscriptions
        topics = CLIENT_TOPICS.pop(ws, set())
        for t in topics:
            TOPIC_SUBSCRIBERS[t].discard(ws)
            if not TOPIC_SUBSCRIBERS[t]:
                TOPIC_SUBSCRIBERS.pop(t, None)
        logging.info("Cleaned up client %s", addr)


async def process_message(ws, msg):
    action = msg.get("action")
    if action == "subscribe":
        topic = msg.get("topic")
        if not topic:
            await ws.send(json.dumps({"status": "error", "msg": "missing_topic"}))
            return
        TOPIC_SUBSCRIBERS[topic].add(ws)
        CLIENT_TOPICS[ws].add(topic)
        logging.info("Subscribed %s to %s", ws.remote_address, topic)
        await ws.send(json.dumps({"status": "ok", "msg": f"subscribed:{topic}"}))

    elif action == "unsubscribe":
        topic = msg.get("topic")
        if topic and ws in TOPIC_SUBSCRIBERS.get(topic, set()):
            TOPIC_SUBSCRIBERS[topic].discard(ws)
            CLIENT_TOPICS[ws].discard(topic)
            await ws.send(json.dumps({"status": "ok", "msg": f"unsubscribed:{topic}"}))
        else:
            await ws.send(json.dumps({"status": "error", "msg": "not_subscribed"}))

    elif action == "publish":
        topic = msg.get("topic")
        data = msg.get("data")
        if not topic:
            await ws.send(json.dumps({"status": "error", "msg": "missing_topic"}))
            return
        payload = {"topic": topic, "data": data}
        await broadcast(topic, payload)
        await ws.send(json.dumps({"status": "ok", "msg": f"published:{topic}"}))

    elif action == "ping":
        await ws.send(json.dumps({"action": "pong"}))

    else:
        await ws.send(json.dumps({"status": "error", "msg": "unknown_action"}))


async def broadcast(topic, payload):
    """Send payload (dict) to all subscribers of topic. Best-effort."""
    subs = list(TOPIC_SUBSCRIBERS.get(topic, set()))
    if not subs:
        logging.info("No subscribers for topic %s", topic)
        return
    message = json.dumps({"action": "message", "topic": topic, "payload": payload})
    for ws in subs:
        try:
            await ws.send(message)
        except websockets.ConnectionClosed:
            # cleanup will be handled elsewhere
            logging.info("Subscriber closed during broadcast; skipping")


async def main(host="0.0.0.0", port=6789):
    logging.info("Starting broker on %s:%d", host, port)
    async with websockets.serve(handle_client, host, port):
        await asyncio.Future()  # run forever


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default="0.0.0.0")
    parser.add_argument("--port", type=int, default=6789)
    args = parser.parse_args()
    try:
        asyncio.run(main(args.host, args.port))
    except KeyboardInterrupt:
        logging.info("Broker stopped by user")
        
        
        
        #!/usr/bin/env python3
import asyncio, json, websockets, sys, time

async def produce(uri, topic, messages=5, interval=1.0):
    async with websockets.connect(uri) as ws:
        # optional auth
        # await ws.send(json.dumps({"action":"auth","token":"devtoken"}))
        for i in range(messages):
            data = {"msg_no": i, "text": f"hello {i}", "timestamp": time.time()}
            await ws.send(json.dumps({"action":"publish", "topic": topic, "data": data}))
            resp = await ws.recv()
            print("broker:", resp)
            await asyncio.sleep(interval)

if __name__ == "__main__":
    uri = "ws://localhost:6789"
    topic = sys.argv[1] if len(sys.argv) > 1 else "news"
    asyncio.run(produce(uri, topic, messages=10, interval=0.5))