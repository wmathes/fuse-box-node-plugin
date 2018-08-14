import test from "ava";
import NodePluginClass from "./NodePluginClass";

test("new NodePlugin()", (t) => {
    // missing parameters
    t.throws(() => new NodePluginClass(undefined as any));
    t.throws(() => new NodePluginClass({} as any));

    // relative dependencies format
    t.throws(() => new NodePluginClass({
        file: "foo",
        relativeDependencies: [""]
    } as any));
    t.throws(() => new NodePluginClass({
        file: "foo",
        relativeDependencies: ["    \n   \r   \n\r  \t   "]
    } as any));
    t.throws(() => new NodePluginClass({
        file: "foo",
        relativeDependencies: ["/non/relative"]
    } as any));

    // invalid identifier
});

test("init()", (t) => {
    const plugin = new NodePluginClass({ file: "foo" });
    plugin.init({
        allowExtension: (ext: string) => {
            if (ext === ".node") {
                t.pass();
            }
            else {
                t.fail("should call allowExtension with .node argument");
            }
        }
    } as any);
});
