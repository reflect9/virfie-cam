
var myID;
var _peer_list = {};
var local_canvas_list = {};  // containing canvases for videos (without bg) from peers
var local_canvas_list_flipped = {};  
var remove_bg_interval, composition_interval;
let bodyPixInstance;
let current_bg, current_bg_name;
let current_segmentation = {};
let overlays;


// socketio 
var protocol = window.location.protocol;
var socket = io(protocol + '//' + document.domain + ':' + location.port, {autoConnect: false});

// for audio
let memory = null;
let isPlayAudio = false;
let audio = new Audio();

function showAvailableWebcams(){
    navigator.mediaDevices.enumerateDevices()
    .then(devices=>{
        let selector = document.getElementById("select_webcam");
        let videoDevices = devices.filter(d=>{return d.kind=="videoinput";});
        let options_html = videoDevices.map(d=>{
            return `<option value=${d.deviceId}>${d.label}</option>`;
        });
        selector.innerHTML = selector.innerHTML + options_html;
        selector.addEventListener("change",(event)=>{
            console.log(event.target.value + " is selected as your webcam.");
            document.querySelector(".vid-wrapper .overlay_message").classList.add("hidden");
            startCamera(event.target.value);
        });
    });
}
function startCamera(deviceId) {
    console.log("Start camera");
    navigator.mediaDevices.getUserMedia({
        audio:true,
        video:{
            width:{ min:800, max:800, ideal:800 },
            height:{ min:600, max:600, ideal:600 },
            deviceId: { exact: deviceId }
        }
    })
    .then((stream)=>{
        console.log("Camera loaded");
        myVideo.srcObject = stream;
        camera_allowed = true;
        // setAudioMuteState(audioMuted);                
        // setVideoMuteState(videoMuted);
        //start the socketio connection
        console.log("Connecting Socket");
        socket.connect();
    })
    .catch((e)=>{
        console.log("getUserMedia Error! ", e);
        alert("Error! Unable to access camera or mic! ");
    });
}

document.addEventListener("DOMContentLoaded", async (event)=>{
    console.log("Start loading bodypix");
    // document.getElementById("composition_setting").value = JSON.stringify(default_composition_setting, null, 4);
    bodyPix.load({ // BodyPix (https://github.com/tensorflow/tfjs-models/tree/master/body-pix)
        architecture: 'MobileNetV1',
        multiplier: 0.75,
        stride: 16,
        quantBytes: 2,
        estimate:"partmap"
    }).then(net=>{
        bodyPixInstance = net;
    });
    showAvailableWebcams();

});


socket.on("connect", ()=>{
    console.log("socket connected....");
    socket.emit("join-room", {"room_id": myRoomID, "nickname":myName});
});
socket.on("user-connect", (data)=>{
    console.log("user-connect ", data);
    let peer_id = data["sid"];
    let display_name = data["name"];
    _peer_list[peer_id] = undefined; // add new user to user list
    addVideoElement(peer_id, display_name);
});
socket.on("user-disconnect", (data)=>{
    console.log("user-disconnect ", data);
    let peer_id = data["sid"];
    closeConnection(peer_id);
    removeVideoElement(peer_id);
});
socket.on("user-list", (data)=>{
    console.log("user list recvd ", data);
    myID = data["my_id"];
    if( "list" in data) // not the first to connect to room, existing user list recieved
    {
        let recvd_list = data["list"];  
        // add existing users to user list
        for(peer_id in recvd_list)
        {
            display_name = recvd_list[peer_id];
            _peer_list[peer_id] = undefined;
            addVideoElement(peer_id, display_name);
        } 
        start_webrtc();
    }    
});
socket.on("new-composition", (data) => {
    composition = new Composition();
    composition.loadScenario(data["composition"]);

    let title = data["composition"]["scenes"][0]["title"]
    if (title === "Space Wiggle") {
        document.getElementById("select_scenario").selectedIndex = 1;
    } else if (title === "Emotion Tracker") {
        document.getElementById("select_scenario").selectedIndex = 2;
    } else if (title === "Club Entrance") {
        document.getElementById("select_scenario").selectedIndex = 3;
    }
})

