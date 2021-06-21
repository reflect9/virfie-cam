Virfie the social video chatting app
================

A simple WebRTC video chat room with signaling server made using python Flask.

Create and join video chat rooms. The users get connected directly to each other in a peer to peer mesh network using WebRTC. They share their audio and video directly with each other without going through a centralized server. However, a centralized server is needed to initiate the connections at first using a process called signaling. This, signaling server is made using Flask in python and data is shared between server and clients using SocketIO.

[Usage Instruction](https://youtu.be/rUvXf7N8R2Y)

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
(If you are using OSX) 
export FLASK_APP=server.py
export FLASK_ENV=development
(If you are using Windows) 
set FLASK_APP=server.py
set FLASK_ENV=development
(Then for both cases) flask run
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

Follow the instruction video below. If you don't follow the order strictly, it may not work properly!  

[Usage Instruction](https://youtu.be/rUvXf7N8R2Y)


Technology
-------------------
This section describes libraries and APIs that the prototype is implemented with.
### Capturing Video Stream

To capture user's video stream, the prototype uses [WebRTC](https://en.wikipedia.org/wiki/WebRTC), which is supported by most conventional web browsers and operative systems. 
  
### Detecting human body
  To separate people from video streams the prototype uses Google's TensorflowJS library, more specifically the [BodyPix module](https://github.com/tensorflow/tfjs-models/tree/master/body-pix). The BodyPix module can segment an image into pixels that are and are not part of a person, and into pixels that belong to each of twenty-four body parts. It works for multiple people in an input image or video as well. 
  
### Peer-to-peer communication
  While WebRTC supports basic peer-to-peer video streaming, video chatrooms require a server for managing multiple connections. For that purpose, the prototype uses [SocketIO](https://socket.io/) on the server-side. 
  
### Video Composition
  When a peer has joined a room, his/her video stream is shared with other peers, and video streams from others will flow into his/her device. Streams from other peers are individually processed to remove their background using the [BodyPix](https://github.com/tensorflow/tfjs-models/tree/master/body-pix) module. Video streams without background are placed onto an empty canvas object. Users can specify placements (x and y coordinates each stream), scale (width and height of each stream in ratio to the source video), and z-index (which one of overlapping streams should be shown). In addition, users can set an image file as the composed video's background. All these options are specified in JSON, which is easy for developers but might be difficult for ordinary users. Nevertheless, we beileve it would be straightforward to replace the JSON editor with a GUI panel. 

