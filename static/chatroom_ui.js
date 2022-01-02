var myVideo;

document.addEventListener("DOMContentLoaded", (event)=>{
    myVideo = document.getElementById("local_vid");
    myVideo.onloadeddata = ()=>{console.log("W,H: ", myVideo.videoWidth, ", ", myVideo.videoHeight);};
    // var muteBttn = document.getElementById("bttn_mute");
    // var muteVidBttn = document.getElementById("bttn_vid_mute");
    var callEndBttn = document.getElementById("call_end");

    // muteBttn.addEventListener("click", (event)=>{
    //     audioMuted = !audioMuted;
    //     setAudioMuteState(audioMuted);        
    // });    
    // muteVidBttn.addEventListener("click", (event)=>{
    //     videoMuted = !videoMuted;
    //     setVideoMuteState(videoMuted);        
    // });    
    callEndBttn.addEventListener("click", (event)=>{
        window.location.replace("/");
    });

    var nextSceneBtn = document.getElementById("nextScene");
    if(nextSceneBtn) nextSceneBtn.addEventListener("click", (event)=>{
        composition.nextScene();
    });
    var prevSceneBtn = document.getElementById("prevScene");
    if(prevSceneBtn) prevSceneBtn.addEventListener("click", (event)=>{
        composition.prevScene();
    });

    // sync composition when users press update button
    // var composition_editor = document.getElementById("composition_editor");
    // composition_editor.addEventListener("keyup",(event)=>{
    //     console.log("COMPOSITON CHANGED");
    //     composition = new Composition();
    //     composition.loadScenario(JSON.parse(event.target.value));
    // });

    // sync composition when users change scenario
    document.getElementById("select_scenario").addEventListener("change",(event)=>{
        console.log(event.target.value + " is selected as your scenario.");
        audio.pause();
        
        socket.emit("update-composition", scenarios[event.target.value]);
        composition =new Composition();
        composition.loadScenario(scenarios[event.target.value]);
    });
    // document.getElementById("room_link").innerHTML=`or the link: <span class="heading-mark">${window.location.href}</span>`;

});


function makeVideoElement(element_id, display_name)
{
    let wrapper_div = document.createElement("div");
    let vid_wrapper = document.createElement("div");
    let vid = document.createElement("video");
    let name_text = document.createElement("div");

    wrapper_div.id = "div_"+element_id;
    vid.id = "vid_"+element_id;
    vid.setAttribute("width","640"); 
    vid.setAttribute("height","480");

    wrapper_div.className = "video-item";
    vid_wrapper.className = "vid-wrapper";
    name_text.className = "display-name";
    
    vid.autoplay = true;        
    name_text.setAttribute("name", display_name);
    name_text.innerText = display_name;

    vid_wrapper.appendChild(vid);
    wrapper_div.appendChild(vid_wrapper);
    wrapper_div.appendChild(name_text);

    return wrapper_div;
}

function addVideoElement(element_id, display_name)
{        
    document.getElementById("video_grid").appendChild(makeVideoElement(element_id, display_name));
}
function removeVideoElement(element_id)
{    
    let v = getVideoObj(element_id);
    if(v && v.srcObject){
        v.srcObject.getTracks().forEach(track => track.stop());
    }
    v.removeAttribute("srcObject");
    v.removeAttribute("src");

    document.getElementById("div_"+element_id).remove();
}

function getVideoObj(element_id)
{
    return document.getElementById("vid_"+element_id);
}

function take_snapshot() {
    let composite_canvas = document.getElementById("composite_vid");
    let snapshot_image = composite_canvas.toDataURL();
    // Creating image object in the snapshot_list > ul > li 
    let li = document.createElement("li");
    let img_el = document.createElement("img");
    img_el.src = snapshot_image;
    li.appendChild(img_el);
    let ul = document.querySelector("#snapshot_list ul");
    let existingSnapshots = ul.querySelectorAll("li");
    ul.insertBefore(li, existingSnapshots[0]);   
}
function take_snapshot_framed(x,y,width,height,angle){
    let composite_canvas = document.getElementById("composite_vid");
    let snapshot_image = composite_canvas.toDataURL();
    let crop_canvas = document.createElement("canvas");
    crop_canvas.width = width; crop_canvas.height = height;
    let crop_ctx = crop_canvas.getContext("2d");
    crop_ctx.drawImage(composite_canvas, x, y, width, height, 0, 0, width, height);
    // 
    let li = document.createElement("li");
    li.appendChild(crop_canvas);
    let ul = document.querySelector("#snapshot_list ul");
    let existingSnapshots = ul.querySelectorAll("li");
    ul.insertBefore(li, existingSnapshots[0]);   
}

function toggle_fullscreen() {
    let vEl = document.querySelector("#composite_vid_wrapper");
    vEl.classList.toggle("fullscreen");
}