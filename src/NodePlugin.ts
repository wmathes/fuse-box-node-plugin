
import {copyFileSync, existsSync, readFile} from "fs";
import {File, Plugin, WorkFlowContext} from "fuse-box";
import * as glob from "glob";
import * as path from "path";
import { utils } from "realm-utils";
import { string2RegExp, hashString, joinFuseBoxPath } from "fuse-box/Utils";
import {ensureDirSync} from "fs-extra";

export interface NodePluginOptions {
    file: string;
    root?: string;
    identifier?: string;
    relativeDependencies?: string[];
}

export class NodePluginClass implements Plugin {
    public test: RegExp = /\.node$/;

    private dest: string;

    constructor(public options: NodePluginOptions) {
        if (!options || !options.file) {
            throw new Error("invalid options provided");
        }

        const identifier = options.identifier || path.basename(options.file, ".node");
        this.dest = `modules/${identifier}`;
        this.test = string2RegExp(options.file);
    }

    public init(context: WorkFlowContext) {
        context.allowExtension(".node");
    }

    protected copyDependencies(context: WorkFlowContext, patterns: string[], sourcePathAbs: string, targetDirAbs: string): void {
        patterns.forEach((pattern) => {
            glob.sync(path.join(sourcePathAbs, pattern), { nodir: true, absolute: true })
                .forEach((fileAbs: string) => {
                    const relativePath = path.relative(sourcePathAbs, fileAbs);
                    if (relativePath.indexOf("../") > -1) {
                        throw new Error(`relativePath "${relativePath}" outside of bounds. Use root-params to correct.`);
                    }
                    const targetPathAbs = path.resolve(context.output.dir, this.dest, relativePath);
                    ensureDirSync(path.dirname(targetPathAbs));
                    //console.log(`COPY ${fileAbs} => ${targetPathAbs}\n`);
                    copyFileSync(fileAbs, targetPathAbs);
                });
        })
    }

    public transform(file: File) {

        const context = file.context;
        const options = this.options;
        if (!file.info.fuseBoxPath) {
            throw new Error("file.info.fuseBoxPath is falsy");
        }

        file.isLoaded = true;

        // directories for dependency structure
        const rootDir = options.root || path.dirname((file.relativePath));
        const rootDirAbs = path.join(context.appRoot.toString(), rootDir);
        if (!existsSync(rootDirAbs)) {
            throw new Error(`root directory "${rootDirAbs}" doesn't exist`);
        }

        const destAbs = path.join(context.output.dir, this.dest);

        // filename
        let userFile = (!context.hash ? hashString(file.info.fuseBoxPath) + "-" : "") + path.basename(file.info.fuseBoxPath);
        let userDest = path.join(this.dest, path.dirname(file.info.fuseBoxPath));

        // output file path
        let userPath = path.join(userDest, userFile);

        file.alternativeContent = (`module.exports = require("./${joinFuseBoxPath(userDest, userFile)}");`);

        return new Promise((resolve: any, reject: any) => {
            readFile(file.absPath, (err, data) => {
                if (err) {
                    return reject();
                }
                return context.output.writeToOutputFolder(userPath, data, true).then(result => {
                    if (result.hash) {
                        file.alternativeContent = (`module.exports = require("./${joinFuseBoxPath(userDest, result.filename)}");`);
                    }

                    if (utils.isArray(options.relativeDependencies)) {
                        this.copyDependencies(context, options.relativeDependencies, rootDirAbs, destAbs);
                    }

                    return resolve();
                }).catch(reject);
            });
        });
    }
}

export const NodePlugin = (options: NodePluginOptions) => {
    return new NodePluginClass(options);
};
