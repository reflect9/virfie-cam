scenarios["space_wiggle"]= {
    "scenes":[
        {
            "title": "Space Wiggle",
            "audio": "",
            "players": {
                "1": {
                    "z-index": 100,
                    "x": "-10%",
                    "y": "20%",
                    "scale": "85%"
                 },
                 "2": {
                    "z-index": 101,
                    "x": "10%",
                    "y": "37%",
                    "scale": "90%"
                 },
                "3": {
                    "z-index": 102,
                    "x": "30%",
                    "y": "30%",
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
                                "top":"0%",
                                "right":"70%",
                                "left":"30%",
                                "bottom":"100%"
                            }
                        }
                    },
                    "actions": {
                        "wiggle the center area": {
                            "method":"image_filter",
                            "params": {
                                "filter": {
                                    "type":"twirl",
                                    "cycle":1000, // 1000 =1 sec for each cycle
                                    "angle":10,    // 5 means 360 * 5 rotated 
                                }
                            }
                        }
                    }
                }
            },
            "background": {
                "name":"Space Wiggle",
                "files": [
                    "scenarios/1. space wiggle/high resolution background/space wiggle background without cloud.jpg"
                ]
            }    
        }
    ]
};

filters["twirl"] = (originalCanvas, cyclePeriod, angle)=>{
    // Using timestamp to find the current angle
    let timeIdx = Math.sin(new Date().getTime() / cyclePeriod) * angle; // moving between -angle and +angle
    var glCanvas = fx.canvas(); // creating a new canvas using the glfx library
    var texture = glCanvas.texture(originalCanvas);
    glCanvas.draw(texture).swirl(400, 300, 400, timeIdx).update();
    // glCanvas.draw(texture).hexagonalPixelate(400, 300, 10).update();
    return glCanvas;
}
