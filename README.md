Video Chat Room
================

A simple WebRTC video chat room with signaling server made using python Flask.

Create and join video chat rooms. The users get connected directly to each other in a peer to peer mesh network using WebRTC. They share their audio and video directly with each other without going through a centralized server. However, a centralized server is needed to initiate the connections at first using a process called signaling. This, signaling server is made using Flask in python and data is shared between server and clients using SocketIO.

For a demo visit: https://potatomeet.herokuapp.com/

Installation
-------------
To run this on your machine, install the following:
#### Requirements:
* python 3.x (I use 3.9, but 3.7 or 3.8 will work as well)
* Flask 1.x
* Flask-SocketIO 4.x.x
* eventlet (for websocket support while using SocketIO)
Make sure you have pip installed on your [OSX](https://www.geeksforgeeks.org/how-to-install-pip-in-macos/#:~:text=pip%20can%20be%20downloaded%20and,directory%20as%20python%20is%20installed.&text=and%20wait%20through%20the%20installation,now%20installed%20on%20your%20system) or [Windows](https://phoenixnap.com/kb/install-pip-windows)

Install requirements using pip:
```
pip install -r requirements.txt
```

You may need to install it with pip3 (try both pip and pip3)
```
pip3 install -r requirements.txt
```

Usage
-------------
It runs on a local server. To start a server on localhost:
```
python server.py
```
or you can run it on flask server with development mode
```
(If you are using OSX) EXPORT FLASK_APP=server.py
(If you are using Windows) SET FLASK_APP=server.py
(Then run) flask run
```
Then you must be able to see the information like below
```
 * Serving Flask app "server.py" (lazy loading)
 * Environment: development
 * Debug mode: on
 * Running on http://127.0.0.1:5000/ (Press CTRL+C to quit)
 * Restarting with stat
 * Debugger is active!
 * Debugger PIN: 121-935-247
```
Now you have a local server listening to port 5000. Open a Chrome browser (use Chrome only for now), and access `127.0.0.1:5000`

[![Usage Instruction](https://youtu.be/rUvXf7N8R2Y)]


