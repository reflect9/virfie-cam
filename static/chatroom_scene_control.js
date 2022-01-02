// Defining Composition Class 
class Composition {
    scenario;
    scenes; // Array
    currentSceneIdx; // current scene index (e.g. 0,1,...)
    overlayResources;
    backgroundResources;
    soundResources;
    currentFrame;
    constructor() {
        this.currentSceneIdx = 0;
        this.overlayResources = {};
        this.backgroundResources = {};
        this.soundResources = {};
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
                    let overlayImages = {};
                    overlay.files.forEach((f,fi) => {
                        let overlay_img = new Image();
                        overlay_img.src = "/static/"+f;
                        overlay_img.filename = f;
                        overlay_img.onload = ()=>{ 
                            overlayImages[fi] = overlay_img;
                        };
                    });
                    this.overlayResources[overlay.name] = overlayImages;
                });
            }
            if(typeof scene["background"] != "undefined") {
                this.backgroundResources[scene.background.name] = {};
                scene.background.files.forEach((f,fi)=>{
                    let bg_img = new Image();
                    bg_img.src = "/static/"+f;
                    bg_img.onload = ()=>{
                        this.backgroundResources[scene.background.name][fi]=bg_img;
                    }
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
    nextScene = () => { 
        this.currentSceneIdx++; 
        if(this.currentSceneIdx >= this.scenes.length) this.currentSceneIdx=this.scenes.length-1;
    }
    prevScene = () => {
        this.currentSceneIdx--;
        if(this.currentSceneIdx <= 0) this.currentSceneIdx = 0;
    }
}

let composition;
document.addEventListener("DOMContentLoaded", (event)=>{
    let scenario_to_load = document.querySelector("#select_scenario").value;
    composition = new Composition();
    composition.loadScenario(scenarios[scenario_to_load]);
});