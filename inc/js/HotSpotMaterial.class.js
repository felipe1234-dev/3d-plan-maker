class HotSpotMaterial extends THREE.SpriteMaterial {
    constructor(parameters) {
        super();
        this.type = "HotSpotMaterial";
        
        parameters = {
            color: new THREE.Color(0xffc107),
            fontStyle: "normal",
            fontVariant: "normal",
            fontWeight: "normal",
            fontSize: 24,
            fontFamily: "Arial",
            text: "H",
            hovText: "",
            textColor: new THREE.Color(0xFFFFFF),
            textAlign: "center",
            ...parameters
        }
        
        const {
            color, 
            fontStyle, 
            fontVariant, 
            fontWeight,
            fontSize,
            fontFamily,
            text,
            hovText,
            textColor,
            textAlign,
            ...rest
        } = parameters;
        
        this.color = color;
        this.fontStyle = fontStyle;
        this.fontVariant = fontVariant;
        this.fontWeight = fontWeight;
        this.fontSize = fontSize;
        this.fontFamily = fontFamily;
        this.text = text;
        this.hovText = hovText;
        this.textColor = textColor;
        this.textAlign = textAlign; 
        
        if (typeof color == "number") 
            this.color = new THREE.Color(color);
        
        if ([ "italic", "oblique" ].includes(fontStyle))
            this.fontStyle = fontStyle;
        
        if (fontVariant == "small-caps")
            this.fontVariant = "small-caps";
        
        if ([ "bold", "bolder", "lighter" ].includes(fontWeight))
            this.fontWeight = fontWeight;
        
        if (parseInt(fontWeight) >= 100 && parseInt(fontWeight) <= 900)
            this.fontWeight = parseInt(fontWeight);
        
        if (typeof fontSize == "number")
            this.fontSize = parseFloat(fontSize);
        
        if (typeof fontFamily == "string")
            this.fontFamily = fontFamily;
            
        if (typeof text == "string")
            this.text = text;
            
        if (typeof hovText == "string")
            this.hovText = hovText;
            
        if (typeof textColor == "number") 
            this.textColor = new THREE.Color(textColor);
        
        if ([ "start", "end", "left", "right" ].includes(textAlign))
            this.textAlign = textAlign;
            
        this.setValues(rest);
        this.needsUpdate = true;
    }
    
    #setTexture() {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        
        const width = 64;
        const height = 64;
        const radius = 50;
        
        canvas.width = width;
        canvas.height = height;
        
        ctx.beginPath();
        ctx.arc(width/2, height/2, radius, 0, 2*Math.PI);
        ctx.closePath();
        ctx.fillStyle = this.color.getStyle();
        ctx.fill();

        if (this.text) {
            let font = "";
            
            font += `${this.fontStyle} `;
            font += `${this.fontVariant} `;
            font += `${this.fontWeight} `;
            font += `${this.fontSize}px `;
            font += this.fontFamily;
            
            ctx.font = font;
            ctx.textAlign = this.textAlign;
            ctx.fillStyle = this.textColor.getStyle();
            ctx.fillText(this.text, width/2, height*0.6);
        }

        this.map = new THREE.CanvasTexture(canvas);
        this.toneMapped = false;
    }
    
    set needsUpdate(value) {
        if (value === true) {
            this.#setTexture();
            this.version++;
        }
    } 
    
    copy(source) {
        super.copy(source);
        
        this.color = source.color;
        this.fontStyle = source.fontStyle; 
        this.fontVariant = source.fontVariant;
        this.fontWeight = source.fontWeight;
        this.fontSize = source.fontSize;
        this.fontFamily = source.fontFamily;
        this.text = source.text;
        this.hovText = source.hovText;
        this.textColor = source.textColor;
        this.textAlign = source.textAlign;
        this.#setTexture();
        
        return this;
    }
    
    toJSON(meta) {
        let data = super.toJSON(meta);
        
        data.color = this.color;
        data.fontStyle = this.fontStyle; 
        data.fontVariant = this.fontVariant;
        data.fontWeight = this.fontWeight;
        data.fontSize = this.fontSize;
        data.fontFamily = this.fontFamily;
        data.text = this.text;
        data.hovText = this.hovText;
        data.textColor = this.textColor;
        data.textAlign = this.textAlign;
        
        return data;
    }
}

THREE.HotSpotMaterial = HotSpotMaterial;
/*
const old = THREE.MaterialLoader.prototype.parse;

THREE.MaterialLoader.prototype.parse = function(json) {
    const isHotSpotMaterial = json.type == "HotSpotMaterial";
    
    if (isHotSpotMaterial)
        json.type = "SpriteMaterial";
    
    let material = old.call(this, json);
    
    if (isHotSpotMaterial) {
        material.color = json.color;
        material.fontStyle = json.fontStyle; 
        material.fontVariant = json.fontVariant;
        material.fontWeight = json.fontWeight;
        material.fontSize = json.fontSize;
        material.fontFamily = json.fontFamily;
        material.text = json.text;
        material.hovText = json.hovText;
        material.textColor = json.textColor;
        material.textAlign = json.textAlign;
        
        const { name, }
        material = new THREE.HotSpotMaterial({ ...material });
    }
        
    return material;
}*/