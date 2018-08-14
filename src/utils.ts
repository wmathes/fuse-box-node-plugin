import {copyFileSync} from "fs";
import {ensureDirSync} from "fs-extra";
import * as glob from "glob";
import * as path from "path";

export function copyTreeSync(patterns: string[], sourcePathAbs: string, destPathAbs: string): void {
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
