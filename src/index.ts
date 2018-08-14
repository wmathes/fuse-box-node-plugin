import NodePluginClass from "./NodePluginClass";

export interface INodePluginOptions {
    file: string;
    root?: string;
    identifier?: string;
    moduleFolder?: string;
    relativeDependencies?: string[];
}

// noinspection JSUnusedGlobalSymbols
export const NodePlugin = (options: INodePluginOptions): NodePluginClass => {
    return new NodePluginClass(options);
};
