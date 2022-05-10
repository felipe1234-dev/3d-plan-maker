class HotSpot extends THREE.Sprite {
    constructor(material) {
        super();
        this.type = "HotSpot";
        
        this.material = material instanceof THREE.HotSpotMaterial ? material : new THREE.HotSpotMaterial();
        this.geometry = new THREE.CircleGeometry(0.2, 128);
    }
    
    #getScreenPos = (renderer, camera) => {
        let pos = new THREE.Vector3();
        pos = pos.setFromMatrixPosition(this.matrixWorld);
        pos.project(camera);

        const { 
            offsetWidth: canvasWidth, 
            offsetHeight: canvasHeight 
        } = renderer.domElement;
        
        const widthHalf = canvasWidth/2;
        const heightHalf = canvasHeight/2;

        pos.x = (pos.x * widthHalf) + widthHalf;
        pos.y = - (pos.y * heightHalf) + heightHalf;
        pos.z = 0;
        
        return pos;
    }
    
    hover(renderer, camera, callback = null) {
        const pos = this.#getScreenPos(renderer, camera); 

        if (callback)
            callback(pos, this);
    }
    
    click(callback = null) {
        const pos = this.#getScreenPos(); 

        if (!callback) {
            this.events.onHover(pos);
        } else {
            callback(pos);
        }
    }
}

THREE.HotSpot = HotSpot;
/*
const old = THREE.ObjectLoader.prototype.parseObject;

THREE.ObjectLoader.prototype.parseObject = function(data, geometries, materials, textures, animations) {
    if (data.type == "HotSpot") {
        
    }
    
    const material = old.call(this, data, geometries, materials, textures, animations);
    
    return material;
}*/