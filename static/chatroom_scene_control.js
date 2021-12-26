/*  TYPES OF body_parts
0: {score: 0.9970370531082153, part: 'nose', position: {…}}
1: {score: 0.929119884967804, part: 'leftEye', position: {…}}
2: {score: 0.9982529878616333, part: 'rightEye', position: {…}}
3: {score: 0.014021996408700943, part: 'leftEar', position: {…}}
4: {score: 0.9917399883270264, part: 'rightEar', position: {…}}
5: {score: 0.8358783721923828, part: 'leftShoulder', position: {…}}
6: {score: 0.9247910976409912, part: 'rightShoulder', position: {…}}
7: {score: 0.2898447811603546, part: 'leftElbow', position: {…}}
8: {score: 0.31904900074005127, part: 'rightElbow', position: {…}}
9: {score: 0.21667547523975372, part: 'leftWrist', position: {…}}
10: {score: 0.1436486542224884, part: 'rightWrist', position: {…}}
11: {score: 0.045547667890787125, part: 'leftHip', position: {…}}
12: {score: 0.04740595072507858, part: 'rightHip', position: {…}}
13: {score: 0.028288090601563454, part: 'leftKnee', position: {…}}
14: {score: 0.009432193823158741, part: 'rightKnee', position: {…}}
15: {score: 0.003448032308369875, part: 'leftAnkle', position: {…}}
16: {score: 0.00617072731256485, part: 'rightAnkle', position: {…}}
*/

// Worker function that extracts images from a video 
// function getVideoImage(path, secs, callback) {
//     var me = this, video = document.createElement('video');
//     video.onloadedmetadata = function () {
//         if ('function' === typeof secs) {
//             secs = secs(this.duration);
//         }
//         this.currentTime = Math.min(Math.max(0, (secs < 0 ? this.duration : 0) + secs), this.duration);
//     };
//     video.onseeked = function (e) {
//         var canvas = document.createElement('canvas');
//         canvas.height = video.videoHeight;
//         canvas.width = video.videoWidth;
//         var ctx = canvas.getContext('2d');
//         ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
//         video.remove();
//         video.srcObject = null;
//         var img = new Image();
//         img.src = canvas.toDataURL();
//         callback.call(me, img, this.currentTime, e);
//     };
//     video.onerror = function (e) {
//         callback.call(me, undefined, undefined, e);
//     };
//     video.src = path;
// }
// function getFrameImages(path, intervalSecond, imageArray) {
//     var duration;
//     getVideoImage(
//         path,
//         function (totalTime) {
//             duration = totalTime;
//             return intervalSecond;
//         },
//         function (img, secs, event) {
//             if (event.type == 'seeked') {
//                 imageArray.push(img);
//                 secs += intervalSecond;
//                 if (duration >= secs) {
//                     getFrameImages(path, intervalSecond, imageArray);
//                 };
//             }
//         }
//     );
// }



// Defining Composition Class 
class Composition {
    scenario;
    scenes; // Array
    currentSceneIdx; // current scene index (e.g. 0,1,...)
    overlayResources;
    currentFrame;
    constructor() {
        this.currentSceneIdx = 0;
        this.overlayResources = {};
        this.currentFrame = 0;
    }
    loadScenario = (inputScenario) => {
        this.showScenarioOnUI(inputScenario);
        this.scenario = inputScenario;
        this.scenes = this.scenario.scenes;
        this.loadResources();
    }
    showScenarioOnUI = (inputScenario) => {
        document.getElementById("composition_editor").value = JSON.stringify(inputScenario, null, 3);
    }
    getCurrentScene = () => { 
        return this.scenes[this.currentSceneIdx]; 
    }
    getScene = (sceneIdx) => { return this.scenes[sceneIdx]; }
    loadResources = () => {
        this.scenes.forEach(scene=>{
            if(Array.isArray(scene["overlays"])) {
                scene["overlays"].forEach(overlay => {
                    let overlay_img = new Image();
                    overlay_img.src = "/static/"+overlay["filename"];
                    overlay_img.filename = overlay["filename"];
                    this.overlay_info = overlay;
                    overlay_img.onload = ()=>{ 
                        this.overlayResources[overlay_img.filename] = overlay_img;
                    };
                });
            }
        });
    }
    restartScene = () => {
        this.currentFrame = 0;
    }
    nextFrame = () => {
        this.currentFrame++;
    }
    getCurrentComposition = () => {
        // Apply the current frame (TBD)
        //
        return this.getCurrentScene();
    }
    nextScene = () => { 
        this.currentSceneIdx++; 
        if(this.currentSceneIdx >= this.scenes.length) this.currentSceneIdx=this.scenes.length-1;
    }
    prevScene = () => {
        this.currentSceneIdx--;
        if(this.currentSceneIdx < 0) this.currentSceneIdx = 0;
    }
}

let composition;
document.addEventListener("DOMContentLoaded", (event)=>{
    let scenario_to_load = document.querySelector("#select_scenario").value;
    composition = new Composition();
    composition.loadScenario(scenarios[scenario_to_load]);
});