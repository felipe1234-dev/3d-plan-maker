class ContextSelector {
    #model;
    #memory;
    #selectedScene
    constructor(model) {
        this.#model         = model;
        this.#memory        = {};
        this.#selectedScene = "";
        
        Object.entries(model.scenes).forEach(([sceneName, sceneObj]) => {
            console.log(sceneObj)
            this.#memory[sceneObj.uuid] = {
                opacityFactor: sceneObj.userData.opacityFactor
            };
            
            sceneObj.children.forEach((object) => {
                if ("material" in object) {
                    this.#memory[sceneObj.uuid][object.uuid] = object.material.opacity;
                }
            });
        });
        
        const firstScene = Object.keys(model.scenes)[0];
        this.select(firstScene);
    }

    select(toSelectSceneName) {
        if (!(toSelectSceneName in this.#model.scenes)) {
            return;
        }
        
        const toSelectSceneObj = this.#model.scenes[toSelectSceneName];
        
        Object.entries(this.#model.scenes).forEach(([sceneName, sceneObj]) => {            
            sceneObj.children.forEach((object) => {
                if ("material" in object) {
                    object.material.transparent = true;

                    if (sceneObj.uuid in this.#memory) {
                        object.material.opacity = this.#memory[sceneObj.uuid][object.uuid];
                            
                        if (sceneName !== toSelectSceneName) {
                            object.material.opacity *= this.#memory[toSelectSceneObj.uuid].opacityFactor;
                        }
                        
                        if (object.material.opacity > 1)
                            object.material.opacity = 1;

                        if (object.material.opacity < 0)
                            object.material.opacity = 0;
                    }

                    object.material.needsUpdate = true;
                }
            });
        });

        this.#selectedScene = toSelectSceneObj;
    }
}