function closeConnection(peer_id)
{
    if(peer_id in _peer_list)
    {
        _peer_list[peer_id].onicecandidate = null;
        _peer_list[peer_id].ontrack = null;
        _peer_list[peer_id].onnegotiationneeded = null;

        // document.getElementById("div_"+peer_id).remove();
        delete _peer_list[peer_id]; // remove user from user list
    }
}

function log_user_list()
{
    for(let key in _peer_list)
    {
        console.log(`${key}: ${_peer_list[key]}`);
    }
}

function updateConmposition(){
    let data = JSON.parse(document.getElementById("composition_editor").value);

    socket.emit("update-composition", data);
}

//---------------[ webrtc ]--------------------    

var PC_CONFIG = {
    iceServers: [
        {
            urls: ['stun:stun.l.google.com:19302', 
                    'stun:stun1.l.google.com:19302',
                    'stun:stun2.l.google.com:19302',
                    'stun:stun3.l.google.com:19302',
                    'stun:stun4.l.google.com:19302'
                ]
        },
    ]
};

function log_error(e){console.log("[ERROR] ", e);}
function sendViaServer(data){socket.emit("data", data);}

socket.on("data", (msg)=>{
    switch(msg["type"])
    {
        case "offer":
            handleOfferMsg(msg);
            break;
        case "answer":
            handleAnswerMsg(msg);
            break;
        case "new-ice-candidate":
            handleNewICECandidateMsg(msg);
            break;
    }
});

function start_webrtc()
{
    // send offer to all other members
    for(let peer_id in _peer_list)
    {
        invite(peer_id);
    }
}

function invite(peer_id)
{
    if(_peer_list[peer_id]){console.log("[Not supposed to happen!] Attempting to start a connection that already exists!")}
    else if(peer_id === myID){console.log("[Not supposed to happen!] Trying to connect to self!");}
    else
    {
        console.log(`Creating peer connection for <${peer_id}> ...`);
        createPeerConnection(peer_id);

        let local_stream = myVideo.srcObject;
        local_stream.getTracks().forEach((track)=>{_peer_list[peer_id].addTrack(track, local_stream);});
    }
}

function createPeerConnection(peer_id)
{
    _peer_list[peer_id] = new RTCPeerConnection(PC_CONFIG);

    _peer_list[peer_id].onicecandidate = (event) => {handleICECandidateEvent(event, peer_id)}; // telling peer that I am the sender 
    _peer_list[peer_id].ontrack = (event) => {handleTrackEvent(event, peer_id)}; // showing video from peer
    _peer_list[peer_id].onnegotiationneeded = () => {handleNegotiationNeededEvent(peer_id)};
}


function handleNegotiationNeededEvent(peer_id)
{
    _peer_list[peer_id].createOffer()
    .then((offer)=>{return _peer_list[peer_id].setLocalDescription(offer);})
    .then(()=>{
        console.log(`sending offer to <${peer_id}> ...`);
        sendViaServer({
            "sender_id": myID,
            "target_id": peer_id,
            "type": "offer",
            "sdp": _peer_list[peer_id].localDescription
        });
    })
    .catch(log_error);
} 

