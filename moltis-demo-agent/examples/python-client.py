#!/usr/bin/env python3
"""
Moltis Python API Client Example
Demonstrates how to interact with Moltis gateway via WebSocket and REST API
"""

import asyncio
import json
import sys
from typing import AsyncIterator, Dict, Any
import websockets
import aiohttp


class MoltisClient:
    """Simple Moltis API client"""
    
    def __init__(self, base_url: str = "https://localhost:13131"):
        self.base_url = base_url
        self.ws_url = base_url.replace("https://", "wss://").replace("http://", "ws://")
        self.session = None
        
    async def connect(self):
        """Initialize HTTP session"""
        self.session = aiohttp.ClientSession()
        
    async def close(self):
        """Close HTTP session"""
        if self.session:
            await self.session.close()
            
    async def send_message(self, message: str, model: str = None) -> AsyncIterator[Dict[str, Any]]:
        """
        Send a message and stream responses
        
        Args:
            message: The message to send
            model: Optional model override
            
        Yields:
            Event dictionaries from the agent
        """
        # Connect to WebSocket
        async with websockets.connect(
            f"{self.ws_url}/ws",
            ssl=None  # Skip SSL verification for local dev
        ) as ws:
            # Send message via JSON-RPC
            request = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "chat.send",
                "params": {
                    "message": message,
                }
            }
            
            if model:
                request["params"]["model"] = model
                
            await ws.send(json.dumps(request))
            
            # Stream responses
            async for raw_message in ws:
                try:
                    event = json.loads(raw_message)
                    yield event
                except json.JSONDecodeError:
                    print(f"Failed to parse message: {raw_message}", file=sys.stderr)
                    
    async def list_sessions(self) -> list:
        """List all sessions"""
        async with self.session.get(f"{self.base_url}/api/sessions") as response:
            return await response.json()
            
    async def get_session(self, session_id: str) -> dict:
        """Get session details"""
        async with self.session.get(f"{self.base_url}/api/sessions/{session_id}") as response:
            return await response.json()


async def example_chat():
    """Example: Simple chat interaction"""
    client = MoltisClient()
    await client.connect()
    
    try:
        print("🤖 Moltis Chat Example")
        print("=" * 50)
        
        message = "What is Rust and why is it good for building AI agents?"
        print(f"\n👤 User: {message}\n")
        print("🤖 DemoBot: ", end="", flush=True)
        
        async for event in client.send_message(message):
            # Handle different event types
            if "result" in event:
                # JSON-RPC result
                result = event["result"]
                if "type" in result:
                    event_type = result["type"]
                    
                    if event_type == "text":
                        # Text chunk
                        print(result.get("text", ""), end="", flush=True)
                    elif event_type == "thinking":
                        # Thinking indicator
                        print(f"\n[Thinking: {result.get('text', '')}]", flush=True)
                    elif event_type == "tool_start":
                        # Tool execution started
                        tool = result.get("tool", {})
                        print(f"\n[Tool: {tool.get('name', 'unknown')}]", flush=True)
                    elif event_type == "tool_end":
                        # Tool execution completed
                        print("[Tool complete]", flush=True)
                    elif event_type == "done":
                        # Response complete
                        print("\n\n✓ Complete")
                        break
                        
    finally:
        await client.close()


async def example_tool_execution():
    """Example: Execute a command via tool"""
    client = MoltisClient()
    await client.connect()
    
    try:
        print("🤖 Moltis Tool Execution Example")
        print("=" * 50)
        
        message = "Run 'uname -a' and tell me what OS this is running on"
        print(f"\n👤 User: {message}\n")
        print("🤖 DemoBot:\n")
        
        async for event in client.send_message(message):
            if "result" in event:
                result = event["result"]
                event_type = result.get("type")
                
                if event_type == "text":
                    print(result.get("text", ""), end="", flush=True)
                elif event_type == "tool_start":
                    tool = result.get("tool", {})
                    print(f"\n[Executing: {tool.get('name')}]")
                    print(f"Args: {json.dumps(tool.get('input', {}), indent=2)}")
                elif event_type == "tool_end":
                    output = result.get("output", {})
                    print(f"[Result: {output.get('status', 'unknown')}]")
                    if "stdout" in output:
                        print(f"Output:\n{output['stdout']}")
                elif event_type == "done":
                    print("\n✓ Complete")
                    break
                    
    finally:
        await client.close()


async def example_memory_search():
    """Example: Search long-term memory"""
    client = MoltisClient()
    await client.connect()
    
    try:
        print("🤖 Moltis Memory Search Example")
        print("=" * 50)
        
        message = "Search my memory for anything about Rust programming"
        print(f"\n👤 User: {message}\n")
        print("🤖 DemoBot: ", end="", flush=True)
        
        async for event in client.send_message(message):
            if "result" in event:
                result = event["result"]
                event_type = result.get("type")
                
                if event_type == "text":
                    print(result.get("text", ""), end="", flush=True)
                elif event_type == "done":
                    print("\n\n✓ Complete")
                    break
                    
    finally:
        await client.close()


async def main():
    """Run examples"""
    print("\nMoltis Python Client Examples")
    print("=" * 50)
    print("\n1. Simple chat")
    print("2. Tool execution")
    print("3. Memory search")
    print("4. Run all\n")
    
    choice = input("Choose example (1-4): ").strip()
    
    if choice == "1":
        await example_chat()
    elif choice == "2":
        await example_tool_execution()
    elif choice == "3":
        await example_memory_search()
    elif choice == "4":
        await example_chat()
        print("\n" + "=" * 50 + "\n")
        await example_tool_execution()
        print("\n" + "=" * 50 + "\n")
        await example_memory_search()
    else:
        print("Invalid choice")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\nInterrupted")
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
