import test from "ava";
import * as fs from "fs-extra";
import * as glob from "glob";
import * as path from "path";
import {copyTreeSync} from "./utils";

test("copyTree()", (t) => {
    const artifacts = path.resolve(__dirname, "..", ".artifacts", "NodePluginClass", "copyDependencies");

    // purge files from earlier test
    if (fs.existsSync(artifacts)) {
        fs.removeSync(artifacts);
    }

    const sourcePath = path.join(artifacts, "source");
    const destPath = path.join(artifacts, "dest");

    const files: string[] = [
        "foo/bar/check.js",
        "foo/bar/check.dll",
        "foo/zoup/index.js",
        "foo/zoup/index.dll",
        "apples/oranges/01.png",
        "apples/oranges/02.png",
        "apples/red.jpg",
        "readme.md",
        "foo/bar/license.md",
        "face.png",
        "static/art.jpg"
    ];

    const randomContent = () => {
        const length = 10 + (Math.random() * 100);
        const chars = " ASDFGHJKLQWERTZUI23456789";
        let content = "";
        for (let i = 0; i < length; i++) {
            content += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return content;
    };

    // create fake files with random content
    files.forEach((file) => {
        const filePath = path.join(sourcePath, file);
        fs.ensureFileSync(filePath);
        fs.writeFileSync(filePath, randomContent());
    });

    // patterns
    const patterns: string[] = [
        "**/*.md", // all markdown files
        "foo/**/*.js", // javascript files in /foo
        "static/art.jpg", // specific file
        "apples/**" // all files
    ];

    // expected files
    const expected: string[] = [
        "foo/bar/check.js",
        "foo/zoup/index.js",
        "apples/oranges/01.png",
        "apples/oranges/02.png",
        "apples/red.jpg",
        "readme.md",
        "foo/bar/license.md",
        "static/art.jpg"
    ].sort();

    // test
    copyTreeSync(sourcePath, destPath, patterns);

    const copied = glob
        .sync(path.join(destPath, "**/*"), {nodir: true, absolute: true})
        .map((p) => path.relative(destPath, p).split("\\").join("/")) // cross-platform
        .sort();

    t.deepEqual(copied, expected, "should have copied these files");
});