function handleOfferMsg(msg)  // handling offer message from peer
{   
    peer_id = msg['sender_id'];

    console.log(`offer recieved from <${peer_id}>`);
    
    createPeerConnection(peer_id);  // creating a new RTCPeerConnection instance for the peer
    let desc = new RTCSessionDescription(msg['sdp']);
    _peer_list[peer_id].setRemoteDescription(desc)
    .then(()=>{
        let local_stream = myVideo.srcObject;
        // adds all the tracks which will be transmitted to the other peer.
        local_stream.getTracks().forEach((track)=>{_peer_list[peer_id].addTrack(track, local_stream);});
    })
    .then(()=>{
        // answer is created for the offer from the peer. The answer contains information about 
        // any media already attached to the session, codecs and options supported by the browser,
        // and any ICE candidates already gathered. The answer is delivered to the returned Promise, 
        // and should then be sent to the source of the offer to continue the negotiation process.
        return _peer_list[peer_id].createAnswer();})
    .then((answer)=>{
        // changes the local description associated with the connection. This description 
        // specifies the properties of the local end of the connection, including the media format.
        return _peer_list[peer_id].setLocalDescription(answer);})
    .then(()=>{
        console.log(`sending answer to <${peer_id}> ...`);
        sendViaServer({
            "sender_id": myID,
            "target_id": peer_id,
            "type": "answer",
            "sdp": _peer_list[peer_id].localDescription
        });
    })
    .catch(log_error);
}

function handleAnswerMsg(msg)
{
    peer_id = msg['sender_id'];
    console.log(`answer recieved from <${peer_id}>`);
    let desc = new RTCSessionDescription(msg['sdp']);
    _peer_list[peer_id].setRemoteDescription(desc)
}

// sending ICECandidateEvent to the peer
function handleICECandidateEvent(event, peer_id)
{
    if(event.candidate){
        sendViaServer({
            "sender_id": myID,
            "target_id": peer_id,
            "type": "new-ice-candidate",
            "candidate": event.candidate
        });
    }
}

// receiving ICECandidate Event Message
function handleNewICECandidateMsg(msg)
{
    console.log(`ICE candidate recieved from <${peer_id}>`);
    var candidate = new RTCIceCandidate(msg.candidate);
    // When a web site or app using RTCPeerConnection receives a new ICE 
    // candidate from the remote peer over its signaling channel, 
    // it delivers the newly-received candidate to the browser's 
    // ICE agent by calling RTCPeerConnection.addIceCandidate().
    _peer_list[msg["sender_id"]].addIceCandidate(candidate)
    .catch(log_error);
}

// adding the track from peer to the video object
function handleTrackEvent(event, peer_id)
{
    console.log(`track event recieved from <${peer_id}>`);
    
    if(event.streams)
    {
        // assign the first stream from the peer to the VIDEO element
        getVideoObj(peer_id).srcObject = event.streams[0];
    }
}


function toggle_video_composition(){
    if (composition_interval) {
        clearInterval(composition_interval);
        composition_interval = undefined;
        document.querySelector("button#start_scene").innerHTML = "Start Video Composition";
    }else {
        start_audio();
        start_video_composition();
        document.querySelector("button#start_scene").innerHTML = "Stop Video Composition";
    }
}

function start_audio(){
    setInterval(() => {
        // if there is a audio that's already playing.
        if (isPlayAudio) {
            return;
        }

        // let scene_setting = JSON.parse(document.getElementById("composition_setting").value);
        let scene_setting = composition.getCurrentScene();
        if(typeof scene_setting["audio"] == "undefined") return;
        
        const current_audio = scene_setting["audio"];
        if (current_audio && (current_audio !== memory)) {
            audio.src = current_audio;
            audio.loop = true;
            audio.load();

            audio.play();

            memory = current_audio;
        }
    }, 50)
}

function play_audio(title) {
    // if there is a audio that's already playing.
    if (isPlayAudio || (title === memory)) {
        return;
    }

    // pause previous audio
    audio.pause();

    isPlayAudio = true;
    audio.src = title;
    audio.loop = true;
    audio.load();
    
    audio.play();

    memory = title;
}

function stop_audio() {
    // if there is no audio to stop
    if (!isPlayAudio) return;

    isPlayAudio = false;
    audio.pause();
}

