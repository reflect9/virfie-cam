scenarios["emotion_tracker"] = {
    "scenes":[
        {
            "title": "Emotion Tracker",
            "audio": undefined,
            "players": {
                "1": {
                    "z-index": 100,
                    "x": "20%",
                    "y": "0%",
                    "scale": "100%"
                },
                "2": {
                    "z-index": 101,
                    "x": "30%",
                    "y": "20%",
                    "scale": "85%"
                },
                "3": {
                    "z-index": 102,
                    "x": "70%",
                    "y": "-20%",
                    "scale": "65%"
                }
            },
            "overlays": [
                {
                    "name":"sun",
                    "files": [
                        "scenarios/2. emotion tracker/image/sun.png"
                    ]
                },
                {
                    "name":"cloud",
                    "files": [
                        "scenarios/2. emotion tracker/image/cloud.png"
                    ]
                },
                {
                    "name":"rain",
                    "files": [
                        "scenarios/2. emotion tracker/image/rain.png"
                    ]
                },
                {
                    "name":"thunder",
                    "files": [
                        "scenarios/2. emotion tracker/image/thunder.png"
                    ]
                }
            ],
            "triggers": {
                "tracking_emotions": {
                    "conditions": {
                        "type":"pass"
                    },
                    "actions": {
                        "weather_icon_tracker":{
                            "method": "weather_icon_tracker",
                            "interval_in_seconds":5
                        },
                        
                    }
                }
            },
            "background": "scenarios/2. emotion tracker/image/high resolution background/emotion tracker background.jpg"
        }
    ]
};


filters["weather_icon_tracker"] = (originalCanvas, segmentations, comp_setting)=>{
    // Attaching weather icons to the segmentations
    let path = "scenarios/2. emotion tracker/";
    if (typeof composition.timer == "undefined") {
        composition.timer = 0;
        composition.overlay_keys_shuffled = _.map(comp_setting.overlays, o=>{return o.name;});
    }
    if (composition.timer < 10 * comp_setting.triggers.tracking_emotions.actions.weather_icon_tracker.interval_in_seconds) {
        // keep the current order of icons
        composition.timer++;
    } else {
        // make random ordered icons 
        composition.timer = 0;
        composition.overlay_keys_shuffled = _.shuffle(composition.overlay_keys_shuffled);
    }
    let nose_positions = _.map(segmentations, (playerSegmentation,playerID)=>{
        if (playerID=="local_vid") playerID = myName;
        let anchor_obj = playerSegmentation.allPoses[0].keypoints
            .filter(p=>{return p.part=="nose"; })[0];
        if (anchor_obj.score < 0.1) return false;  
        let anchor_original = anchor_obj.position;
        let anchor = {
            x: 800 - anchor_original.x,
            y: anchor_original.y
        };
        let cs = comp_setting.players[playerID];  // cs means composition setting for the video
        let video_x = 800 * (parseFloat(cs.x.replace("%",""))/100);
        let video_y = 600 * (parseFloat(cs.y.replace("%",""))/100);
        let video_width = 800 * (parseFloat(cs.scale.replace("%",""))/100);
        let video_height = 600 * (parseFloat(cs.scale.replace("%",""))/100);
        let anchorX_on_comp = video_x + (anchor.x * (video_width / 800));
        let anchorY_on_comp = video_y + (anchor.y * (video_height / 600));
        return {
            "x":anchorX_on_comp, "y":anchorY_on_comp
        }
    });
    let ctx = originalCanvas.getContext("2d");
    nose_positions.forEach((pos,i) =>{
        let overlay_name = composition.overlay_keys_shuffled[i];
        let overlay_img_dict = composition.overlayResources[overlay_name];
        let overlay_img_list = Object.keys(overlay_img_dict).sort().map(i=>{return overlay_img_dict[i];});
        let overlay_img;
        if (overlay_img_list.length == 1) overlay_img = overlay_img_list[0];
        else { // For multiple images, pick the right frame
            let img_frame = Math.ceil(new Date().getTime() / 200) % overlay_img_list.length;
            console.log("FRAME:" + img_frame);
            overlay_img = overlay_img_list[img_frame];
        }
        let width = 200; let height = (width / overlay_img.width) * overlay_img.height;
        ctx.drawImage(overlay_img, pos.x-(width/2), pos.y-(height/2)-300, width, height);
    });
    return ctx;
}


function drawRotated(image, degrees){
    let canvas = document.createElement("canvas");
    var ctx=canvas.getContext("2d");
    
    if(degrees == 90 || degrees == 270) {
		canvas.width = image.height;
		canvas.height = image.width;
    } else {
		canvas.width = image.width;
		canvas.height = image.height;
    }
    
    ctx.clearRect(0,0,canvas.width,canvas.height);
    if(degrees == 90 || degrees == 270) {
		ctx.translate(image.height/2,image.width/2);
    } else {
	    ctx.translate(image.width/2,image.height/2);
   }
    ctx.rotate(degrees*Math.PI/180);
    ctx.drawImage(image,-image.width/2,-image.height/2);
    
    return canvas;
}
