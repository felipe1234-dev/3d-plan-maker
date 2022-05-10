Object.defineProperty(THREE.Fog.prototype, "editorData", {
    get: function editorData() {
        let data = {};

        const { r, g, b } = this.color;
        const color = new THREE.Color(r, g, b);

        data["color"] = color.getHexString();
        data["near"] = this.near;
        data["far"] = this.far;

        return {
            type: "Linear",
            ...data,
        };
    },
}); 