function start_video_composition(){
    let composite_canvas = document.querySelector("#composite_vid");
    // Create an interval that regularly processes videos
    // remove_bg_interval = setInterval(()=>{
    //     let local_videos = document.querySelectorAll("#div_local_vid video");
    //     local_videos.forEach(lv=>{
    //         perform(bodyPixInstance, lv, composite_canvas);
    //     });
    // },100);

    // Drawing onto the targetCanvas
    composition_interval = setInterval(()=>{
        let comp_ctx = composite_canvas.getContext("2d");
        comp_ctx.width = 800; comp_ctx.height = 600;
        comp_ctx.globalCompositeOperation = "source-over";
        
        // Perform > Removing backgrounds of all local videos and flip horizontally
        let local_videos = document.querySelectorAll("#div_local_vid video");
        local_videos.forEach(lv=>{
            if (lv.readyState == 4) {
                perform(bodyPixInstance, lv, composite_canvas);
            }
        });
        
        // Start video composition
        // let scene_setting = JSON.parse(document.getElementById("composition_setting").value);
        scene_setting = composition.getCurrentScene();
        
        // Draw background image from composition.backgroundResources
        if (scene_setting["background"] && scene_setting["background"]["name"]) {
            if (composition["backgroundResources"] && composition["backgroundResources"][scene_setting["background"]["name"]]){
                let bg_dict = composition["backgroundResources"][scene_setting["background"]["name"]];
                if(Object.keys(bg_dict).length==1) {
                    let bg_img = bg_dict[0];
                    if (bg_img) {
                        comp_ctx.drawImage(bg_img,0,0,composite_canvas.width, composite_canvas.height);
                    }    
                } else {
                    let interval_millisec = scene_setting["background"]["interval"];
                    if (typeof interval_millisec == "undefined") interval_millisec = 2000;
                    let bg_frame_index = Math.ceil(new Date().getTime() / interval_millisec) % Object.keys(bg_dict).length;
                    bg_img = bg_dict[bg_frame_index];
                    comp_ctx.drawImage(bg_img,0,0,composite_canvas.width, composite_canvas.height);
                }
            }
        }
        
        // Displaying webcam streams in the order of z-index
        let display_names_sorted_by_z_index = Object.keys(scene_setting.players).sort((s1,s2)=>{
            return scene_setting.players[s2]["z-index"] - scene_setting.players[s1]["z-index"];
        }).reverse();
        display_names_sorted_by_z_index.forEach((display_name)=>{
            try{
                let video_element_id;
                if(display_name==myName) {
                    video_element_id = "local_vid";
                } else {
                    let video_element = document.querySelector("div.display-name[name='"+display_name+"']");
                    if (video_element == null) return; // the player has not joined yet
                    else {
                        video_element_id = document.querySelector("div.display-name[name='"+display_name+"']")
                        .closest("div.video-item").id.replace("div_","");
                    }
                }
                let local_canvas_flipped = local_canvas_list_flipped[video_element_id];
                if (typeof local_canvas_flipped == "undefined") return;
                else {
                    // Use composition_setting here
                    let cs = scene_setting.players[display_name];  // cs means composition setting for the video
                    let x = composite_canvas.width * (parseFloat(cs.x.replace("%",""))/100);
                    let y = composite_canvas.height * (parseFloat(cs.y.replace("%",""))/100);
                    let width = composite_canvas.width * (parseFloat(cs.scale.replace("%",""))/100);
                    let height = composite_canvas.height * (parseFloat(cs.scale.replace("%",""))/100);
                    comp_ctx.drawImage(local_canvas_flipped, x, y, width, height);
                }
            } catch(e) {
                console.log(e);
                return;
            }
        });
        // Load overlay image if the image file has not loaded (or changed)
        // if (scene_setting["overlays"]) {
            // // Check if the overlays information has been updated
            // if (typeof overlays == "undefined" || _.isEqual(scene_setting["overlays"],overlays)==false) {
            //     console.log("New overlay setting is detected");
            //     overlays = scene_setting["overlays"];
            //     let overlay_img = new Image();
            //     overlay_img.src = "/static/"+scene_setting["overlay"]["filename"];
            //     overlay_img.onload = ()=>{ 
            //         current_overlay = overlay_img;
            //         current_overlay_info = scene_setting["overlay"];
            //     };
            // }
        // }
        if(scene_setting["overlays"]) {
            scene_setting["overlays"].forEach(overlay_setting =>{
                let x, y;
                let overlay_img_dict = composition.overlayResources[overlay_setting.name];
                let overlay_img_list = Object.keys(overlay_img_dict).sort().map(i=>{return overlay_img_dict[i];});
                if (overlay_img_list == null || overlay_img_list.length==0) return;
                let overlay_img;
                if (overlay_img_list.length == 1) overlay_img = overlay_img_list[0];
                else { // For multiple images, pick the right frame
                    let img_frame = Math.ceil(new Date().getTime() / 200) % overlay_img_list.length;
                    // console.log("FRAME:" + img_frame);
                    overlay_img = overlay_img_list[img_frame];
                } 
                ///////
                if (!overlay_setting["position"]) return;
                if (overlay_setting["position"]["type"] == "coordinate") {
                    x = overlay_setting["position"]["x"];
                    y = overlay_setting["position"]["y"];
                    comp_ctx.drawImage(overlay_img, x, y);
                } else if(overlay_setting["position"]["type"] == "tracking") {
                    let player_id; ;
                    if(overlay_setting["position"]["player"]==myName) { player_id = "local_vid"; }
                    else {
                        player_id = "div_" + overlay_setting["position"]["player"];
                    }
                    if(current_segmentation[player_id] != null) {
                        let anchor_obj = current_segmentation[player_id].allPoses[0].keypoints
                        .filter(p=>{return p.part==overlay_setting["position"]["body_part"]; })[0];
                        // console.log(player_id + " " + overlay_setting["position"]["body_part"] + " " + anchor_obj.score);
                        if (anchor_obj.score < 0.1) return;  // the threshold to show / not show the overlay
                        let anchor_original = anchor_obj.position;
                        let anchor = {
                            x: 800 - anchor_original.x,
                            y: anchor_original.y
                        };
                        // console.log("ANCHOR: " + anchor.x + "," + anchor.y);
                        
                        let cs = scene_setting.players[overlay_setting["position"]["player"]];  // cs means composition setting for the video
                        let video_x = composite_canvas.width * (parseFloat(cs.x.replace("%",""))/100);
                        let video_y = composite_canvas.height * (parseFloat(cs.y.replace("%",""))/100);
                        let video_width = composite_canvas.width * (parseFloat(cs.scale.replace("%",""))/100);
                        let video_height = composite_canvas.height * (parseFloat(cs.scale.replace("%",""))/100);
                        
                        let anchorX_on_comp = video_x + (anchor.x * (video_width / 800));
                        let anchorY_on_comp = video_y + (anchor.y * (video_height / 600));
                        let width_on_comp = overlay_img.width * (video_width / 800);
                        let height_on_comp = overlay_img.height * (video_height / 600); 

                        let overlayX_on_comp = anchorX_on_comp - (width_on_comp / 2);
                        let overlayY_on_comp = anchorY_on_comp - (height_on_comp / 2);

                        if (overlay_setting["position"]["offset"]) {
                            overlayX_on_comp += overlay_setting["position"]["offset"]["x"];
                            overlayY_on_comp += overlay_setting["position"]["offset"]["y"];
                        }
                        if (overlay_setting["position"]["scale"]) {
                            width_on_comp = width_on_comp * overlay_setting["position"]["scale"];
                            height_on_comp = height_on_comp * overlay_setting["position"]["scale"];
                            overlayX_on_comp -= width_on_comp / 2;
                            overlayY_on_comp -= height_on_comp / 2;
                        }
                        comp_ctx.drawImage(overlay_img, overlayX_on_comp, overlayY_on_comp, width_on_comp, height_on_comp);
                    }
                }
            })
        }
        if(scene_setting["triggers"]) {
            _.forEach(scene_setting["triggers"], (trg,trg_name)=>{
                // console.log("Checking if " + trg_name + "'s condition is satisfied");
                try {
                    // STEP 1. Checking if the trigger conditions are all satisfied
                    let isAllConditionSatisfied = _.every(trg.conditions, (cond)=>{
                        if (cond.type=="positions") {
                            // getting positions to check
                            let positions = [];
                            if (typeof cond.segments != "undefined") {
                                if (cond.segments.players == "ALL") {
                                    // Iterate all players and add their [body_part] segments to positions
                                    positions = _.map(current_segmentation, (playerSegmentation,playerID)=>{
                                        if (playerID=="local_vid") playerID = myName;
                                        let anchor_obj = playerSegmentation.allPoses[0].keypoints
                                            .filter(p=>{return p.part==cond.segments.body_part; })[0];
                                        if (anchor_obj.score < 0.1) return false;  
                                        let anchor_original = anchor_obj.position;
                                        let anchor = {
                                            x: 800 - anchor_original.x,
                                            y: anchor_original.y
                                        };
                                        let cs = scene_setting.players[playerID];  // cs means composition setting for the video
                                        let video_x = composite_canvas.width * (parseFloat(cs.x.replace("%",""))/100);
                                        let video_y = composite_canvas.height * (parseFloat(cs.y.replace("%",""))/100);
                                        let video_width = composite_canvas.width * (parseFloat(cs.scale.replace("%",""))/100);
                                        let video_height = composite_canvas.height * (parseFloat(cs.scale.replace("%",""))/100);
                                        let anchorX_on_comp = video_x + (anchor.x * (video_width / 800));
                                        let anchorY_on_comp = video_y + (anchor.y * (video_height / 600));
                                        return {
                                            "x":anchorX_on_comp, "y":anchorY_on_comp
                                        }
                                    });
                                    // console.log(positions);
                                } else {
                                    // TBD: when we are checking specific players
                                }
                            } else if (typeof cond.segments_each_player != "undefined") {
                                // Case of giving segments for each player separatedly
                                // Iterate all players and add their [body_part] segments to positions
                                positions = _.map(cond.segments_each_player, (seg, playerID)=>{
                                    let playerSegmentation;
                                    if (playerID==myName) playerSegmentation = current_segmentation["local_vid"];
                                    else playerSegmentation = current_segmentation[playerID];
                                    let anchor_obj = playerSegmentation.allPoses[0].keypoints
                                        .filter(p=>{return p.part==seg.body_part; })[0];
                                    if (anchor_obj.score < 0.1) return false;  
                                    let anchor_original = anchor_obj.position;
                                    let anchor = {
                                        x: 800 - anchor_original.x,
                                        y: anchor_original.y
                                    };
                                    // Translating anchor position to the current composition setting > payer's video section
                                    let cs = scene_setting.players[playerID];  // cs means composition setting for the video
                                    let video_x = composite_canvas.width * (parseFloat(cs.x.replace("%",""))/100);
                                    let video_y = composite_canvas.height * (parseFloat(cs.y.replace("%",""))/100);
                                    let video_width = composite_canvas.width * (parseFloat(cs.scale.replace("%",""))/100);
                                    let video_height = composite_canvas.height * (parseFloat(cs.scale.replace("%",""))/100);
                                    let anchorX_on_comp = video_x + (anchor.x * (video_width / 800));
                                    let anchorY_on_comp = video_y + (anchor.y * (video_height / 600));
                                    return {
                                        "x":anchorX_on_comp, "y":anchorY_on_comp
                                    }
                                });
                            }
                            // Checking whether all the positions are within the range
                            let isConditionSatisfied = _.every(positions, (p)=>{
                                if (p == false) return false;
                                let min_y = composite_canvas.height * (parseFloat(cond.area.top.replace("%",""))/100);
                                let max_y = composite_canvas.height * (parseFloat(cond.area.bottom.replace("%",""))/100);
                                let min_x = composite_canvas.width * (parseFloat(cond.area.left.replace("%",""))/100);
                                let max_x = composite_canvas.width * (parseFloat(cond.area.right.replace("%",""))/100);
                                return (p.x > min_x) && (p.x < max_x) && (p.y > min_y) && (p.y < max_y);
                            });
                            return isConditionSatisfied;
                            // console.log(isConditionSatisfied);
                        } else if(cond.type=="pass"){
                            return true;
                        } else {
                            // TBD: for other types of conditions
                            return true; 
                        }
                    });
                    if (!isAllConditionSatisfied) return;
                    // STEP 2. Perform actions if all the conditions are satisfied for the trigger
                    _.forEach(trg.actions, (action, actionTitle)=>{
                        if(action.method=="image_filter") {
                            if(action.params.filter.type=="twirl") {
                                let distortedImage = filters["twirl"](composite_canvas, action.params.filter.cycle, action.params.filter.angle);
                                comp_ctx.drawImage(distortedImage,0,0);
                            } else {
                                // TBD: other types of filter
                            }
                        } else if(action.method=="weather_icon_tracker"){
                            filters["weather_icon_tracker"](composite_canvas, current_segmentation, scene_setting);
                        } else if(action.method=="random_snapshots"){
                            filters["random_snapshots"](composite_canvas, action.params);
                        } else if(action.method=="cheers"){
                            filters["cheers"](composite_canvas);
                        } else {
                            // TBD: other types of action
                        }
                    });
                } catch(e) {
                    // 
                }


            });
        }
    },100);
    
}


