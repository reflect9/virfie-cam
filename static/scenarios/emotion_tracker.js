scenarios["emotion_tracker"] = {
    "scenes":[
        {
            "title": "Emotion Tracker",
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
                { "filename":"scenarios/2. emotion tracker/cloud.png" },
                { "filename":"scenarios/2. emotion tracker/sun.png" },
                { "filename":"scenarios/2. emotion tracker/rain.png" },
                { "filename":"scenarios/2. emotion tracker/thunder.png" }
            ],
            "triggers": {
                "tracking_emotions": {
                    "conditions": {
                        "type":"pass"
                    },
                    "actions": {
                        "weather_icon_tracker":{
                            "method": "weather_icon_tracker"
                        }
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
    let weather_icons = [
        "cloud.png", "sun.png", "rain.png", "thunder.png"
    ];
    if (typeof composition.timer == "undefined") composition.timer = 0;
    if (composition.timer < 50) {
        // keep the current order of icons
        composition.timer++;
    } else {
        // make random ordered icons 
        composition.timer = 0;
        composition.weather_icons = _.shuffle(weather_icons);
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
        let filename = path+composition.weather_icons[i];
        let icon = composition.overlayResources[filename];
        let width = 200; let height = (width / icon.width) * icon.height;
        ctx.drawImage(icon, pos.x-(width/2), pos.y-(height/2)-300, width, height);
    });
    return ctx;
}

