function generateGetObjectQuery(id) {
    return "options({\n" +
        "    $includeLinks: false,\n" +
        "    reorderEvents: false,\n" +
        "    processingLag: 0\n" +
        "})\n" +
        "\n" +
        "fromStream('agenda')\n" +
        ".when({\n" +
        "    $init:function(){\n" +
        "        return {\n" +
        "            count: 0\n" +
        "        }\n" +
        "    },\n" +
        "    $any: function(state, event){\n" +
        "        if (event.data !== undefined) {\n" +
        "            if (event.data.id === \"" + id + "\" \n" +
        "            || (event.data.object !== undefined && event.data.object.id === \"" + id + "\")) {\n" +
        "                state.count++;\n" +
        "                state.activity = event.data;\n" +
        "            }\n" +
        "        }\n" +
        "    }\n" +
        "})";
}

module.exports = {
    generateGetObjectQuery,
};