async function perform(net, originalVideoElement, targetCanvasElement) {
    let originalVideoID = originalVideoElement.id.replace("vid_","");
    // let video = document.querySelector("#local_vid");
    let segmentation = await net.segmentPerson(originalVideoElement,{
        architecture:"MobileNetV1",
        internalResolution: 'full',
        outputStride:4,
        multiplier:1,
        quantBytes:4,
        segmentationThreshold: 0.6,
        maxDetections: 1,
        maskBlurAmount:2
    });
    const foregroundColor = {r: 255, g: 255, b: 255, a: 255};
    const backgroundColor = {r: 255, g: 255, b: 255, a: 0};
    const mask = bodyPix.toMask(
        segmentation, foregroundColor, backgroundColor,
        true);
    // const edgeBlurAmount = 2;
    // const flipHorizontal = false;
    // Painting Mask
    // bodyPix.drawMask(targetCanvasElement, originalVideoElement, mask, 0.6, 1, false);
    // drawPersonOnly(targetCanvasElement, originalVideoElement, mask, 1);
    
    // Saving current segmentation for the composition
    current_segmentation[originalVideoID] = segmentation;

    // Drawing it on temporary canvas    
    if (typeof local_canvas_list[originalVideoID] === "undefined") {
        local_canvas_list[originalVideoID] = document.createElement("canvas");
        local_canvas_list[originalVideoID].width = 800; 
        local_canvas_list[originalVideoID].height= 600;
        local_canvas_list_flipped[originalVideoID] = document.createElement("canvas");
        local_canvas_list_flipped[originalVideoID].width = 800; 
        local_canvas_list_flipped[originalVideoID].height= 600;
        local_canvas_list_flipped[originalVideoID].getContext("2d").translate(800,0);  // Flipping the drawing context
        local_canvas_list_flipped[originalVideoID].getContext("2d").scale(-1,1);
    }
    let temp_canvas = local_canvas_list[originalVideoID];
    temp_canvas.getContext('2d').putImageData(mask,0,0);
    temp_canvas.getContext('2d').globalCompositeOperation = "source-in";
    temp_canvas.getContext('2d').drawImage(originalVideoElement, 0, 0);
    let ctx_flipped = local_canvas_list_flipped[originalVideoID].getContext("2d");
    ctx_flipped.clearRect(0,0,800,600);
    ctx_flipped.drawImage(temp_canvas, 0, 0);

}


