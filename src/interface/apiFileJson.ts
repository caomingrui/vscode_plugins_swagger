import { HttpStatusCode, Method } from "axios";
declare namespace APITyep {
    type ApiFileJsonInstance = {
        apiHashMap: Map<string, any>;
        apiDtoModuleHashMap: Map<string, any>;
        filePath: string;
        initStatus: Promise<any>;
        initPromise: Promise<any>;
        // >>> function star >>>
        readFile: (filePath: string) => Promise<string>;
        eachApiPaths: (paths: any) => void;
        eachRenderDto: (definitions: any) => void;
        getApiHashMap: () => Promise<Map<string, any>>;
    };
    
    type ApiFileJsonProps = {
        filePath?: string;
    };
    
    type ApiFileJsonConstructor = {
        new(props?: ApiFileJsonProps): ApiFileJsonInstance;
    };


    type ParametersItems = {
        in: string;
        name: string;
        description: string;
        required: boolean;
        schema: {
            originalRef?: string;
            $ref?: string;
        }
    };
    type ResponsesCode = typeof HttpStatusCode[keyof typeof HttpStatusCode];
    type PathsTypeItems = {
        tags?: string[];
        summary?: string;
        description?: string;
        operationId?: string;
        consumes?: string[];
        produces?: string[];
        responses?: Record<ResponsesCode, any>
        parameters?: Partial<ParametersItems>[];
        responsesObject?: Record<string, any>;
        security?: any;
        deprecated?: boolean;
        ['x-order']?: string;
    };
    type PathsType = {
        [k in Method]: PathsTypeItems;
    };

    type DefinitionsType = {
        type: string;
        properties: Record<string, {
            type: string;
            description: string;
            format?: string;
        }>
    };
}

export = APITyep;