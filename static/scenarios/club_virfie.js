scenarios["club_virfie"]  = {
    "scenes":[
        {
            "title": "Club Entrance",
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
                                "right":"80%",
                                "left":"20%",
                                "bottom":"80%"
                            }
                        }
                    },
                    "actions": {
                        "taking random snapshots": {
                            "method":"random_snapshots",
                            "params": {
                                "interval_in_seconds":2,
                                "area":{
                                    "top":"20%",
                                    "right":"80%",
                                    "left":"20%",
                                    "bottom":"80%"
                                }
                            }
                        }
                    }
                }
            },
            "background": "scenarios/3. club virfie/images/high resolution background/Club Virfie Entrance.jpg"
        },
        {
            "title": "Bar",
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
                    "filename":"virfie_beer.png",
                    // "position": {
                    //     "type": "coordinate",
                    //     "x":50,
                    //     "y":100
                    // }
                    "position":{
                        "type": "tracking",
                        "player":"1",
                        "body_part": "rightWrist",
                        "offset":{
                            "x":90,
                            "y":-10
                        },
                        "scale": 4
                    }
                }
            ]
        }
    ]
};