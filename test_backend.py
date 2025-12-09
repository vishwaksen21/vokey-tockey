#!/usr/bin/env python3
"""
Test script to verify Vokey-Tockey backend is working correctly
Run this after deploying to production
"""

import asyncio
import websockets
import json
import sys

BACKEND_URL = "wss://vokey-tockey-backend.onrender.com"
# BACKEND_URL = "ws://localhost:8000"  # For local testing

async def test_websocket_connection():
    """Test WebSocket connection to backend"""
    room_id = "test-room-123"
    url = f"{BACKEND_URL}/ws/rooms/{room_id}"
    
    print(f"🔗 Testing WebSocket connection to: {url}")
    
    try:
        async with websockets.connect(url) as websocket:
            print("✅ WebSocket connected successfully!")
            
            # Wait for join message
            message = await asyncio.wait_for(websocket.recv(), timeout=5.0)
            data = json.loads(message)
            
            print(f"📨 Received message: {data}")
            
            if data.get('type') == 'join':
                client_id = data.get('clientId')
                print(f"✅ Successfully joined room as client: {client_id}")
                return True
            else:
                print(f"❌ Unexpected message type: {data.get('type')}")
                return False
                
    except asyncio.TimeoutError:
        print("❌ Timeout waiting for server response")
        return False
    except websockets.exceptions.InvalidStatusCode as e:
        print(f"❌ Invalid status code: {e}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

async def test_health_endpoint():
    """Test HTTP health endpoint"""
    import aiohttp
    
    url = BACKEND_URL.replace('wss://', 'https://').replace('ws://', 'http://')
    health_url = f"{url}/health"
    
    print(f"\n🏥 Testing health endpoint: {health_url}")
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(health_url) as response:
                if response.status == 200:
                    data = await response.json()
                    print(f"✅ Health check passed: {data}")
                    return True
                else:
                    print(f"❌ Health check failed with status: {response.status}")
                    return False
    except Exception as e:
        print(f"❌ Error accessing health endpoint: {e}")
        return False

async def main():
    """Run all tests"""
    print("=" * 60)
    print("🎙️  VOKEY-TOCKEY BACKEND TEST")
    print("=" * 60)
    
    # Test health endpoint
    health_ok = await test_health_endpoint()
    
    # Test WebSocket
    ws_ok = await test_websocket_connection()
    
    print("\n" + "=" * 60)
    if health_ok and ws_ok:
        print("✅ ALL TESTS PASSED - Backend is working correctly!")
        print("=" * 60)
        return 0
    else:
        print("❌ SOME TESTS FAILED - Check the errors above")
        print("=" * 60)
        return 1

if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
