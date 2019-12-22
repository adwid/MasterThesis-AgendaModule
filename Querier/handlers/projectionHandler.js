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

function generateGetActorActivitiesQuery(actor) {
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
        "            list: []\n" +
        "        }\n" +
        "    },\n" +
        "    $any: function(state, event){\n" +
        "        if (event.data.actor === \"" + actor + "\") state.list.push(event.data)\n" +
        "    }\n" +
        "})";
}

function generateGetRecipientActivitiesQuery(recipient) {
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
        "            list: []\n" +
        "        }\n" +
        "    },\n" +
        "    $any: function(state, event){\n" +
        "        if (event.data.to.includes(\"" + recipient + "\")) state.list.push(event.data)\n" +
        "    }\n" +
        "})";
}

module.exports = {
    generateGetActorActivitiesQuery,
    generateGetObjectQuery,
    generateGetRecipientActivitiesQuery,
};
