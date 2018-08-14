import test from "ava";
import {NodePlugin} from "./index";

test("NodePlugin()", (t) => {
    t.is(
        "NodePluginClass",
        NodePlugin({file: "foo"}).constructor.name,
        "should return instance of NodePluginClass"
    );
});
