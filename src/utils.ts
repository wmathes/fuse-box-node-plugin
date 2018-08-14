import {copyFileSync} from "fs";
import {ensureDirSync} from "fs-extra";
import * as glob from "glob";
import * as path from "path";

export function copyTree(sourcePathAbs: string, destPathAbs: string, patterns: null|string[] = ["**/*"]): Promise<any> {
    return Promise.reject("not implemented yet");
}

export function copyTreeSync(sourcePathAbs: string, destPathAbs: string, patterns: string[] = ["**/*"]): void {

    patterns.forEach((pattern) => {
        glob.sync(path.resolve(sourcePathAbs, pattern), {nodir: true, absolute: true})
            .forEach((fileAbs: string) => {
                const relativePath = path.relative(sourcePathAbs, fileAbs);
                if (relativePath.indexOf("../") > -1 || path.isAbsolute(relativePath)) {
                    throw new Error(`relativePath "${relativePath}" outside of bounds.`);
                }

                const targetPathAbs = path.resolve(destPathAbs, relativePath);
                ensureDirSync(path.dirname(targetPathAbs));

                copyFileSync(fileAbs, targetPathAbs);
            });
    });
}
