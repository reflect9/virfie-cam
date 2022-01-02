scenarios["club_virfie"]  = {
    "scenes":[
        {
            "title": "Club Entrance",
            "audio": "/static/scenarios/3. club virfie/sound/club entrance.mp3",
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
                }
            },
            "triggers": {
                "gather_at_center": {
                    "conditions": {
                        "checking everyone is at the center": {
                            "type": "positions",
                            "segments": {
                                "players":"ALL",
                                "body_part":"nose"
                            },
                            "area": {
                                "top":"20%",
                                "right":"70%",
                                "left":"30%",
                                "bottom":"80%"
                            }
                        }
                    },
                    "actions": {
                        "taking random snapshots": {
                            "method":"random_snapshots",
                            "params": {
                                "interval_in_seconds":2
                            }
                        }
                    }
                }
            },
            "background": "scenarios/3. club virfie/images/high resolution background/Club Virfie Entrance.jpg"
        },
        {
            "title": "Bar",
            "audio": "/static/scenarios/3. club virfie/sound/club bar.mp3",
            "players": {
                "1": {
                    "z-index": 100,
                    "x": "-10%",
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
                    "x": "10%",
                    "y": "30%",
                    "scale": "75%"
                }
            },
            "background": "scenarios/3. club virfie/images/high resolution background/Club Virfie Bar Background without table.jpg",
            "overlays": [
                {
                    "name":"beer1",
                    "files":
                        [
                            "scenarios/3. club virfie/images/Club Virfie Bar Beer Glass.png"
                        ],
                    "position":{
                        "type": "tracking",
                        "player":"1",
                        "body_part": "rightWrist",
                        "offset":{
                            "x":130,
                            "y":40
                        },
                        "scale": 1.5
                    }
                },
                {
                    "name":"beer2",
                    "files":
                        [
                            "scenarios/3. club virfie/images/Club Virfie Bar Beer Glass.png"
                        ],
                    "position":{
                        "type": "tracking",
                        "player":"2",
                        "body_part": "leftWrist",
                        "offset":{
                            "x":90,
                            "y":-10
                        },
                        "scale": 1
                    }
                },
                {
                    "name":"beer3",
                    "files":
                        [
                            "scenarios/3. club virfie/images/Club Virfie Bar Beer Glass.png"
                        ],
                    "position":{
                        "type": "tracking",
                        "player":"3",
                        "body_part": "leftWrist",
                        "offset":{
                            "x":90,
                            "y":-10
                        },
                        "scale": 1
                    }
                },
                {
                    "name":"cheers_effect",
                    "files": [
                        "scenarios/3. club virfie/images/cheers/1.png",
                        "scenarios/3. club virfie/images/cheers/2.png",
                        "scenarios/3. club virfie/images/cheers/3.png",
                        "scenarios/3. club virfie/images/cheers/4.png",
                        "scenarios/3. club virfie/images/cheers/5.png",
                        "scenarios/3. club virfie/images/cheers/6.png",
                        "scenarios/3. club virfie/images/cheers/7.png",
                        "scenarios/3. club virfie/images/cheers/8.png",
                    ]
                },
            ],
            "triggers": {
                "beer_at_center": {
                    "conditions": {
                        "checking every beer is at the center": {
                            "type": "positions",
                            "segments_each_player": {
                                "1": {
                                    "body_part":"rightWrist"
                                },
                                // "2": {
                                //     "body_part":"leftWrist"
                                // },
                                // "3": {
                                //     "body_part":"rightWrist"
                                // }
                            },
                            "area": {
                                "top":"55%",
                                "right":"55%",
                                "left":"45%",
                                "bottom":"85%"
                            }
                        }
                    },
                    "actions": {
                        "cheers": {
                            "method":"cheers",
                            "params": {
                            }
                        }
                    }
                }
            },
        },
        {
            "title": "Dancehall",
            "players": {
                "1": {
                    "z-index": 100,
                    "x": "-10%",
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
                    "x": "10%",
                    "y": "30%",
                    "scale": "75%"
                }
            },
            "backgrounds": [
                "scenarios/3. club virfie/images/high resolution background/Dance Hall Package/background.gif",
                "scenarios/3. club virfie/images/high resolution background/Dance Hall Package/crowd.gif"
            ],
            "overlays": [
            ]
        }
    ]
};

filters["cheers"] = (originalCanvas)=>{
    console.log("cheers");
    let ctx = originalCanvas.getContext("2d");
    let overlay_img_dict = composition.overlayResources["cheers_effect"];
    let overlay_frames = Object.keys(overlay_img_dict).sort().map(i=>{return overlay_img_dict[i];});
    let cur_frame;
    if (overlay_frames.length == 1) cur_frame = overlay_frames[0];
    else { // For multiple images, pick the right frame
        let img_frame = Math.ceil(new Date().getTime() / 200) % overlay_frames.length;
        // console.log("FRAME:" + img_frame);
        cur_frame = overlay_frames[img_frame];
    }
    let pos = {"x":400, "y":300};  // center position for the cheers effect
    let width = 400; let height = (width / cur_frame.width) * cur_frame.height;
    ctx.drawImage(cur_frame, pos.x-(width/2), pos.y-(height/2)-100, width, height);
    return ctx;
}

filters["random_snapshots"] = (originalCanvas, snapshotInterval)=>{
    // Set up a timer in the composition element -> Taking photos every interval
    let currentTimestamp = new Date().getTime();
    if (typeof composition.lastTimestamp == "undefined") {
        composition.lastTimestamp = currentTimestamp;
        composition.photoFrame = {
            center: {  // Random center of the photo frame
                x: (800 / 2) + ((Math.random() - 0.5)*300),
                y: (600 / 2) + ((Math.random() - 0.5)*200)
            },
            angle: (Math.random()-0.5) * Math.PI / 10  // Random rotation angle
        }
    }
    let timeElapsed = currentTimestamp - composition.lastTimestamp;
    if (timeElapsed < snapshotInterval * 1000) { 
        // Just update the label (without taking picture)
        let ctx = originalCanvas.getContext("2d");
        ctx.strokeStyle = 'white'; ctx.lineWidth = 10;
        let frameWidth =320;  let frameHeight = 240;
        let frameX = composition.photoFrame.center.x - frameWidth/2;
        let frameY = composition.photoFrame.center.y - frameHeight/2;
        ctx.strokeRect(frameX, frameY, frameWidth, frameHeight);
    } else {
        let frameWidth =320;  let frameHeight = 240;
        let frameX = composition.photoFrame.center.x - frameWidth/2;
        let frameY = composition.photoFrame.center.y - frameHeight/2;
        take_snapshot_framed(frameX, frameY, frameWidth, frameHeight, 0);
        // Start the next interval & randomly generate the photoframe position and angle
        composition.lastTimestamp = currentTimestamp;
        composition.photoFrame = {
            center: {  // Random center of the photo frame
                x: (800 / 2) + ((Math.random() - 0.5)*300),
                y: (600 / 2) + ((Math.random() - 0.5)*200)
            },
            angle: (Math.random()-0.5) * Math.PI / 10  // Random rotation angle
        }
        return;
    }
}