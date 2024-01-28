import asyncio
from websockets.server import serve

messages = []
web_server = None
async def echo(websocket):
    async for message in websocket:
        if web_server:
            print(message)
            await web_server.send(message)


async def null(websocket):
    global web_server
    print("Established web socket")
    web_server = websocket
    #for msg in messages:
    #    await websocket.send(json.dumps(msg))
    #    await asyncio.sleep(0.5)
    async for message in websocket:
        print(message)


async def main():
    server = await serve(null, "localhost", 65432, start_serving=True)
    async with serve(echo, "localhost", 8033):
        await asyncio.Future()  # run forever


asyncio.run(main())
