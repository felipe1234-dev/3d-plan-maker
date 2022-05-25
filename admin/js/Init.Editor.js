jQuery(document).ready(function ($) {
    const canvasContainer = $("#viewport")[0];
    const model = new ThreeDModel(canvasContainer);

    const postModel = JSON.parse($("#post-model").val());
    model.loadModel(postModel);

    const postRenderer = JSON.parse($("#post-renderer").val());
    model.loadRenderer(postRenderer); 

    const modelEditor = new Editor(model);

    modelEditor.on("saveModel", (json) =>
        $("#post-model").val(JSON.stringify(json))
    );
    
    modelEditor.on("saveRenderer", (json) =>
        $("#post-renderer").val(JSON.stringify(json))
    );

    modelEditor.init();
    
    PlanMaker.editor = modelEditor;
});