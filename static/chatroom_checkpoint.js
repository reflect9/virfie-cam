var audioMuted = false;
var videoMuted = false;
var bodyPixInstance;
var VIDEO_WIDTH = 320;
var VIDEO_HEIGHT = 240;


document.addEventListener("DOMContentLoaded", (event)=>{
    var muteVideoField = document.getElementById("mute_video_inp");
    var muteVidBttn = document.getElementById("bttn_vid_mute");
    var myVideo = document.getElementById("local_vid");

    bodyPix.load({ // BodyPix (https://github.com/tensorflow/tfjs-models/tree/master/body-pix)
        architecture: 'MobileNetV1',
        multiplier: 0.75,
        stride: 16,
        quantBytes: 2,
        estimate:"partmap"
    }).then(net=>{
        bodyPixInstance = net;
    });


    muteVidBttn.addEventListener("click", (event)=>{
        videoMuted = !videoMuted;
        let local_stream = myVideo.srcObject;
        local_stream.getVideoTracks().forEach((track)=>{track.enabled = !videoMuted;});
        // store in hidden from input
        muteVideoField.value = (videoMuted)? "1":"0";    
        // switch button icon
        document.getElementById("vid_mute_icon").innerText = (videoMuted)? "videocam_off": "videocam";
    });  
    
    startCamera();
    
});


var camera_allowed=false;
var mediaConstraints = {
    audio: true,
    video: {
        width: VIDEO_WIDTH,
        height: VIDEO_HEIGHT
    } 
};

function validate()
{
    if(!camera_allowed)
    {alert("Please allow camera and mic permissions!");}
    return camera_allowed;
}

function startCamera()
{
    navigator.mediaDevices.getUserMedia(mediaConstraints)
    .then((stream)=>{
        let local_vid = document.getElementById("local_vid");
        local_vid.srcObject = stream;
        camera_allowed=true;
        local_vid.addEventListener('loadeddata', ()=>{
            start_video_processing(local_vid);
        });
    })
    .catch((e)=>{
        console.log("Error! Unable to start video! ", e);
        document.getElementById("permission_alert").style.display = "block";
    });
}

function start_video_processing(source_video) {
    let target_canvas = document.querySelector("#local_vid_canvas");
    processing_interval = setInterval(()=>{
        perform(bodyPixInstance, source_video, target_canvas);
    },100);
}

async function perform(net, originalVideoElement, targetCanvasElement) {
    current_segmentation = await net.segmentPerson(originalVideoElement,{
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
        current_segmentation, foregroundColor, backgroundColor,
        true);
    // TUNING THE MASK
    // const edgeBlurAmount = 2;
    // const flipHorizontal = false;
    // Painting Mask
    // bodyPix.drawMask(targetCanvasElement, originalVideoElement, mask, 0.6, 1, false);
    // drawPersonOnly(targetCanvasElement, originalVideoElement, mask, 1);
    
    // APPLYING MASK (i.e. REMOVING BACKGROUND)
    let temp_canvas = document.createElement("canvas");
    temp_canvas.width = VIDEO_WIDTH;
    temp_canvas.height = VIDEO_HEIGHT;
    let temp_ctx = temp_canvas.getContext('2d');
    temp_ctx.putImageData(mask,0,0);
    temp_ctx.globalCompositeOperation = "source-in";
    temp_ctx.drawImage(originalVideoElement, 0, 0);

    // FLIPPING IMAGE
    let temp_canvas_flipped = document.createElement("canvas");
    temp_canvas_flipped.width = VIDEO_WIDTH;
    temp_canvas_flipped.height = VIDEO_HEIGHT;
    let ctx_flipped = temp_canvas_flipped.getContext("2d");
    ctx_flipped.clearRect(0,0,VIDEO_WIDTH,VIDEO_HEIGHT);
    ctx_flipped.translate(VIDEO_WIDTH, 0);
    ctx_flipped.scale(-1, 1);
    ctx_flipped.drawImage(temp_canvas, 0, 0);

    // DRAWING ON THE TARGET CANVAS
    targetCanvasElement.getContext('2d').clearRect(0,0,targetCanvasElement.width, targetCanvasElement.height);
    targetCanvasElement.getContext('2d').drawImage(temp_canvas_flipped, 0, 0);
}