import os
from channels.generic.websocket import AsyncWebsocketConsumer
import json
from aio_pika import connect as aio_connect, ExchangeType


class MyAsyncConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        try:
            session_key = self.scope["session"].session_key
            if not session_key:
                await self.scope["session"].save()
                session_key = self.scope["session"].session_key
            self.group_name = f"session_{session_key}"
            await self.channel_layer.group_add(self.group_name, self.channel_name)
            await self.accept()
            await self.start_rabbitmq_consumer()
            print("Connected")
        except Exception as e:
            print(e)

    async def start_rabbitmq_consumer(self):
        try:
            connection = await aio_connect(
                f"amqp://{os.getenv('RABBIT_MQ_USERNAME')}:{os.getenv('RABBIT_MQ_PASSWORD')}@localhost:5672/{os.getenv('RABBIT_MQ_VHOST')}"
            )
            channel = await connection.channel()
            exchange = await channel.declare_exchange(
                "task_updates", ExchangeType.TOPIC
            )
            queue = await channel.declare_queue("", exclusive=True)
            await queue.bind(exchange, "task.result")
            print("Queue bindind successfull")
            async for message in queue:
                task_info = json.loads(message.body.decode())
                async with message.process():
                    group_name = task_info["group_name"]
                    print(
                        f"task group_name: {group_name}\ndefault group_name: {self.group_name}"
                    )
                    result = task_info["result"]
                    if group_name == self.group_name:
                        await self.send(text_data=json.dumps({"message": result}))
        except Exception as e:
            print(e)

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)
