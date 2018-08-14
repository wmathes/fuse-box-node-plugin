import {existsSync, readFile} from "fs";
import {File, Plugin, WorkFlowContext} from "fuse-box";
import {hashString, joinFuseBoxPath, string2RegExp} from "fuse-box/Utils";
import * as path from "path";
import {utils} from "realm-utils";
import {INodePluginOptions} from "./index";
import {copyTreeSync} from "./utils";

export default class NodePluginClass implements Plugin {

    public test: RegExp;

    constructor(public options: INodePluginOptions) {
        if (!options || !options.file) {
            throw new Error("invalid options provided");
        }

        // defaults
        options.moduleFolder = options.moduleFolder || "modules";
        options.identifier = options.identifier || path.basename(options.file, ".node");
        options.relativeDependencies = options.relativeDependencies || [];
        options.root = options.root || undefined;

        // validations
        // ... relative dependencies
        const invalidRelativeDependencies = options.relativeDependencies
            .filter((rd) =>
                !utils.isString(rd)
                || !rd.trim()
                || path.isAbsolute(rd));
        if (invalidRelativeDependencies.length > 0) {
            throw new Error("invalid relative dependencies. all entries must be relative path strings.");
        }

        // ... identifier
        if (!/^[a-zA-Z0-9 ._-]+$/.test(options.identifier)) {
            throw new Error("invalid identifier. must be directory-name compatible string: " + options.identifier);
        }

        // ... module folder
        if (!/^[a-zA-Z0-9 ._-]+$/.test(options.moduleFolder)) {
            throw new Error("invalid module folder. must be directory-name compatible string: " + options.moduleFolder);
        }

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
        const dest = `${options.moduleFolder}/${options.identifier}`;
        const userFile = (!context.hash ? hashString(file.info.fuseBoxPath) + "-" : "") + path.basename(file.info.fuseBoxPath);
        const userDest = path.join(dest, path.dirname(file.info.fuseBoxPath));

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
                            copyTreeSync(rootDirAbs, path.resolve(context.output.dir, dest), options.relativeDependencies);
                        }

                        return resolve();
                    })
                    .catch(reject);
            });
        });
    }
}
