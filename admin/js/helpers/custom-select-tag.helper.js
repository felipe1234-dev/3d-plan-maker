// setando funcionalidades atípicas para algumas tags <select />
jQuery(document).ready(function ($) {
    $("[for-select]").each(function () {
        const selectbox = $("#" + $(this).attr("for-select"))[0];

        $(selectbox).on("input syncSelectTagHelper", () => {
            if ($(this).attr("show-when-value")) {
                if (
                    $(this).attr("show-when-value").includes(selectbox.value) &&
                    selectbox.value
                ) {
                    $(this).show();
                } else {
                    $(this).hide();
                }
            }

            if ($(this).attr("show-when-value-not")) {
                if (
                    !$(this)
                        .attr("show-when-value-not")
                        .includes(selectbox.value) &&
                    selectbox.value
                ) {
                    $(this).show();
                } else {
                    $(this).hide();
                }
            }
        });
    });
});
