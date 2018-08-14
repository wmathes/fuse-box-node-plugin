import {existsSync, readFile} from "fs";
import {File, Plugin, WorkFlowContext} from "fuse-box";
import {hashString, joinFuseBoxPath, string2RegExp} from "fuse-box/Utils";
import * as path from "path";
import {utils} from "realm-utils";
import {copyTreeSync} from "./utils";
import {INodePluginOptions} from "./index";

export default class NodePluginClass implements Plugin {
    public test: RegExp = /\.node$/;

    private readonly dest: string;

    constructor(public options: INodePluginOptions) {
        if (!options || !options.file) {
            throw new Error("invalid options provided");
        }

        if (utils.isArray(options.relativeDependencies)) {
            if (options.relativeDependencies
                .filter((rd) =>
                    !utils.isString(rd)
                    || !rd.trim()
                    || path.isAbsolute(rd))
                .length > 0) {
                throw new Error("invalid relative dependencies. all entries must be relative path strings.");
            }
        }

        if (options.identifier) {
            // not exactly perfect check, but should cover most scenarios
            if (!/\^[a-zA-Z0-9 .-_]+asd$/.test(options.identifier)) {
                throw new Error("invalid identifier. must be directory-name compatible string.");
            }
        }
        else {
            options.identifier = path.basename(options.file, ".node");
        }

        this.dest = `modules/${options.identifier}`;
        this.test = string2RegExp(options.file);
    }

    public init(context: WorkFlowContext): void {
        context.allowExtension(".node");
    }

    public transform(file: File): Promise<any> {

        const context = file.context;
        const options = this.options;
        if (!file.info.fuseBoxPath) {
            throw new Error("file.info.fuseBoxPath is falsy");
        }

        file.isLoaded = true;

        // directories for dependency structure
        const rootDir = options.root || path.dirname((file.relativePath));
        const rootDirAbs = path.resolve(context.appRoot.toString(), rootDir);
        if (!existsSync(rootDirAbs)) {
            throw new Error(`root directory "${rootDirAbs}" doesn't exist`);
        }

        // filename
        const userFile = (!context.hash ? hashString(file.info.fuseBoxPath) + "-" : "") + path.basename(file.info.fuseBoxPath);
        const userDest = path.join(this.dest, path.dirname(file.info.fuseBoxPath));

        // output file path
        const userPath = path.join(userDest, userFile);

        file.alternativeContent = `module.exports = require("./${joinFuseBoxPath(userDest, userFile)}");`;

        return new Promise((resolve: any, reject: any) => {
            readFile(file.absPath, (err, data) => {
                if (err) {
                    return reject();
                }

                return context.output
                    .writeToOutputFolder(userPath, data, true)
                    .then((result) => {
                        if (result.hash) {
                            file.alternativeContent = `module.exports = require("./${joinFuseBoxPath(userDest, result.filename)}");`;
                        }

                        if (utils.isArray(options.relativeDependencies)) {
                            copyTreeSync(options.relativeDependencies, rootDirAbs, path.resolve(context.output.dir, this.dest));
                        }

                        return resolve();
                    })
                    .catch(reject);
            });
        });
    }
}
