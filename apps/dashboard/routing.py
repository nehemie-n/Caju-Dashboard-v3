from django.urls import path
from . import consumers

websocket_urlpatterns = [
    path("ws/map_layer/", consumers.MyAsyncConsumer.as_asgi()),
]