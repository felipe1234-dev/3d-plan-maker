THREE.Texture.prototype.equals = function (texture) {
    if (!texture) return false;

    let data = true;

    Object.keys(texture).forEach((key) => {
        if (["id", "uuid"].includes(key)) return;

        res = this[key] == texture[key];
    });

    return data;
};

Object.defineProperty(THREE.Texture.prototype, "editorData", {
    get: function editorData() {
        let mappingType;
        let refraction;
        let urls = [];
        let url;

        switch (this.mapping) {
            case THREE.UVMapping:
                mappingType = "UVMapping";
                break;
            case THREE.CubeReflectionMapping:
            case THREE.CubeRefractionMapping:
                mappingType = "CubeMapping";
                refraction = this.mapping == THREE.CubeRefractionMapping;
                break;
            case THREE.CubeUVReflectionMapping:
            case THREE.CubeUVRefractionMapping:
                mappingType = "CubeUVMapping";
                refraction = this.mapping == THREE.CubeUVRefractionMapping;
                break;
            case THREE.EquirectangularReflectionMapping:
            case THREE.EquirectangularRefractionMapping:
                mappingType = "EquirectangularMapping";
                refraction =
                    this.mapping == THREE.EquirectangularRefractionMapping;
                break;
        }

        let data = {
            object: this,
            type: mappingType,
        };

        if (typeof refraction !== "undefined") {
            data["refraction"] = refraction;
        }
         
        if (this.image) {
            if (Array.isArray(this.image)) {
                this.image.forEach(({ currentSrc }) => urls.push(currentSrc));
            } else {
                url = this.image.currentSrc;
            }
            
            if (urls.length > 0) {
                data["urls"] = urls;
            } else {
                data["url"] = url;
            }
        }

        return data;
    },
});
